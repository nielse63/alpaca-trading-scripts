from pathlib import Path

from loguru import logger

logfile = Path(__file__).parent.parent.parent / "logs/alpaca-trading-scripts.log"
logger.add(sink=logfile, rotation="1 week", compression="zip")


log = logger
