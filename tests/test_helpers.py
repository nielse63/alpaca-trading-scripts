from unittest.mock import patch

import pandas as pd
import yfinance as yf

from trading_scripts.utils.helpers import (
    close_open_buy_orders,
    get_account,
    get_historical_data,
    get_last_quote,
    get_position_symbols,
    get_positions,
    get_trailing_stop_orders,
    is_market_open,
    validate_env_vars,
)


def test_close_open_buy_orders(mocker, mock_orders):
    orders_list = mock_orders.copy()

    def get_buy_orders(*args, **kwargs):
        buy_orders = []
        for order in orders_list:
            if order.side == "buy":
                buy_orders.append(order)
        return buy_orders

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
        side_effect=get_buy_orders,
    )
    mocker.patch(
        "trading_scripts.utils.helpers.Cache.API_CLIENT.cancel_order",
        side_effect=cancel_order_side_effect,
    )

    assert len(get_buy_orders()) == 1
    close_open_buy_orders()
    assert len(get_buy_orders()) == 0


def test_close_open_buy_orders_exception(mocker, mock_orders):
    orders_list = mock_orders.copy()

    def get_buy_orders(*args, **kwargs):
        buy_orders = []
        for order in orders_list:
            if order.side == "buy":
                buy_orders.append(order)
        return buy_orders

    def cancel_order_side_effect(*args, **kwargs):
        raise Exception("test exception")

    # patches
    mocker.patch(
        "trading_scripts.utils.helpers.Cache.API_CLIENT.list_orders",
        side_effect=get_buy_orders,
    )
    mocker.patch(
        "trading_scripts.utils.helpers.Cache.API_CLIENT.cancel_order",
        side_effect=cancel_order_side_effect,
    )

    mocked_logger_error = mocker.patch("loguru.logger.error")
    assert len(get_buy_orders()) == 1
    close_open_buy_orders()
    assert len(get_buy_orders()) == 1
    mocked_logger_error.assert_called_once()


def test_get_positions(mocker, mock_positions):
    # patches
    mocker.patch(
        "trading_scripts.utils.helpers.Cache.API_CLIENT.list_positions",
        return_value=mock_positions,
    )

    positions = get_positions()
    assert isinstance(positions, list)
    assert len(positions) == len(mock_positions)


def test_get_position_symbols(mocker, mock_positions):
    # patches
    mocker.patch(
        "trading_scripts.utils.helpers.Cache.API_CLIENT.list_positions",
        return_value=mock_positions,
    )

    positions = get_position_symbols()
    assert isinstance(positions, list)
    assert len(positions) == len(mock_positions)
    assert isinstance(positions[0], str)
    assert positions[0] == mock_positions[0].symbol


def test_get_last_quote(mocker, mock_barset):
    mocker.patch(
        "trading_scripts.utils.helpers.Cache.API_CLIENT.get_barset",
        return_value=mock_barset,
    )
    last_quote = get_last_quote("AAPL")
    assert isinstance(last_quote, float)
    assert last_quote == 146.16


def test_get_trailing_stop_orders(mocker, mock_orders):
    def get_mock_orders(symbols=[], **kwargs):
        output = []
        for order in mock_orders:
            if order.symbol in symbols:
                output.append(order)
        return output

    mock_list_orders = mocker.patch(
        "trading_scripts.utils.helpers.Cache.API_CLIENT.list_orders",
        side_effect=get_mock_orders,
    )
    trailing_stop_orders = get_trailing_stop_orders("AAPL")

    mock_list_orders.assert_called_once()
    assert isinstance(trailing_stop_orders, list)
    assert len(trailing_stop_orders) == 1
    assert trailing_stop_orders[0].symbol == "AAPL"


def test_get_historical_data(mocker, mock_historical_data):
    mocked_method = mocker.patch.object(
        yf.Ticker, "history", return_value=mock_historical_data
    )
    response = get_historical_data("AAPL")
    assert isinstance(response, pd.DataFrame)
    mocked_method.assert_called_once_with(interval="1h", period="3mo")
    columns = ["Open", "High", "Low", "Close", "Volume", "Dividends", "Stock Splits"]
    for column in columns:
        assert response[column] is not None


def test_get_account(mocker, mock_account):
    mocker.patch(
        "trading_scripts.utils.helpers.Cache.API_CLIENT.get_account",
        return_value=mock_account,
    )
    account = get_account()
    assert account.id == "fake-account-id"
    assert account.cash == "10000.00"


@patch("os.getenv")
@patch("sys.exit")
def test_validate_env_vars(mock_exit, mock_getenv):
    validate_env_vars()
    assert mock_getenv.call_count == 2
    mock_exit.assert_not_called()


def test_validate_env_vars_exit(mocker):
    mocked_logger_error = mocker.patch("loguru.logger.error")
    mock_exit = mocker.patch("sys.exit")
    mocker.patch("os.getenv", return_value=False)

    validate_env_vars()
    mock_exit.assert_called_with(1)
    mocked_logger_error.assert_called()


def test_is_market_open(mocker, mock_get_clock):
    mocker.patch(
        "trading_scripts.utils.helpers.Cache.API_CLIENT.get_clock",
        return_value=mock_get_clock,
    )
    is_open = is_market_open()
    assert is_open
