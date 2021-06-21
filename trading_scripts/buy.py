#!/usr/bin/env python3
"""
1. define:
    - symbol to buy
    - percent of available equity to use for the purchase
2. get positions - if we already own that stock, exit
3. get historical data of the asset and latest ask price, test that sma(10) > sma(25) - if not, exit
4. submit a market order to buy
"""
from ta.trend import SMAIndicator

from trading_scripts.utils.constants import EQUITY_PCT_PER_TRADE, TICKER_SYMBOL
from trading_scripts.utils.helpers import (
    create_client,
    get_historical_data,
    get_position_symbols,
    validate_env_vars,
)
from trading_scripts.utils.logger import logger

# validate env vars
validate_env_vars()


def buy_for_symbol(symbol: str):
    # create an alpaca client
    api = create_client()

    # get open positions
    logger.info("Getting open positions")
    positions = get_position_symbols()
    if len(positions):
        logger.info(f"Open positions: {', '.join(positions)}")
        if symbol in positions:
            logger.warning("already owned - exiting")
            return

    # close any open buy orders
    for order in api.list_orders(status="open"):
        if order.symbol == symbol and order.side == "buy":
            logger.info(f"Cancelling order id {order.id}")
            try:
                api.cancel_order(order.id)
            except Exception as error:
                logger.exception(error)
                return
            logger.success(f"Cancelled order id {order.id}")

    # get historical data
    logger.info("Getting historical data")
    last_quote = api.get_last_quote(symbol)
    data = get_historical_data(symbol, interval="1d", period="1y")
    close = data["Close"]

    # calculate sma(10) and sma(25)
    sma_fast = SMAIndicator(close, window=10).sma_indicator()
    sma_slow = SMAIndicator(close, window=25).sma_indicator()
    # here's our strategy - when sma(10) > sma(25), enter long
    if not (sma_fast > sma_slow).iloc[-1]:
        logger.warning("Entry signal was not met - exiting")
        return

    # calculate number of shares to buy
    account = api.get_account()
    last_price = float(last_quote.askprice)
    cash_for_trade = float(account.cash) * EQUITY_PCT_PER_TRADE
    qty = cash_for_trade / last_price

    # create a market buy order
    try:
        order = api.submit_order(
            symbol=symbol,
            qty=qty,
            side="buy",
            type="market",
            time_in_force="day",
        )
    except Exception as error:
        logger.exception(f"Error: {error}")
        return

    logger.success(f"Order to buy {qty} shares of {symbol} at {last_price}")


def main():
    buy_for_symbol(TICKER_SYMBOL)


if __name__ == "__main__":
    main()
