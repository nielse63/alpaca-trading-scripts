import { SignalsObjectType } from '../types.d';
import applyIndicators from './applyIndicators';
import applySignals from './applySignals';
import getBars from './getBars';

const getBarsWithSignals = async (
  symbol: string
): Promise<SignalsObjectType> => {
  const bars = await getBars(symbol);
  const barsWithIndicators = applyIndicators(bars);
  const barsWithSignals = applySignals(barsWithIndicators);
  return barsWithSignals;
};

export default getBarsWithSignals;
