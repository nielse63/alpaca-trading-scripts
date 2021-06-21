#!/usr/bin/env python3
"""
create or update a trailing stop order for each open position.
the stop value should be based on the n14 average true rate.
"""
import os

import alpaca_trade_api as alpaca
from alpaca_trade_api.rest import Order, Position
from dotenv import load_dotenv

from trading_scripts.helpers import average_true_range, get_historical_data
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


def get_orders_for_symbol(symbol: str):
    orders = api.list_orders(status="open", symbols=[symbol])
    output = []
    for order in orders:
        if order.side == "sell" and order.type == "trailing_stop":
            output.append(order)
    return output


def replace_existin_order(order: Order, stop_price: float, trail_price: float):
    logger.info("Replacing trailing stop loss order")
    try:
        new_order = api.replace_order(
            order_id=order.id, stop_price=stop_price, trail=trail_price
        )
        # print(new_order)
    except Exception as error:
        logger.error(f"Error: {error}")
        return
    logger.success(f"Replaced order with new order id: {new_order.id}")


def create_new_tsl_order(symbol: str, qty: float, trail_price: float) -> None:
    try:
        order = api.submit_order(
            side="sell",
            symbol=symbol,
            type="trailing_stop",
            qty=qty,
            time_in_force="day",
            trail_price=trail_price,
        )
        # print(order)
    except Exception as error:
        logger.error(f"Error: {error}")
        return
    logger.success(f"Created new order with new order id: {order.id}")


def set_trailing_stop_loss(position: Position) -> None:
    # get data for position
    symbol = position.symbol
    data = get_historical_data(symbol=symbol)
    share_price = float(api.get_last_quote(symbol).askprice)
    qty = float(position.qty)

    # calulate stop loss price
    atr = average_true_range(data, 14)[-1]
    stop_loss_multiplier = 2
    stop_price = share_price - atr * stop_loss_multiplier
    trail_price = share_price - stop_price

    # compare to existing sell orders
    orders = get_orders_for_symbol(symbol)
    if len(orders) > 1:
        logger.warning(
            f"There are {len(orders)} open trailing stop orders for {symbol} - not sure what to do so returning for now"
        )
    elif len(orders):
        replace_existin_order(
            order=orders[0], stop_price=stop_price, trail_price=trail_price
        )
    else:
        create_new_tsl_order(symbol=symbol, qty=qty, trail_price=trail_price)


def main():
    # get open positions
    for position in api.list_positions():
        set_trailing_stop_loss(position)


if __name__ == "__main__":
    main()
