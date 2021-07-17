import json

from alpaca_trade_api.rest import Position

position_dict = {
    "asset_id": "fake-position-id",
    "symbol": "ABC",
    "exchange": "NASDAQ",
    "asset_class": "us_equity",
    "avg_entry_price": "100.0",
    "qty": "5",
    "side": "long",
    "market_value": "600.0",
    "cost_basis": "500.0",
    "unrealized_pl": "100.0",
    "unrealized_plpc": "0.20",
    "unrealized_intraday_pl": "10.0",
    "unrealized_intraday_plpc": "0.0084",
    "current_price": "120.0",
    "lastday_price": "119.0",
    "change_today": "0.0084",
}


def get_test_position_list_json():
    output = []
    count = 0
    while count < 3:
        output.append(position_dict)
        count += 1
    return json.dumps(output)


def mock_position():
    return Position(position_dict)
