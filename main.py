#!/usr/bin/env python3
from dotenv import load_dotenv

from trading_scripts.lib.Buyer import Buyer
from trading_scripts.lib.OrderCleanup import OrderCleanup
from trading_scripts.lib.Seller import Seller
from trading_scripts.screener import main as screener
from trading_scripts.utils.helpers import is_market_open, validate_env_vars
from trading_scripts.utils.logger import logger as log

load_dotenv()


def main():
    log.info("Starting execution")

    # make sure we have the required env vars defined
    validate_env_vars()

    market_open = is_market_open()
    if not market_open:
        log.warning("Market not open. No buying or selling activity will execute")

    # cleanup unfilled buy orders and orphaned sell orders
    OrderCleanup().close_open_buy_orders()

    # screen for potential assets to buy
    tickers = []
    if market_open:
        tickers = screener()
    print(f"tickers length: {len(tickers)}")

    # buy only when market is opoen
    available_cash = Buyer().available_cash
    for dictionary in tickers:
        symbol = dictionary["symbol"]
        print(f"available_cash: {available_cash}")
        buyer = Buyer(symbol=symbol, cash=available_cash)
        qty = buyer.calc_position_size()
        if qty < 1:
            continue
        order_cost = qty * buyer.last_price
        remaining_cash = available_cash - order_cost
        if remaining_cash <= 0:
            log.warning(
                f"cant afford to buy {symbol} (qty: {qty}, last_price: {buyer.last_price}, order_cost: {order_cost})"
            )
            continue
        # print(
        #     f"symbol: {symbol}, qty: {qty}, last_price: {buyer.last_price}, order_cost: {order_cost}"
        # )
        buyer.run()
        available_cash = remaining_cash

    # sell orders can be only during market hours
    Seller().run()


if __name__ == "__main__":
    main()
