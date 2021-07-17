from finviz.screener import Screener

from trading_scripts.lib.Backtester import Backtester
from trading_scripts.utils.helpers import get_account


def sort_fn(e):
    return e["return_offset"]


def main() -> list[dict]:
    stock_list = Screener.init_from_url(
        "https://finviz.com/screener.ashx?v=171&f=geo_usa,sh_avgvol_o500,sh_curvol_o500,sh_price_5to100,ta_sma20_pa&ft=4&o=-sma20"
    )

    # log.debug(f"Finviz screener results: {len(stock_list)} items")
    output = []
    account = get_account()
    account_cash = float(account.cash)
    print(f"account_cash: {account_cash}")
    for stock in stock_list:
        symbol = stock["Ticker"]
        backtester = Backtester(symbol=symbol, cash=account_cash)
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
