from finviz.screener import Screener

from trading_scripts.lib.Backtester import Backtester
from trading_scripts.utils.helpers import get_open_sell_orders
from trading_scripts.utils.logger import logger as log


def sort_fn(e):
    return e["return_offset"]


def main() -> list[dict]:
    stock_list = Screener.init_from_url(
        "https://finviz.com/screener.ashx?v=171&f=geo_usa,sh_avgvol_o500,sh_curvol_o500,sh_price_5to100,ta_sma20_pa&ft=4&o=-sma20"
    )

    # log.debug(f"Finviz screener results: {len(stock_list)} items")
    output = []
    sell_order_symbols = get_open_sell_orders()
    for stock in stock_list:
        symbol = stock["Ticker"]
        # don't buy  what we already have stake in - prevent PTD
        if symbol in sell_order_symbols:
            log.debug(f"Skipping {symbol} - open sell order already opened")
            continue
        backtester = Backtester(symbol=symbol)
        results = backtester.get_results()

        if results["return_pct"] < 7:
            continue
        if results["return_offset"] < 0:
            continue
        if results["expectancy"] < 0:
            continue
        if results["return_pct"] < results["buy_and_hold_pct"]:
            continue

        # store to output
        output.append(results)

    # sort output
    output.sort(key=sort_fn, reverse=True)
    return output


if __name__ == "__main__":
    tickers = main()
    print(tickers)
