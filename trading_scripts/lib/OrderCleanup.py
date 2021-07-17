import alpaca_trade_api.rest as alpaca
from alpaca_trade_api.entity import Order, Position

from trading_scripts.utils.helpers import create_client, get_positions
from trading_scripts.utils.logger import log


class OrderCleanup:
    api: alpaca = None
    position: list[Position] = []
    orders: list[Order] = []

    def __init__(self):
        self.api = create_client()
        self.positions = get_positions()
        self.orders = self.api.list_orders()

    @property
    def position_symbols(self):
        return self.__object_list_to_symbols(self.positions)

    # @property
    # def order_symbols(self):
    #     return self.__object_list_to_symbols(self.orders)

    def __object_list_to_symbols(self, object_list: list) -> list[str]:
        output = []
        for dict in object_list:
            output.append(dict.symbol)
        return output

    def __close_order(self, order_id: str):
        try:
            order = self.api.get_order(order_id)
            log.info(f"Closing {order.symbol} {order.side} order (id {order_id})")
            self.api.cancel_order(order_id)
        except Exception as error:
            log.error(f"Error cancelling order: {error}")

    def get_sell_orders(self):
        sell_orders = []
        for order in self.api.list_orders():
            if order.side == "sell":
                sell_orders.append(order)
        return sell_orders

    def get_buy_orders(self):
        return self.api.list_orders(params={"side": "buy"})

    def close_open_buy_orders(self):
        log.info("Closing open buy orders")
        for order in self.get_buy_orders():
            if order.status != "filled":
                self.__close_order(order.id)

    def close_orphaned_sell_orders(self):
        log.info("Closing orphaned sell orders")
        position_symbols = self.position_symbols
        for order in self.get_sell_orders():
            if order.symbol not in position_symbols:
                self.__close_order(order.id)

    def run(self):
        log.info("Starting OrderCleanup.run")
        self.close_open_buy_orders()
        self.close_orphaned_sell_orders()


if __name__ == "__main__":
    OrderCleanup().run()
