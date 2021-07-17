import os
import sys
from datetime import timedelta

import alpaca_trade_api as alpaca
import yfinance as yf
from alpaca_trade_api.entity import Account, Order
from alpaca_trade_api.rest import Position
from dotenv import load_dotenv
from requests_cache import CachedSession

from trading_scripts.utils.constants import (
    HISTORICAL_DATA_INTERVAL,
    HISTORICAL_DATA_PERIOD,
)
from trading_scripts.utils.logger import logger as log

load_dotenv()


class Cache(object):
    API_CLIENT = None


def create_client() -> alpaca.REST:
    if not Cache.API_CLIENT:
        # log.debug("Creating alpaca client")
        Cache.API_CLIENT = alpaca.REST()
    return Cache.API_CLIENT


api = create_client()


def is_market_open() -> bool:
    return api.get_clock().is_open


def validate_env_vars():
    # log.debug("Checking env vars")
    required_vars = ["APCA_API_KEY_ID", "APCA_API_SECRET_KEY"]
    for var in required_vars:
        if not os.getenv(var):
            log.error("APCA_API_KEY_ID is undefined")
            sys.exit(1)


# install requests cache globally
def get_requests_cache() -> CachedSession:
    return CachedSession(
        cache_name=".cache/requests_cache.sqlite",
        expire_after=timedelta(days=2),
    )


def close_open_buy_orders(client=api):
    # log.debug("Closing open buy orders, if any")
    orders = client.list_orders(params={"side": "buy"})
    for order in orders:
        if order.status != "filled":
            try:
                client.cancel_order(order.id)
                log.info(f"Cancelled open buy order for {order.symbol}")
            except:
                log.error(f"Failure to cancel open buy order: {order.id}")


def get_positions() -> list[Position]:
    return api.list_positions()


def get_position_symbols() -> list[str]:
    output = []
    for position in get_positions():
        output.append(position.symbol)
    return output


def get_historical_data(
    symbol: str,
    interval: str = HISTORICAL_DATA_INTERVAL,
    period: str = HISTORICAL_DATA_PERIOD,
):
    session = get_requests_cache()
    data = yf.Ticker(symbol, session=session)
    history = data.history(interval=interval, period=period)
    return history


def get_trailing_stop_orders(symbol: str) -> list[Order]:
    orders = api.list_orders(status="open", symbols=[symbol])
    output = []
    for order in orders:
        if order.side == "sell" and order.type == "trailing_stop":
            output.append(order)
    return output


def get_last_quote(symbol: str) -> float:
    barset = api.get_barset(symbol, "1Min", limit=2)
    share_price = barset[symbol][-1].c
    return float(share_price)


def get_account() -> Account:
    account = api.get_account()
    return account
