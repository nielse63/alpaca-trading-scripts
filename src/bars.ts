import { SMA } from 'trading-signals';
import { AlpacaBar } from './types';
import {
  SYMBOL,
  SMA_FAST_INTERVAL,
  SMA_SLOW_INTERVAL,
  cache,
} from './constants';
import alpaca from './alpaca';
import { getTradingDates } from './clock';
import { generatorToArray } from './helpers';

export const getBars = async () => {
  if (cache.bars && cache.bars.length) {
    return cache.bars;
  }

  const pastTradingDays = await getTradingDates();
  const response = alpaca.getBarsV2(SYMBOL, {
    start: pastTradingDays.shift().date,
    end: pastTradingDays.pop().date,
    timeframe: '1Day',
  });

  const bars = await generatorToArray(response);

  const smaFast = new SMA(SMA_FAST_INTERVAL);
  const smaSlow = new SMA(SMA_SLOW_INTERVAL);
  const latestBar = await alpaca.getLatestBar(SYMBOL);
  bars.push(latestBar);
  cache.bars = bars.map((b: AlpacaBar, i: number) => {
    const bar = {
      ...b,
      sma: {
        fast: 0,
        slow: 0,
      },
    };
    smaFast.update(bar.ClosePrice);
    smaSlow.update(bar.ClosePrice);
    if (i >= SMA_FAST_INTERVAL) {
      bar.sma.fast = parseFloat(smaFast.getResult().valueOf());
    }
    if (i >= SMA_SLOW_INTERVAL) {
      bar.sma.slow = parseFloat(smaSlow.getResult().valueOf());
    }
    return bar;
  });
  return cache.bars;
};

export const getLastBar = async () => {
  const bars = await getBars();
  return bars[bars.length - 1];
};
