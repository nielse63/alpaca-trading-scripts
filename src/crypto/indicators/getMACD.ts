import { EMA, MACD } from 'trading-signals';
import {
  MACD_LONG_INTERVAL,
  MACD_SHORT_INTERVAL,
  MACD_SIGNAL_INTERVAL,
} from '../constants';

const getMACD = (
  data: number[],
  longInterval: number = MACD_LONG_INTERVAL,
  shortInterval: number = MACD_SHORT_INTERVAL,
  signalInterval: number = MACD_SIGNAL_INTERVAL
) => {
  const macd = new MACD({
    indicator: EMA,
    longInterval,
    shortInterval,
    signalInterval,
  });
  data.forEach((d) => {
    macd.update(d);
  });

  return {
    macd: parseFloat(macd.getResult().macd.toFixed(4)),
    signal: parseFloat(macd.getResult().signal.toFixed(4)),
    histogram: parseFloat(macd.getResult().histogram.toFixed(4)),
  };
};

export default getMACD;
