import os
from pathlib import Path

from loguru import logger

if not os.getenv("IS_TEST"):
    logfile = Path(__file__).parent.parent.parent / "logs/alpaca-trading-scripts.log"
    logger.add(sink=logfile, rotation="1 week", compression="zip")


log = logger
