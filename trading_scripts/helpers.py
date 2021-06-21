# import alpaca_trade_api.rest as alpaca
# from dotenv import load_dotenv

from datetime import timedelta

import requests_cache

# load_dotenv()
import yfinance as yf

# from enum import Enum


# class TimePeriod(Enum):
#     ONE_DAY = "1d"
#     FIVE_DAYS = "5d"
#     ONE_MONTH = "1mo"
#     THREE_MONTHS = "3mo"
#     THREE_MONTHS = "6mo"
#     ONE_YEAR = "1y"
#     TWO_YEARS = "2y"
#     FIVE_YEARS = "5y"
#     TEN_YEARS = "10y"
#     YTD = "ytd"
#     MAX = "max"


# class TimeInterval(Enum):
#     # 1m
#     # 2m
#     # 5m
#     # 15m
#     # 30m
#     # 60m
#     # 90m
#     # 1h
#     # 1d
#     # 5d
#     # 1wk
#     # 1mo
#     # 3mo
#     ONE_DAY = "1d"
#     FIVE_DAYS = "5d"
#     ONE_MONTH = "1mo"
#     THREE_MONTHS = "3mo"
#     THREE_MONTHS = "6mo"
#     ONE_YEAR = "1y"
#     TWO_YEARS = "2y"
#     FIVE_YEARS = "5y"
#     TEN_YEARS = "10y"
#     YTD = "ytd"
#     MAX = "max"


def get_position_symbols(api):
    output = []
    for position in api.list_positions():
        output.append(position.symbol)
    return output


def get_session_cache():
    return requests_cache.CachedSession(
        ".cache/request_session", backend="sqlite", expire_after=timedelta(days=1)
    )


def get_historical_data(symbol: str, interval: str = "1d", period: str = "1y"):
    stock = yf.Ticker(symbol, session=get_session_cache())
    return stock.history(interval=interval, period=period)
