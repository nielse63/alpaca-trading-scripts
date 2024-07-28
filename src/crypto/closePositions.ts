import alpaca from '../alpaca';
import { getBarsWithSignals } from '../bars';
import { error, log } from '../helpers';
import { BARS_TIMEFRAME_STRING, IS_DEV } from './constants';
import { deleteOrdersForSymbol /*, createStopLimitSellOrder*/ } from './orders';
import { AlpacaPosition } from './types.d';

const closePositions = async (
  positions: AlpacaPosition[],
  timeframe: string = BARS_TIMEFRAME_STRING
) => {
  const closedPositions = [];
  for (const position of positions) {
    const { symbol, asset_id: assetId } = position;
    log(`checking ${symbol} for close signal`);
    const barsWithSignals = await getBarsWithSignals(symbol, timeframe);
    const { /*data,*/ signals } = barsWithSignals;
    if (!signals.sell) {
      continue;
    }
    closedPositions.push(symbol);
    log(`closing all posiitons for ${symbol}`);
    if (!IS_DEV) {
      try {
        // delete all open orders for the symbol
        await deleteOrdersForSymbol(symbol);
        // close positions
        await alpaca.closePosition(assetId);
      } catch (e: any) {
        error(`error closing position for ${symbol}`, e?.response?.data);
      }
    }
  }
  return closedPositions;
};

export default closePositions;
