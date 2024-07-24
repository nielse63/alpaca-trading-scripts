import { IndicatorsObjectType, SignalsObjectType } from '../crypto/types.d';

const applySignals = (data: IndicatorsObjectType): SignalsObjectType => {
  const output = {
    ...data,
    signals: {
      buy: false,
      sell: false,
    },
  };
  const { lastIndicators, data: bars } = data;
  const { emaFast, emaSlow, macdValue, macdSignal, macdHistogram, rsi } =
    lastIndicators;
  const secondToLast = bars[bars.length - 2];
  const macdTrend = macdHistogram - secondToLast.macdHistogram!;
  const isMacdTrendUp = macdValue > macdSignal && macdTrend > 0;

  // determine buy signal
  if (emaFast > emaSlow && isMacdTrendUp && rsi < 70) {
    output.signals.buy = true;
  }

  // determine sell signal
  if (emaFast < emaSlow && rsi > 30) {
    output.signals.sell = true;
    output.signals.buy = false;
  }

  return output;
};

export default applySignals;
