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
from trading_scripts.utils.logger import logger as log


def get_data(symbol):
    df = get_historical_data(
        symbol=symbol,
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


class Backtester:
    def __init__(self, symbol: str = TICKER_SYMBOL, cash: int = 10_000):
        self.symbol = symbol
        self.cash = cash

    def get_results(self):
        log.info(f"Backtesting {self.symbol}")
        data = get_data(self.symbol)
        try:
            bt = Backtest(data, SmaCross, cash=self.cash, commission=0)
            series: pd.Series = bt.run()
            return_pct = series.get(key="Return [%]")
            buy_and_hold_pct = series.get(key="Buy & Hold Return [%]")
            max_drawdown_pct = series.get(key="Max. Drawdown [%]")

            return {
                "symbol": self.symbol,
                "return_pct": return_pct,
                "buy_and_hold_pct": buy_and_hold_pct,
                "max_drawdown_pct": max_drawdown_pct,
            }
        except Exception as error:
            log.warning(f"Error backtesting {self.symbol}: {error}")
            print(error)

        return {
            "symbol": self.symbol,
            "return_pct": 0,
            "buy_and_hold_pct": 0,
            "max_drawdown_pct": 0,
        }
