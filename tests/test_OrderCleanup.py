from unittest.mock import patch

from trading_scripts.lib.OrderCleanup import OrderCleanup


def test_order_cleanup(mocker, mock_orders, mock_positions):
    orders_list = mock_orders.copy()

    def list_orders_side_effect():
        return orders_list

    def get_order_side_effect(id):
        output = None
        for order in orders_list:
            if order.id == id:
                output = order
        return output

    def cancel_order_side_effect(id):
        i = 0
        for order in orders_list:
            if order.id == id:
                del orders_list[i]
            i += 1
        return None

    # patches
    mocker.patch(
        "trading_scripts.utils.helpers.Cache.API_CLIENT.list_orders",
        side_effect=list_orders_side_effect,
    )
    mocker.patch(
        "trading_scripts.utils.helpers.Cache.API_CLIENT.list_positions",
        return_value=mock_positions,
    )
    mocker.patch(
        "trading_scripts.utils.helpers.Cache.API_CLIENT.get_order",
        side_effect=get_order_side_effect,
    )
    mocker.patch(
        "trading_scripts.utils.helpers.Cache.API_CLIENT.cancel_order",
        side_effect=cancel_order_side_effect,
    )

    # create instance
    oc = OrderCleanup()

    # basic validation
    assert isinstance(oc.orders, list)
    assert isinstance(oc.positions, list)
    assert isinstance(oc.position_symbols, list)
    assert oc.position_symbols[0] == oc.positions[0].symbol

    # get sell orders
    sell_orders = oc.get_sell_orders()
    assert len(sell_orders) == 2
    sell_order_symbols = []
    for order in sell_orders:
        sell_order_symbols.append(order.symbol)
    assert sell_order_symbols == ["AAPL", "TSLA"]

    # get buy orders
    buy_orders = oc.get_buy_orders()
    assert len(buy_orders) == 1
    buy_order_symbols = []
    for order in buy_orders:
        buy_order_symbols.append(order.symbol)
    assert buy_order_symbols == ["MSFT"]

    # close orphaned sell orders
    assert len(oc.get_sell_orders()) == 2
    oc.close_orphaned_sell_orders()
    assert len(oc.get_sell_orders()) == 1

    # close open buy orders
    assert len(oc.get_buy_orders()) == 1
    oc.close_open_buy_orders()
    assert len(oc.get_buy_orders()) == 0


@patch.object(OrderCleanup, "close_orphaned_sell_orders")
@patch.object(OrderCleanup, "close_open_buy_orders")
def test_run(mocked_close_orphaned_sell_orders, mocked_close_open_buy_orders):
    oc = OrderCleanup()
    oc.run()
    mocked_close_orphaned_sell_orders.assert_called_once()
    mocked_close_open_buy_orders.assert_called_once()


def test_exception_handling(mocker):
    def cancel_order_side_effect(*args, **kwargs):
        raise Exception("test exception")

    mocker.patch(
        "trading_scripts.utils.helpers.Cache.API_CLIENT.cancel_order",
        side_effect=cancel_order_side_effect,
    )
    mocked_logger_error = mocker.patch("loguru.logger.error")
    oc = OrderCleanup()
    oc.close_order("123")
    mocked_logger_error.assert_called_once()
