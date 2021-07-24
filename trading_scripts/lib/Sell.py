# import alpaca_trade_api.rest as alpaca
from stockstats import StockDataFrame

# from trading_scripts.lib.Buyer import Buyer
from trading_scripts.utils.constants import (  # ATR_MULTIPLIER,
    HISTORICAL_DATA_INTERVAL,
    HISTORICAL_DATA_PERIOD,
)
from trading_scripts.utils.helpers import (  # get_last_quote,; is_market_open,; get_positions,
    create_client,
    get_historical_data,
)
from trading_scripts.utils.logger import log


class Sell:
    def __init__(self, symbol, atr_multiplier) -> None:
        self.symbol = symbol
        self.atr_multiplier = atr_multiplier
        self.api = create_client()
        self.data = StockDataFrame.retype(
            get_historical_data(
                symbol=self.symbol,
                interval=HISTORICAL_DATA_INTERVAL,
                period=HISTORICAL_DATA_PERIOD,
            )
        )

    @property
    def position(self):
        return self.api.get_position(self.symbol)

    @property
    def orders(self):
        return self.api.list_orders(symbols=[self.symbol], params={"side": "sell"})

    def get_trail_price(self):
        atr = self.data.get("atr").iloc[-1]
        return self.atr_multiplier * atr

    def get_stop_price(self, price: float):
        return price - self.get_trail_price()

    def update_sell_order(self):
        trail_price = self.get_trail_price()
        [order] = self.orders
        price = float(order.hwm)
        stop_price = float(round(price - trail_price, 2))
        if stop_price < float(order.stop_price):
            print(f"Not updating order for {self.symbol}")
            return

        sell_order = self.api.replace_order(
            order_id=order.id,
            stop_price=stop_price,
            trail=trail_price,
            qty=self.position.qty,
        )
        log.success(f"Order {sell_order.id} updated")
        log.info(sell_order)


if __name__ == "__main__":
    sell = Sell("TWTR", 2)
    print(sell.orders)
    # sell.update_sell_order()
