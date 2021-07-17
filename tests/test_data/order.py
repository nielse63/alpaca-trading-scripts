import json

from alpaca_trade_api.rest import Order

order_dict = {
    "id": "fake-order-id",
    "client_order_id": "eb9e2aaa-f71a-4f51-b5b4-52a6c565dad4",
    "created_at": "2021-03-16T18:38:01.942282Z",
    "updated_at": "2021-03-16T18:38:01.942282Z",
    "submitted_at": "2021-03-16T18:38:01.937734Z",
    "filled_at": None,
    "expired_at": None,
    "canceled_at": None,
    "failed_at": None,
    "replaced_at": None,
    "replaced_by": None,
    "replaces": None,
    "asset_id": "b0b6dd9d-8b9b-48a9-ba46-b9d54906e415",
    "symbol": "MSFT",
    "asset_class": "us_equity",
    "notional": "500",
    "qty": None,
    "filled_qty": "0",
    "filled_avg_price": None,
    "order_class": "",
    "order_type": "trailing_stop",
    "type": "trailing_stop",
    "side": "sell",
    "time_in_force": "day",
    "limit_price": None,
    "stop_price": 50,
    "status": "accepted",
    "extended_hours": False,
    "legs": None,
    "trail_percent": None,
    "trail_price": 10,
    "hwm": None,
}


def get_test_order_list_json():
    output = []
    count = 0
    while count < 3:
        output.append(order_dict)
        count += 1
    return json.dumps(output)


def mock_order():
    return Order(order_dict)
