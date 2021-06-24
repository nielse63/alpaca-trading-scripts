#!/usr/bin/env python3
"""
create or update a trailing stop order for each open position.
the stop value should be based on the n14 average true rate.
"""
import math

from alpaca_trade_api.rest import Order, Position
from dotenv.main import load_dotenv
from stockstats import StockDataFrame

from trading_scripts.utils.constants import ATR_MULTIPLIER
from trading_scripts.utils.helpers import (
    create_client,
    get_historical_data,
    get_last_quote,
    get_trailing_stop_orders,
    validate_env_vars,
)
from trading_scripts.utils.logger import logger

load_dotenv()

# create an alpaca client
api = create_client()


data_cache = {}


def get_data_for_symbol(symbol: str):
    if symbol not in data_cache:
        data_cache[symbol] = get_historical_data(
            symbol=symbol, interval="30m", period="5d"
        )
    return data_cache[symbol]


def calculate_trail_stop_price(order: Order):
    data = get_data_for_symbol(order.symbol)
    share_price = get_last_quote(order.symbol)
    stock = StockDataFrame.retype(data.copy())
    atr = stock.get("atr").iloc[-1]
    stop_price = share_price - atr * ATR_MULTIPLIER
    trail_price = share_price - stop_price
    logger.debug(
        f"share_price: {share_price}, stop_price: {stop_price}; atr: {atr}, trail_price: {trail_price}"
    )
    return [stop_price, trail_price]


def replace_existing_order(order: Order):
    stop_price, trail_price = calculate_trail_stop_price(order)
    if order.stop_price > stop_price:
        logger.info(
            f"Existing stop price of {order.stop_price} is greater than {stop_price}"
        )
        return
    logger.info("Replacing trailing stop loss order")
    try:
        sell_order = api.replace_order(
            order_id=order.id,
            stop_price=stop_price,
            trail=trail_price,
        )
        logger.debug(sell_order)
    except Exception as error:
        logger.error(f"Error:\n{error}")
        return
    logger.success(f"Replaced order with new order id: {sell_order.id}")


def create_new_tsl_order(position: Position) -> None:
    _, trail_price = calculate_trail_stop_price(position)

    try:
        sell_order = api.submit_order(
            side="sell",
            symbol=position.symbol,
            type="trailing_stop",
            qty=math.floor(float(position.qty)),
            time_in_force="gtc",
            trail_price=trail_price,
        )
        logger.debug(f"new trailing stop order:\n{sell_order}")
        logger.success(
            f"Created new order for {sell_order.symbol} trail price: {trail_price}"
        )
    except Exception as error:
        logger.error(f"Error:\n{error}")


def set_trailing_stop_loss(position: Position) -> None:
    symbol = position.symbol
    orders = get_trailing_stop_orders(symbol)
    if len(orders):
        for order in orders:
            logger.info(f"replacing open trailing stop  order for {symbol}")
            replace_existing_order(order)
    else:
        logger.info(f"creating new trailing stop  order for {symbol}")
        create_new_tsl_order(position)


def main():
    # get open positions
    positions = api.list_positions()
    logger.info(
        f"Updating trailing stop losses for orders: {' '.join(position.symbol for  position in positions)}"
    )
    for position in positions:
        set_trailing_stop_loss(position)


if __name__ == "__main__":
    validate_env_vars()
    main()
