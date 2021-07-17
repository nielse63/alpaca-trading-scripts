from finviz.screener import Screener

from trading_scripts.lib.Backtester import Backtester
from trading_scripts.utils.logger import logger as log


def main():
    filters = [
        "geo_usa",
        "sh_avgvol_o500",
        "sh_curvol_o500",
        "sh_price_5to100",
        "ta_sma20_pa",
    ]  # https://finviz.com/screener.ashx?v=171&f=geo_usa,sh_avgvol_o500,sh_curvol_o500,sh_price_5to100,ta_sma20_pa&ft=4&o=-sma20
    stock_list = Screener(filters=filters, order="-sma20", table="Technical")

    def sort_fn(e):
        return e["return_pct"]

    log.debug(f"Finviz screener results: {len(stock_list)} items")
    output = []
    for stock in stock_list:
        sma_20 = float(stock["SMA20"].replace("%", ""))
        if sma_20 < 1:
            continue
        symbol = stock["Ticker"]
        backtester = Backtester(symbol=symbol, cash=10000)
        results = backtester.get_results()

        if results["return_pct"] < 7:
            continue
        if results["return_pct"] < results["buy_and_hold_pct"]:
            continue

        # store to output
        output.append(results)

    # sort output by return %
    output.sort(key=sort_fn, reverse=True)
    # print(f"Length: {len(output)}")
    return output[0:3]


if __name__ == "__main__":
    tickers = main()
    print(tickers)
