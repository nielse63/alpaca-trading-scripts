import math
import os

import alpaca_trade_api.rest as alpaca
import pandas as pd
from stockstats import StockDataFrame

from trading_scripts.utils.constants import (  # ATR_MULTIPLIER,; MAX_DRAWDOWN_PCT,
    HISTORICAL_DATA_INTERVAL,
    HISTORICAL_DATA_PERIOD,
)
from trading_scripts.utils.helpers import (
    create_client,
    get_historical_data,
    get_last_quote,
    get_positions,
    is_market_open,
)
from trading_scripts.utils.logger import log

# from time import sleep


class Buyer:
    symbol: str = ""
    positions: list[dict] = []
    data: pd.DataFrame = None
    api: alpaca = None

    def __init__(
        self, symbol: str = "", cash: float = None, sma_fast=10, sma_slow=25, atr=2
    ) -> None:
        self.symbol = symbol
        self.sma_fast = sma_fast
        self.sma_slow = sma_slow
        self.atr = atr
        self.api = create_client()
        self.positions = get_positions()
        self.is_market_open: bool = is_market_open()
        if self.symbol:
            self.data = self.__get_data()
        self._cash = cash

    def __get_data(self):
        return StockDataFrame.retype(
            get_historical_data(
                symbol=self.symbol,
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
        sma_fast = self.data.get(f"close_{self.sma_fast}_sma")
        sma_slow = self.data.get(f"close_{self.sma_slow}_sma")
        return sma_fast.gt(sma_slow).iloc[-1]

    def get_drawdown_points(self):
        atr = self.data.get("atr").iloc[-1]
        output = self.atr * atr
        return round(output, 2)

    @property
    def available_cash(self):
        account = self.api.get_account()
        return float(account.cash)

    @property
    def last_price(self):
        return get_last_quote(self.symbol)

    # def get_trailing_stop_loss_points(
    #     self, price: float, get_drawdown_points: float = 5.0
    # ):
    #     return min(
    #         self.get_drawdown_points(get_drawdown_points),
    #         round(price * MAX_DRAWDOWN_PCT, 2),
    #     )

    def calc_position_size(self):
        # Position Size = (Total Trading Account Size X Risk Percentage) / Distance to Stop Loss from entry
        available_cash = self.available_cash
        risk_pct = 0.05
        last_price = self.last_price
        distance_to_stop = last_price / self.get_drawdown_points()
        position_qty = math.floor((available_cash * risk_pct) / distance_to_stop)
        position_cost = position_qty * last_price
        print(
            f"available_cash: {available_cash}, position_qty: {position_qty}, position_cost {position_cost}"
        )
        return position_qty

    def create_buy_order(self, qty: int = 0) -> alpaca.Order:
        # log.debug("Buyer#create_buy_order")
        if not qty:
            qty = self.calc_position_size()

        # create a new buy order
        try:
            order = self.api.submit_order(
                symbol=self.symbol,
                side="buy",
                type="market",
                qty=qty,
                time_in_force="day",
            )
            log.success(f"Buy order for {qty} shares of {self.symbol} submitted")
            return order
        except Exception as error:
            log.error(f"ERROR: {error}")

    def create_trailing_stop_loss_order(self, buy_order: alpaca.Order):
        # create trailing stop loss order
        # if isinstance(buy_order, alpaca.Position):
        #     price = buy_order.current_price
        # else:
        #     price = buy_order.filled_avg_price
        try:
            trail_price = self.get_drawdown_points()
            # trail_price = self.get_trailing_stop_loss_points(float(price))
            sell_order = self.submit_order(
                side="sell",
                type="trailing_stop",
                time_in_force="gtc",
                trail_price=trail_price,
                qty=buy_order.qty,
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
        if os.getenv("IS_TEST"):
            log.info("Preventing purchase in test environment")
            return

        # # only run if market is open
        # if not self.is_market_open:
        #     # print("Market is not open - preventing execution")
        #     return

        # log.info("Starting Buyer.run")
        # if self.symbol_is_in_portfolio:
        #     # log.info(f"Preventing purchase of {self.symbol} - already in portfolio")
        #     return

        # print(self.sma_crossover_signal())
        if not self.sma_crossover_signal():
            # log.info(f"No SMA crossover signal for {self.symbol}")
            return

        qty = self.calc_position_size()
        if qty < 1:
            # log.warning(f"0 qty order unfilled for {self.symbol}")
            return

        # buy assets
        self.create_buy_order(qty)
        # order = self.create_buy_order(qty)

        # prevent execution on error
        # if not order:
        #     log.warning("Preventing further execution after no buy order returned")
        #     return

        # # wait until the order is filled
        # count = 0
        # while order.status != "filled" and count < 15:
        #     # log.debug(f"Buy order status: {order.status}")
        #     sleep(0.1)
        #     order = self.api.get_order(order.id)
        #     count += 1

        # # create trailing stop loss order once the order is filled
        # if order.status == "filled":
        #     log.success(f"Buy order for {self.symbol} filled")
        #     self.create_trailing_stop_loss_order(order)
