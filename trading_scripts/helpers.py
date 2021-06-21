from datetime import timedelta

import numpy as np
import pandas as pd
import requests_cache
import yfinance as yf


# install requests cache globally
def get_requests_cache():
    return requests_cache.CachedSession(
        cache_name=".cache/requests_cache.sqlite",
        expire_after=timedelta(days=2),
    )


def get_position_symbols(api):
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
