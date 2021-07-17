import math
from time import sleep

import alpaca_trade_api.rest as alpaca
import pandas as pd
from stockstats import StockDataFrame

from trading_scripts.utils.constants import (
    ATR_MULTIPLIER,
    HISTORICAL_DATA_INTERVAL,
    HISTORICAL_DATA_PERIOD,
    MAX_DRAWDOWN_PCT,
)
from trading_scripts.utils.helpers import (
    create_client,
    get_historical_data,
    get_last_quote,
    get_positions,
    is_market_open,
)
from trading_scripts.utils.logger import log


class Buyer:
    symbol: str = ""
    positions: list[dict] = []
    data: pd.DataFrame = None
    api: alpaca = None

    def __init__(self, symbol: str = "", cash: float = None) -> None:
        self.symbol = symbol
        self.api = create_client()
        self.positions = get_positions()
        self.is_market_open: bool = is_market_open()
        if self.symbol:
            self.data = self.__get_data()
        self._cash = cash

    def __get_data(self):
        return StockDataFrame.retype(
            get_historical_data(
                self.symbol,
                interval=HISTORICAL_DATA_INTERVAL,
                period=HISTORICAL_DATA_PERIOD,
            )
        )

    @property
    def position_symbols(self):
        return map(lambda position: position.symbol, self.positions)

    @property
    def symbol_is_in_portfolio(self):
        return self.symbol in self.position_symbols

    def submit_order(
        self,
        side: str,
        qty: float,
        type: str = "market",
        time_in_force: str = "day",
        **kwargs,
    ) -> alpaca.Order:
        return self.api.submit_order(
            symbol=self.symbol,
            qty=qty,
            side=side,
            type=type,
            time_in_force=time_in_force,
            **kwargs,
        )

    def sma_crossover_signal(self):
        sma_fast = self.data.get("close_10_sma")
        sma_slow = self.data.get("close_25_sma")
        return sma_fast.gt(sma_slow).iloc[-1]

    def get_drawdown_points(self, factor: float):
        atr = self.data.get("atr").iloc[-1]
        output = factor * atr
        return round(output, 2)

    @property
    def available_cash(self):
        if self._cash and not self.is_market_open:
            return self._cash
        account = self.api.get_account()
        return round(float(account.cash), 2)

    @property
    def last_price(self):
        return get_last_quote(self.symbol)

    def get_trailing_stop_loss_points(
        self, price: float, get_drawdown_points: float = 5.0
    ):
        return min(
            self.get_drawdown_points(get_drawdown_points),
            round(price * MAX_DRAWDOWN_PCT, 2),
        )

    def calc_position_size(self):
        # Position Size = (Total Trading Account Size X Risk Percentage) / Distance to Stop Loss from entry
        available_cash = self.available_cash
        risk_pct = 0.05
        last_price = self.last_price
        distance_to_stop = last_price / self.get_drawdown_points(ATR_MULTIPLIER)
        position_qty = (available_cash * risk_pct) / distance_to_stop
        return math.floor(position_qty)

    def create_buy_order(self) -> alpaca.Order:
        # log.debug("Buyer#create_buy_order")

        # create a new buy order
        try:
            qty = self.calc_position_size()
            if qty:
                order = self.api.submit_order(
                    symbol=self.symbol,
                    side="buy",
                    type="market",
                    qty=qty,
                    time_in_force="day",
                )
                log.success(f"Buy order for {qty} shares of {self.symbol} submitted")
        except Exception as error:
            log.error(f"ERROR: {error}")
        return order

    def create_trailing_stop_loss_order(self, buy_order: alpaca.Order):
        # if buy_order.status != "filled":
        #     return

        # create trailing stop loss order
        if isinstance(buy_order, alpaca.Order):
            price = buy_order.filled_avg_price
        else:
            price = buy_order.current_price
        try:
            trail_price = self.get_trailing_stop_loss_points(float(price))
            sell_order = self.submit_order(
                side="sell",
                type="trailing_stop",
                time_in_force="gtc",
                trail_price=trail_price,
                qty=buy_order.qty,
                extended_hours=True,
            )
            log.success("Trailing Stop order created")
            log.info(
                f"HWM: {sell_order.hwm}, Trail Price: {sell_order.trail_price}, Stop Price: {sell_order.stop_price}"
            )
        except Exception as error:
            log.error(f"ERROR: {error}")

    def clear_buy_orders(self):
        orders = self.api.list_orders()
        for order in orders:
            if order.side == "buy" and order.status != "filled":
                try:
                    self.api.cancel_order(order.id)
                    log.info(f"Cancelled open buy order for {order.symbol}")
                except:
                    log.warning(f"Failure to cancel open buy order: {order.id}")

    def run(self):
        log.debug("Starting Buyer.run")

        # only run if market is open
        if not self.is_market_open:
            print("Market is not open - preventing execution")
            return

        if self.symbol_is_in_portfolio:
            # log.info(f"Preventing purchase of {self.symbol} - already in portfolio")
            return

        if not self.sma_crossover_signal():
            # log.info(f"No SMA crossover signal for {self.symbol}")
            return

        qty = self.calc_position_size()
        if qty <= 0:
            # log.warning(f"0 qty order unfilled for {self.symbol}")
            return

        # buy assets
        order = self.create_buy_order()

        # prevent execution on error
        if not order:
            log.warning("Preventing further execution after no buy order returned")
            return

        # wait until the order is filled
        count = 0
        while order.status != "filled" and count < 15:
            # log.debug(f"Buy order status: {order.status}")
            sleep(0.1)
            order = self.api.get_order(order.id)
            count += 1

        # create trailing stop loss order once the order is filled
        if order.status == "filled":
            log.success(f"Buy order for {self.symbol} filled")
            self.create_trailing_stop_loss_order(order)
