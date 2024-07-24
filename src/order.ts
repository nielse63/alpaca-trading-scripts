import { getBuyingPower } from './account';
import alpaca from './alpaca';
import { applyIndicators, applySignals } from './bars';
import getStockBars from './getStockBars';
import { SYMBOL, TRAILING_STOP_LOSS_PERCENT } from './constants';
import { log } from './helpers';

export const getBarsWithSignals = async (symbol: string, timeframe: string) => {
  const bars = await getStockBars(symbol, timeframe);
  // console.log({ symbol, timeframe, bars });
  const barsWithIndicators = applyIndicators(bars);
  const barsWithSignals = applySignals(barsWithIndicators);
  return barsWithSignals;
};

export const waitForOrderFill = (orderId: string) =>
  new Promise((resolve, reject) => {
    log(`[info] waiting for order ${orderId} to fill`);
    const getBuyOrderInterval = setInterval(async () => {
      try {
        const buyOrder = await alpaca.getOrder(orderId);
        log(`[info] order ${orderId} status: ${buyOrder.status}`);
        if (buyOrder.status === 'filled') {
          clearInterval(getBuyOrderInterval);
          resolve(buyOrder);
        }
      } catch (e) {
        clearInterval(getBuyOrderInterval);
        reject(e);
      }
    }, 1000);
  });

export const getShouldBuy = async () => {
  const barsWithSignals = await getBarsWithSignals(SYMBOL, '1Day');

  // true if sma_fast > sma_slow
  const output = barsWithSignals.signals.buy;
  const { emaFast, emaSlow } = barsWithSignals.lastIndicators;
  log(`should buy: ${output} (ema.fast = ${emaFast}; ema.slow = ${emaSlow})`);
  return output;
};

export const buy = async () => {
  // cancel all open buy orders
  await alpaca.cancelAllOrders();

  // determine if we meet buy conditions
  if (await getShouldBuy()) {
    const buyingPower = await getBuyingPower();

    // get latest quotes
    const quote = await alpaca.getLatestQuote(SYMBOL);
    const latestBidPrice = quote.BidPrice;
    const qty = Math.floor(buyingPower / latestBidPrice);
    if (qty < 1) {
      log('[info] not enough buying power');
      return;
    }

    log('[info] buying', qty, 'of', SYMBOL, 'at', latestBidPrice);
    const buyOrder = await alpaca.createOrder({
      symbol: SYMBOL,
      qty: qty,
      side: 'buy',
      type: 'market',
      time_in_force: 'day',
    });
    log('[info] buy order:', buyOrder);
    await waitForOrderFill(buyOrder.id);
    const tslOrder = await alpaca.createOrder({
      symbol: SYMBOL,
      qty: buyOrder.qty,
      side: 'sell',
      type: 'trailing_stop',
      trail_percent: TRAILING_STOP_LOSS_PERCENT,
      time_in_force: 'gtc',
    });
    log('[info] trailing stop loss order:', tslOrder);
  }
};

export const getShouldSell = async () => {
  const barsWithSignals = await getBarsWithSignals(SYMBOL, '1Day');
  // console.log({ barsWithSignals });
  const output = barsWithSignals.signals.sell;
  const { emaFast, emaSlow } = barsWithSignals.lastIndicators;
  log(`should sell: ${output} (ema.fast = ${emaFast}; ema.slow = ${emaSlow})`);
  return output;
};

export const sell = async () => {
  if (await getShouldSell()) {
    // await alpaca.cancelAllOrders();
    await alpaca.closePosition(SYMBOL);
  }
};
