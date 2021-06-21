#!/usr/bin/env python3
from dotenv import load_dotenv

from trading_scripts.buy import main as buy
from trading_scripts.trailing_stop import main as trailing_stop
from trading_scripts.utils.helpers import is_market_open, validate_env_vars
from trading_scripts.utils.logger import logger


def main():
    if not is_market_open():
        logger.warning("Market is not open yet - exiting")
        return

    logger.info("Starting main run")

    validate_env_vars()
    trailing_stop()
    buy()

    logger.success("Main run complete")


if __name__ == "__main__":
    load_dotenv()
    main()
