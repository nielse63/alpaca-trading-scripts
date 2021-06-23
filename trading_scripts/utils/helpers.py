import os
import sys
from datetime import timedelta

import alpaca_trade_api as alpaca
import pandas as pd
import yfinance as yf
from alpaca_trade_api.rest import Position
from dotenv import load_dotenv
from requests_cache import CachedSession

from trading_scripts.utils.logger import logger

load_dotenv()


class Cache(object):
    API_CLIENT = None


def create_client() -> alpaca.REST:
    if not Cache.API_CLIENT:
        logger.debug("Creating alpaca client")
        Cache.API_CLIENT = alpaca.REST()
    return Cache.API_CLIENT


api = create_client()


def is_market_open() -> bool:
    return api.get_clock().is_open


def validate_env_vars():
    logger.debug("Checking env vars")
    required_vars = ["APCA_API_KEY_ID", "APCA_API_SECRET_KEY"]
    for var in required_vars:
        if not os.getenv(var):
            logger.error("APCA_API_KEY_ID is undefined")
            sys.exit(1)


# install requests cache globally
def get_requests_cache() -> CachedSession:
    return CachedSession(
        cache_name=".cache/requests_cache.sqlite",
        expire_after=timedelta(days=2),
    )


def get_positions() -> list[Position]:
    return api.list_positions()


def get_position_symbols() -> list[str]:
    output = []
    for position in get_positions():
        output.append(position.symbol)
    return output


def get_historical_data(symbol: str, interval: str = "1d", period: str = "1y"):
    logger.debug(f"getting data for {symbol}")
    session = get_requests_cache()
    return yf.Ticker(symbol).history(interval=interval, period=period, session=session)


def SMA(data: pd.Series, n: int) -> pd.Series:
    return pd.Series(data).rolling(n).mean()


def get_trailing_stop_orders(symbol: str) -> list:
    orders = api.list_orders(status="open", symbols=[symbol])
    output = filter(
        lambda order: order.side == "sell" and order.type == "trailing_stop", orders
    )
    return list(output)


def get_last_quote(symbol: str) -> float:
    barset = api.get_barset(symbol, "1Min", limit=2)
    share_price = barset[symbol][-1].c
    return float(share_price)
