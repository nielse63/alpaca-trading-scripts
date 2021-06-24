import alpaca_trade_api.rest as alpaca
from stockstats import StockDataFrame

from trading_scripts.utils.constants import (
    ATR_MULTIPLIER,
    HISTORICAL_DATA_INTERVAL,
    HISTORICAL_DATA_PERIOD,
)
from trading_scripts.utils.helpers import (
    create_client,
    get_historical_data,
    get_last_quote,
    is_market_open,
)
from trading_scripts.utils.logger import log


class Seller:
    api: alpaca = None

    def __init__(self) -> None:
        self.api = create_client()

    def get_orders(self) -> list[alpaca.Order]:
        orders = self.api.list_orders()
        output = []
        for order in orders:
            if order.type == "trailing_stop":
                output.append(order)
        return output

    def update_trailing_stop_loss_order(self, order: alpaca.Order) -> alpaca.Order:
        if not is_market_open():
            print("Market is not open - stopping execution")
            return
        data = StockDataFrame.retype(
            get_historical_data(
                order.symbol,
                interval=HISTORICAL_DATA_INTERVAL,
                period=HISTORICAL_DATA_PERIOD,
            )
        )
        last_tick_price = get_last_quote(order.symbol)
        atr = data.get("atr").iloc[-1]
        stop_price = last_tick_price - atr * ATR_MULTIPLIER
        trail_points = last_tick_price - stop_price
        try:
            sell_order = self.api.replace_order(
                order_id=order.id,
                stop_price=stop_price,
                trail=trail_points,
            )
            log.success("Order updated")
            print(sell_order)
        except Exception as error:
            log.error(f"ERROR: {error}")

    def run(self):
        for order in self.get_orders():
            self.update_trailing_stop_loss_order(order)
