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
  const isMacdTrendUp = macdHistogram > secondToLast.macdHistogram!;

  // determine buy signal
  const shouldBuy =
    emaFast > emaSlow && macdValue > macdSignal && isMacdTrendUp && rsi < 70;
  // console.log({
  //   symbol: data.symbol,
  //   emaFast,
  //   emaSlow,
  //   macdValue,
  //   macdSignal,
  //   macdHistogram,
  //   secondToLastMacdHistogram: secondToLast.macdHistogram,
  //   rsi,
  //   emaSignal: emaFast > emaSlow,
  //   macdSig: macdValue > macdSignal,
  //   isMacdTrendUp,
  //   rsiSignal: rsi < 70,
  // });
  if (shouldBuy) {
    output.signals.buy = true;
  }

  // determine sell signal
  if (emaFast <= emaSlow && rsi > 30) {
    output.signals.sell = true;
    output.signals.buy = false;
  }

  return output;
};

export default applySignals;
