#!/usr/bin/env python3
"""
1. define:
    - symbol to buy
    - percent of available equity to use for the purchase
2. get positions - if we already own that stock, exit
3. get historical data of the asset and latest ask price, test that sma(10) > sma(25) - if not, exit
4. submit a market order to buy
"""

import os
import sys

import alpaca_trade_api as alpaca
from dotenv import load_dotenv
from ta.trend import SMAIndicator

from trading_scripts.helpers import get_historical_data, get_position_symbols
from trading_scripts.logger import logger

load_dotenv()

# variables
TICKER_SYMBOL = "AAPL"  # the assets ticket symbol
EQUITY_PCT_PER_TRADE = 0.5  # percent of available equity we can use for the purchase

# validate env vars
logger.info("Checking env vars")
if not os.getenv("APCA_API_KEY_ID"):
    raise Exception("APCA_API_KEY_ID is undefined")
if not os.getenv("APCA_API_SECRET_KEY"):
    raise Exception("APCA_API_SECRET_KEY is undefined")

# create an alpaca client
logger.info("Creating alpaca client")
api = alpaca.REST()


# get open positions
logger.info("Getting open positions")
positions = get_position_symbols(api)
logger.info(f"Open positions: {', '.join(positions)}")
if TICKER_SYMBOL in positions:
    logger.warning("already owned - exiting")
    sys.exit()

# close any open buy orders
for order in api.list_orders(status="open"):
    if order.symbol == TICKER_SYMBOL and order.side == "buy":
        try:
            api.cancel_order(order.id)
        except Exception as error:
            logger.exception(error)
            sys.exit()

# get historical data
logger.info("Getting historical data")
last_quote = api.get_last_quote(TICKER_SYMBOL)
data = get_historical_data(TICKER_SYMBOL, interval="1d", period="1y")
close = data["Close"]

# calculate sma(10) and sma(25)
sma_fast = SMAIndicator(close, window=10).sma_indicator()
sma_slow = SMAIndicator(close, window=25).sma_indicator()
# here's our strategy - when sma(10) > sma(25), enter long
if not (sma_fast > sma_slow).iloc[-1]:
    logger.warning("Entry signal was not met - exiting")
    sys.exit()

# calculate number of shares to buy
account = api.get_account()
last_price = float(last_quote.askprice)
cash_for_trade = float(account.cash) * EQUITY_PCT_PER_TRADE
qty = cash_for_trade / last_price

# create a market buy order
try:
    order = api.submit_order(
        symbol=TICKER_SYMBOL, qty=qty, side="buy", type="market", time_in_force="day"
    )
except Exception as error:
    logger.exception(f"Error: {error}")
    sys.exit()

logger.success(f"Order to buy {qty} shares of {TICKER_SYMBOL} at {last_price}")
