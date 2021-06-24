from alpaca_trade_api.rest import Order, Position


def fake_position():
    return Position(
        {
            "asset_id": "904837e3-3b76-47ec-b432-046db621571b",
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
    )


def fake_order():
    return Order(
        {
            "id": "61e69015-8549-4bfd-b9c3-01e75843f47d",
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
    )
