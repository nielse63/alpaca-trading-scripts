#!/usr/bin/env python3
from dotenv import load_dotenv

from trading_scripts.lib.Buyer import Buyer
from trading_scripts.lib.Seller import Seller
from trading_scripts.screener import main as screener
from trading_scripts.utils.helpers import is_market_open, validate_env_vars
from trading_scripts.utils.logger import logger

load_dotenv()


def main():
    if not is_market_open():
        logger.warning("Market is not open - stopping execution")
        return

    validate_env_vars()

    # buy
    symbol_dicts = screener()
    for symbol_dict in symbol_dicts:
        symbol = symbol_dict["symbol"]
        buyer = Buyer(symbol)
        buyer.run()

    # sell
    Seller().run()


if __name__ == "__main__":
    main()
