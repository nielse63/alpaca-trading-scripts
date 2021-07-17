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
        log.warn("Market not open. No buying or selling activity will execute")

    oc = OrderCleanup()

    # cancel open buy orders
    oc.close_open_buy_orders()

    # screen for potential assets to buy
    tickers = []
    if market_open:
        tickers = screener(max_count=3)

    # buy only when market is opoen
    for dictionary in tickers:
        symbol = dictionary["symbol"]
        buyer = Buyer(symbol)
        buyer.run()

    # sell orders can be only during market hours
    Seller().run()

    # cleanup all orders when not trading
    if not market_open:
        oc.run()


if __name__ == "__main__":
    main()
