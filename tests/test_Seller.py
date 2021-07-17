from trading_scripts.lib.Seller import Seller


def test_get_orders(mocker, mock_orders):
    mocker.patch("trading_scripts.utils.helpers.is_market_open", return_value=True)
    mocker.patch(
        "trading_scripts.utils.helpers.Cache.API_CLIENT.list_orders",
        return_value=mock_orders,
    )

    seller = Seller()
    sell_orders = seller.get_orders()
    assert isinstance(sell_orders, list)
    assert len(sell_orders) == 2
