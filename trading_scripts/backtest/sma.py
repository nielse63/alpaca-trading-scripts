import pathlib

import yfinance as yf
from backtesting import Backtest

from trading_scripts.backtest.strategies.SmaStrategy import SmaStrategy
from trading_scripts.utils.logger import logger as log


def get_data(symbol: str):
    ticker = yf.Ticker(symbol)
    return ticker.history(period="1y")


def main(symbol: str, cash=10_000, print_data=False):
    data = get_data(symbol)

    # create and run backtest
    bt = Backtest(data, SmaStrategy, commission=0.0, exclusive_orders=True, cash=cash)
    # stats = bt.run()
    stats = bt.optimize(
        sma_fast=range(7, 20, 3),
        sma_slow=range(25, 50, 5),
        atr=range(1, 5),
        maximize="Equity Final [$]",
        constraint=lambda param: param.sma_fast < param.sma_slow,
    )

    # print the result
    if print_data:
        log.info("Backtest Results")
        print(stats)
        log.info("Trade Executions")
        print(stats["_trades"])
        chart_file = pathlib.Path(__file__).parent.parent.parent / "docs/backtest.html"
        log.info("Matplotlib chart saved to docs/backtest.html")
        print(chart_file)
        bt.plot(filename=str(chart_file), open_browser=False)

    # return the stats series
    return stats


if __name__ == "__main__":
    try:
        data = main("TWTR")
        print(data["_strategy"])
    except AssertionError:
        print("AssertionError")
