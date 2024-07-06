import { EMA } from 'trading-signals';
import alpaca from './alpaca';
import { getTradingDates } from './clock';
import {
  SMA_FAST_INTERVAL,
  SMA_SLOW_INTERVAL,
  SYMBOL,
  TIME_INTERVAL,
  cache,
} from './constants';
import { generatorToArray } from './helpers';
import { AlpacaBar } from './types.d';

export const getBars = async (symbol?: string) => {
  if (cache.bars && cache.bars.length) {
    return cache.bars;
  }

  const pastTradingDays = await getTradingDates();
  const response = alpaca.getBarsV2(symbol || SYMBOL, {
    start: pastTradingDays.shift().date,
    end: pastTradingDays.pop().date,
    timeframe: TIME_INTERVAL,
  });

  const bars = await generatorToArray(response);

  const emaFast = new EMA(SMA_FAST_INTERVAL);
  const emaSlow = new EMA(SMA_SLOW_INTERVAL);
  const latestBar = await alpaca.getLatestBar(SYMBOL);
  bars.push(latestBar);
  cache.bars = bars.map((b: AlpacaBar, i: number) => {
    const bar = {
      ...b,
      ema: {
        fast: 0,
        slow: 0,
      },
    };
    emaFast.update(bar.ClosePrice);
    emaSlow.update(bar.ClosePrice);
    if (i >= SMA_FAST_INTERVAL) {
      bar.ema.fast = parseFloat(emaFast.getResult().valueOf());
    }
    if (i >= SMA_SLOW_INTERVAL) {
      bar.ema.slow = parseFloat(emaSlow.getResult().valueOf());
    }
    return bar;
  });
  return cache.bars;
};

export const getLastBar = async () => {
  const bars = await getBars();
  return bars[bars.length - 1];
};

export const getCurrentPrice = async () => {
  const response = await alpaca.getLatestBar(SYMBOL);
  return response.ClosePrice;
};
