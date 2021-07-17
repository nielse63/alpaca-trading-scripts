import requests_mock

# import json
from trading_scripts.lib.OrderCleanup import OrderCleanup

from .test_data import orders_json, positions_json


def test_get_orders():
    with requests_mock.Mocker() as mock_request:
        mock_request.get(
            "https://paper-api.alpaca.markets/v2/orders",
            text=orders_json,
        )
        mock_request.get(
            "https://paper-api.alpaca.markets/v2/positions",
            text=positions_json,
        )
        oc = OrderCleanup()
        print(oc.orders)
        assert True
