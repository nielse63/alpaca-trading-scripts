import alpaca from '../alpaca';
import { log } from '../helpers';
import {
  calculateIndicators,
  fetchHistoricalData,
  generateSignals,
} from './helpers';
import { AlpacaPosition } from './types.d';

const closePositions = async (positions: AlpacaPosition[]) => {
  const closedPositions = [];
  for (const position of positions) {
    const { symbol } = position;
    const data = await fetchHistoricalData(symbol);
    const dataWithIndicators = calculateIndicators(data);
    const dataWithSignals = generateSignals(dataWithIndicators);
    const lastBar = dataWithSignals[data.length - 1];
    if (lastBar.signal === -1) {
      closedPositions.push(symbol);
      log(`closing all posiitons for ${symbol}`);
      await alpaca.closePosition(symbol);
    }
  }
  return closedPositions;
};

export default closePositions;
