# Strategy

> See [https://www.tradingview.com/chart/BAC/MAuOm8Zr-EMA-Crossover-11-26-w-stop-loss/](https://www.tradingview.com/chart/BAC/MAuOm8Zr-EMA-Crossover-11-26-w-stop-loss/)

- Evaluate EMA 11/26
- if `fast ma > slow ma`
  - if `position size <= 0`
    - close short positions
  - close all open orders
  - if `account cash balance > share price`
    - enter long position
      - limit price at last close
      - stop price of last close \* 0.985
- else if `fast ma < slow ma` and `account equity > 2000`
  - if `position size > 0`
    - close long positions
  - close all open orders
  - enter short position
    - limit price at last close
    - stop price of last close \* 1.015
