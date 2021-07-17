import pathlib

import pandas as pd
import pytest
from alpaca_trade_api.entity import Account as AlpacaAccount
from alpaca_trade_api.entity import Bar, Order, Position
from dotenv import load_dotenv

from .test_data.order import mock_order
from .test_data.position import mock_position

load_dotenv()


# base_url = f"{os.getenv(key='APCA_API_BASE_URL')}/v2"

# session = requests.Session()
# adapter = requests_mock.Adapter()
# session.mount(base_url, adapter)

# adapter.register_uri("GET", f"{base_url}/orders", text=orders_json)
# adapter.register_uri("GET", f"{base_url}/positions", text=positions_json)


@pytest.fixture
def mock_account():
    return AlpacaAccount(
        {
            "account_blocked": False,
            "account_number": "1234567890",
            "buying_power": "262113.632",
            "cash": "10000.00",
            "created_at": "2019-06-12T22:47:07.99658Z",
            "currency": "USD",
            "daytrade_count": 0,
            "daytrading_buying_power": "262113.632",
            "equity": "103820.56",
            "id": "e6fe16f3-64a4-4921-8928-cadf02f92f98",
            "initial_margin": "63480.38",
            "last_equity": "103529.24",
            "last_maintenance_margin": "38000.832",
            "long_market_value": "126960.76",
            "maintenance_margin": "38088.228",
            "multiplier": "4",
            "pattern_day_trader": False,
            "portfolio_value": "103820.56",
            "regt_buying_power": "80680.36",
            "short_market_value": "0",
            "shorting_enabled": True,
            "sma": "0",
            "status": "ACTIVE",
            "trade_suspended_by_user": False,
            "trading_blocked": False,
            "transfers_blocked": False,
        }
    )


@pytest.fixture
def mock_orders() -> list[Order]:
    return [
        mock_order(symbol="AAPL", side="sell"),
        mock_order(symbol="MSFT", side="buy"),
        mock_order(symbol="TSLA", side="sell"),
    ]


@pytest.fixture
def mock_positions() -> list[Position]:
    output = []
    for _ in range(1):
        output.append(mock_position())
    return output


@pytest.fixture
def mock_barset() -> dict:
    return {
        "AAPL": [
            Bar(
                {
                    "c": "146.38",
                    "h": "146.415",
                    "l": "146.305",
                    "o": "146.365",
                    "t": "1626465540",
                    "v": "11470",
                }
            ),
            Bar(
                {
                    "c": "146.16",
                    "h": "146.16",
                    "l": "146.16",
                    "o": "146.16",
                    "t": "1626468780",
                    "v": "150",
                }
            ),
        ]
    }


@pytest.fixture
def mock_historical_data():
    json_filepath = pathlib.Path(__file__).parent / "test_data/aapl.json"
    data = pd.read_json(json_filepath)
    return data
