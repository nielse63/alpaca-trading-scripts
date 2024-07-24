import alpaca from '../alpaca';
import { error, log } from '../helpers';
import { getBarsWithSignals } from '../bars';
import { AlpacaPosition } from './types.d';
import { BARS_TIMEFRAME_STRING } from './constants';

const closePositions = async (
  positions: AlpacaPosition[],
  timeframe: string = BARS_TIMEFRAME_STRING
) => {
  const closedPositions = [];
  for (const position of positions) {
    const { symbol, asset_id: assetId } = position;
    const barsWithSignals = await getBarsWithSignals(symbol, timeframe);
    if (!barsWithSignals.signals.sell) {
      continue;
    }
    try {
      closedPositions.push(symbol);
      log(`closing all posiitons for ${symbol}`);
      await alpaca.closePosition(assetId);
    } catch (e: any) {
      console.error(e?.response?.data);
      error(e);
    }
  }
  return closedPositions;
};

export default closePositions;
