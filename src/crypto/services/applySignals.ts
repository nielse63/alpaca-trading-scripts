import { IndicatorsObjectType, SignalsObjectType } from '../types.d';

const applySignals = (data: IndicatorsObjectType): SignalsObjectType => {
  const output = {
    ...data,
    signals: {
      buy: false,
      sell: false,
    },
  };
  const { lastIndicators } = data;
  const { emaFast, emaSlow, macdValue, macdSignal, macdHistogram, rsi } =
    lastIndicators;

  // determine buy signal
  if (
    emaFast > emaSlow &&
    (macdValue > macdSignal || macdHistogram > 0) &&
    rsi < 70
  ) {
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
