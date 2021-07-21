#!/usr/bin/env python3
from dotenv import load_dotenv

from trading_scripts.lib.Buyer import Buyer
from trading_scripts.lib.OrderCleanup import OrderCleanup
from trading_scripts.lib.Seller import Seller
from trading_scripts.screener import main as screener
from trading_scripts.utils.helpers import get_cash, is_market_open, validate_env_vars
from trading_scripts.utils.logger import logger as log

load_dotenv()


def main():
    log.info("Starting execution")

    # make sure we have the required env vars defined
    validate_env_vars()

    # cleanup unfilled buy orders and orphaned sell orders
    OrderCleanup().close_open_buy_orders()

    market_open = is_market_open()
    if not market_open:
        log.warning("Market not open. No buying or selling activity will execute")
        return

    # sell orders can be only during market hours
    Seller().run()

    # screen for potential assets to buy
    tickers = []
    if market_open:
        tickers = screener()

    # buy only when market is opoen
    for dictionary in tickers:
        available_cash = get_cash()
        if available_cash < 0:
            log.info(f"Reached cash-to-equity threshold (cash: {available_cash})")
            break
        symbol = dictionary["symbol"]
        buyer = Buyer(symbol=symbol)
        qty = buyer.calc_position_size()
        if qty < 1:
            continue
        order_cost = qty * buyer.last_price
        remaining_cash = available_cash - order_cost
        if available_cash <= 0:
            log.warning(
                f"cant afford to buy {symbol} (qty: {qty}, last_price: {buyer.last_price}, order_cost: {order_cost})"
            )
            continue
        print(
            f"symbol: {symbol}, qty: {qty}, last_price: {buyer.last_price}, order_cost: {order_cost}"
        )
        buyer.run()
        available_cash = remaining_cash

    # run cleanup again
    OrderCleanup().close_open_buy_orders()


if __name__ == "__main__":
    main()
