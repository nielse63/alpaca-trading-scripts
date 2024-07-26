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
    try {
      closedPositions.push(symbol);
      log(`closing all posiitons for ${symbol}`);
      if (!IS_DEV) {
        // close the position
        // const { close: sellPrice } = data[data.length - 1];
        // const qty = parseFloat(position.qty);
        // await createStopLimitSellOrder(symbol, qty, sellPrice);
        // const quotes = await alpaca.getLatestCryptoQuotes([symbol]);
        // const quote = quotes.get(symbol);
        // log('quote (closePositions)', quote);
        try {
          // delete all open orders for the symbol
          await deleteOrdersForSymbol(symbol);
          // close positions
          await alpaca.closePosition(assetId);
        } catch (e: any) {
          error(`error closing position for ${symbol}`, e?.response?.data);
        }
      }
    } catch (e: any) {
      console.error(e?.response?.data);
      error(e);
    }
  }
  return closedPositions;
};

export default closePositions;
