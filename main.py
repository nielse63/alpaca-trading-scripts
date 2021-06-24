#!/usr/bin/env python3
from dotenv import load_dotenv

from trading_scripts.lib.Buyer import Buyer
from trading_scripts.lib.Seller import Seller
from trading_scripts.utils.helpers import is_market_open, validate_env_vars

load_dotenv()


def main():
    if not is_market_open():
        return
    validate_env_vars()

    # buy
    buyer = Buyer("AAPL")
    buyer.run()

    # sell
    Seller().run()


if __name__ == "__main__":
    main()
