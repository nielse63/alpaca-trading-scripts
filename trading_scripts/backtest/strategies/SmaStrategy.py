import pandas as pd
from backtesting.lib import SignalStrategy, TrailingStrategy
from backtesting.test import SMA


class SmaStrategy(SignalStrategy, TrailingStrategy):
    sma_fast = 10
    sma_slow = 25
    atr = 2.5

    def init(self):
        # In init() and in next() it is important to call the
        # super method to properly initialize the parent classes
        super().init()

        self.sma1 = self.I(SMA, self.data.Close, self.sma_fast)
        self.sma2 = self.I(SMA, self.data.Close, self.sma_slow)

        signal = (pd.Series(self.sma1) > self.sma2).astype(int).diff().fillna(0)
        signal = signal.replace(-1, 0)  # Upwards/long only
        # Use 95% of available liquidity (at the time) on each order.
        # (Leaving a value of 1. would instead buy a single share.)
        entry_size = signal * 0.95

        # self.entry_signal = self.sma1 > self.sma2
        self.set_signal(entry_size=entry_size)

        # Set trailing stop-loss to 2x ATR using
        # the method provided by `TrailingStrategy`
        self.set_trailing_sl(self.atr)


# if __name__ == "__main__":
#     data = get_data()

#     # create and run backtest
#     bt = Backtest(data, SmaCross, commission=0.0, exclusive_orders=True, cash=10_000)
#     # stats = bt.run()
#     stats = bt.optimize(
#         sma_fast=range(5, 30, 5),
#         sma_slow=range(10, 70, 5),
#         atr=range(1, 5, 1),
#         maximize="Equity Final [$]",
#         constraint=lambda param: param.sma_fast < param.sma_slow,
#     )

#     # print stats
#     print(stats)

#     # print trades
#     print(stats["_trades"])

#     # plot data
#     bt.plot(filename="backtest.html", open_browser=False)
