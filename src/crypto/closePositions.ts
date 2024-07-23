import alpaca from '../alpaca';
import { log, error } from '../helpers';
import {
  calculateIndicators,
  fetchHistoricalData,
  generateSignals,
} from './helpers';
import { AlpacaPosition } from './types.d';

const closePositions = async (positions: AlpacaPosition[]) => {
  const closedPositions = [];
  for (const position of positions) {
    const { symbol, asset_id: assetId } = position;
    const data = await fetchHistoricalData(symbol);
    const dataWithIndicators = calculateIndicators(data);
    const dataWithSignals = generateSignals(dataWithIndicators);
    const lastBar = dataWithSignals[data.length - 1];
    if (lastBar.signal === -1) {
      try {
        closedPositions.push(symbol);
        log(`closing all posiitons for ${symbol}`);
        await alpaca.closePosition(assetId);
      } catch (e: any) {
        console.error(e?.response?.data);
        error(e);
      }
    }
  }
  return closedPositions;
};

export default closePositions;
