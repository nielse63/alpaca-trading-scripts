import os
import sys
from datetime import timedelta

import alpaca_trade_api as alpaca
import numpy as np
import pandas as pd
import yfinance as yf
from requests_cache import CachedSession

from trading_scripts.utils.logger import logger


class Cache(object):
    API_CLIENT = None


def create_client() -> alpaca.REST:
    if not Cache.API_CLIENT:
        logger.debug("Creating alpaca client")
        api = alpaca.REST()
        Cache.API_CLIENT = api
    return Cache.API_CLIENT


def is_market_open() -> bool:
    api = create_client()
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


def get_position_symbols() -> list[str]:
    api = create_client()
    output = []
    for position in api.list_positions():
        output.append(position.symbol)
    return output


def get_historical_data(symbol: str, interval: str = "1d", period: str = "1y"):
    session = get_requests_cache()
    return yf.Ticker(symbol).history(interval=interval, period=period, session=session)


def average_true_range(data: pd.DataFrame, period: int = 14):
    high_low = data["High"] - data["Low"]
    high_close = np.abs(data["High"] - data["Close"].shift())
    low_close = np.abs(data["Low"] - data["Close"].shift())
    ranges = pd.concat([high_low, high_close, low_close], axis=1)
    true_range = np.max(ranges, axis=1)
    atr = true_range.rolling(period).sum() / period
    return atr
