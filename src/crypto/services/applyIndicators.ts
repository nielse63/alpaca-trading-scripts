import { EMA, MACD, RSI } from 'trading-signals';
import {
  EMA_FAST_PERIOD,
  EMA_SLOW_PERIOD,
  MACD_LONG_INTERVAL,
  MACD_SHORT_INTERVAL,
  MACD_SIGNAL_INTERVAL,
  RSI_INTERVAL,
} from '../constants';
import { BarObject, IndicatorsObjectType } from '../types.d';

const applyIndicators = (bars: BarObject[]): IndicatorsObjectType => {
  const barsClone: any[] = [...bars].map((bar) => {
    return {
      ...bar,
      emaFast: null,
      emaSlow: null,
      macdValue: null,
      macdSignal: null,
      macdHistogram: null,
      rsi: null,
    };
  });
  const data = bars.map((d) => d.close);
  const symbol = bars[0].symbol;
  const emaFast = new EMA(EMA_FAST_PERIOD);
  const emaSlow = new EMA(EMA_SLOW_PERIOD);
  const macd = new MACD({
    indicator: EMA,
    longInterval: MACD_LONG_INTERVAL,
    shortInterval: MACD_SHORT_INTERVAL,
    signalInterval: MACD_SIGNAL_INTERVAL,
  });
  const rsi = new RSI(RSI_INTERVAL);
  data.forEach((d, i) => {
    emaFast.update(d);
    emaSlow.update(d);
    macd.update(d);
    rsi.update(d);

    // ema
    if (emaFast.isStable) {
      barsClone[i].emaFast = parseFloat(emaFast.getResult().toFixed(4));
    }
    if (emaSlow.isStable) {
      barsClone[i].emaSlow = parseFloat(emaSlow.getResult().toFixed(4));
    }

    // macd
    if (macd.isStable) {
      barsClone[i].macdValue = parseFloat(macd.getResult().macd.toFixed(4));
      barsClone[i].macdSignal = parseFloat(macd.getResult().signal.toFixed(4));
      barsClone[i].macdHistogram = parseFloat(
        macd.getResult().histogram.toFixed(4)
      );
    }

    //rsi
    if (rsi.isStable) {
      barsClone[i].rsi = parseFloat(rsi.getResult().toFixed(4));
    }
  });

  const lastBar = barsClone[barsClone.length - 1];

  return {
    symbol,
    data: barsClone,
    lastIndicators: {
      emaFast: lastBar.emaFast,
      emaSlow: lastBar.emaSlow,
      macdValue: lastBar.macdValue,
      macdSignal: lastBar.macdSignal,
      macdHistogram: lastBar.macdHistogram,
      rsi: lastBar.rsi,
      close: lastBar.close,
    },
  };
};

export default applyIndicators;
