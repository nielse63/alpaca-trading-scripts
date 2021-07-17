import json

from alpaca_trade_api.rest import Order
from faker import Faker

from .helpers import get_uuid

fake = Faker()


def generate_sell_order():
    return {
        "replaces": "532b9037-6844-4bf9-8a4a-7e9a59d69167",
        "order_type": "trailing_stop",
        "type": "trailing_stop",
        "side": "sell",
        "time_in_force": "gtc",
        "stop_price": "144.98",
        "status": "new",
        "extended_hours": True,
        "trail_percent": None,
        "trail_price": "5.02",
        "hwm": "150",
    }


def generate_buy_order():
    return {
        "notional": None,
        "qty": "1",
        "filled_qty": "0",
        "filled_avg_price": None,
        "order_type": "market",
        "type": "market",
        "side": "buy",
        "time_in_force": "day",
    }


def generate_order(symbol: str = "AAPL", side=None):
    id = get_uuid()
    client_order_id = get_uuid()
    asset_id = get_uuid()
    if side is None:
        side = fake.random_element(elements=["buy", "sell"])

    base_order = {
        "id": id,
        "client_order_id": client_order_id,
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
        "asset_id": asset_id,
        "symbol": symbol,
        "asset_class": "us_equity",
        "notional": "500",
        "qty": None,
        "filled_qty": "0",
        "filled_avg_price": None,
        "order_class": "",
        "side": side,
        "time_in_force": "day",
        "limit_price": None,
        "status": "accepted",
        "stop_price": None,
        "extended_hours": False,
        "legs": None,
        "trail_percent": None,
        "trail_price": None,
        "hwm": None,
    }
    order_extension = generate_sell_order() if side == "sell" else generate_buy_order()
    for key in order_extension:
        base_order[key] = order_extension[key]
    return base_order


def get_test_order_list_json():
    output = []
    count = 0
    while count < 3:
        output.append(generate_order())
        count += 1
    return json.dumps(output)


def mock_order(symbol: str = "AAPL", side=None):
    return Order(generate_order(symbol=symbol, side=side))
