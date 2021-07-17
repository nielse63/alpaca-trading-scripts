import pathlib

import pandas as pd
from backtesting import Backtest
from backtesting.lib import SignalStrategy, TrailingStrategy
from backtesting.test import SMA

from trading_scripts.utils.constants import (
    ATR_MULTIPLIER,
    EQUITY_PCT_PER_TRADE,
    HISTORICAL_DATA_INTERVAL,
    HISTORICAL_DATA_PERIOD,
    TICKER_SYMBOL,
)
from trading_scripts.utils.helpers import get_historical_data


def get_data():
    df = get_historical_data(
        symbol=TICKER_SYMBOL,
        interval=HISTORICAL_DATA_INTERVAL,
        period=HISTORICAL_DATA_PERIOD,
    )
    df.drop(columns=["Dividends", "Stock Splits"], inplace=True)
    return df


def strfdelta(tdelta, fmt):
    d = {"days": tdelta.days}
    d["hours"], rem = divmod(tdelta.seconds, 3600)
    d["minutes"], d["seconds"] = divmod(rem, 60)
    return fmt.format(**d)


class SmaCross(SignalStrategy, TrailingStrategy):
    n1 = 10
    n2 = 25

    def init(self):
        # In init() and in next() it is important to call the
        # super method to properly initialize the parent classes
        super().init()

        # Precompute the two moving averages
        sma1 = self.I(SMA, self.data.Close, self.n1)
        sma2 = self.I(SMA, self.data.Close, self.n2)

        # Where sma1 crosses sma2 upwards. Diff gives us [-1,0, *1*]
        signal = (pd.Series(sma1) > sma2).astype(int).diff().fillna(0)
        signal = signal.replace(-1, 0)  # Upwards/long only

        # Use 95% of available liquidity (at the time) on each order.
        # (Leaving a value of 1. would instead buy a single share.)
        entry_size = signal * EQUITY_PCT_PER_TRADE

        # Set order entry sizes using the method provided by
        # `SignalStrategy`. See the docs.
        self.set_signal(entry_size=entry_size)

        # Set trailing stop-loss to 2x ATR using
        # the method provided by `TrailingStrategy`
        self.set_trailing_sl(ATR_MULTIPLIER)


if __name__ == "__main__":
    bt = Backtest(get_data(), SmaCross, cash=10000, commission=0)
    output: pd.Series = bt.run()
    table = output.copy()
    table.name = "Results"
    for index, value in table.items():
        if index.startswith("_"):
            table.drop(labels=[index], inplace=True)
            continue
        new_value = str(value)
        if "[%]" in index and isinstance(value, float):
            new_value = "{0:.2f}%".format(value)
        elif isinstance(value, float):
            new_value = "{:n}".format(value)
        elif isinstance(value, pd.Timedelta):
            new_value = strfdelta(value, "{days} days")
        elif isinstance(value, pd.Timestamp):
            new_value = "{:%x}".format(value)
        table[index] = new_value

    # print to md file
    results_table = table.to_markdown(
        buf=None,
        colalign=("left", "right"),
        headers=[table.name],
    )
    trades_tables = pd.DataFrame(output._trades).to_markdown(buf=None, index=False)
    markdown_string = f"""# Backtest Results

## Results

{results_table}

## Trades

{trades_tables}
    """

    filepath = (
        pathlib.Path(__file__).parent.parent.parent / "docs/results/backtest-results.md"
    )
    with open(filepath, "w+") as f:
        f.write(markdown_string)

    bt.plot(filename="docs/results/backtest-graph.html", open_browser=False)
