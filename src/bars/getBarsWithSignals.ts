import { SignalsObjectType } from '../crypto/types.d';
import applyIndicators from './applyIndicators';
import applySignals from './applySignals';
import getBars from './getBars';
import { BARS_TIMEFRAME_STRING } from '../crypto/constants';
import { log } from '../helpers';

const getBarsWithSignals = async (
  symbol: string,
  timeframe: string = BARS_TIMEFRAME_STRING
): Promise<SignalsObjectType> => {
  log(`evaluating buy signals for: ${symbol}`);
  const bars = await getBars(symbol, timeframe);
  const barsWithIndicators = applyIndicators(bars);
  const barsWithSignals = applySignals(barsWithIndicators);
  return barsWithSignals;
};

export default getBarsWithSignals;
