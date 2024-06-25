import { getBuyingPower } from './account';
import alpaca from './alpaca';
import { getCurrentPrice, getLastBar } from './bars';
import { SYMBOL, TRAILING_STOP_LOSS_PERCENT } from './constants';
import { getPositions } from './position';

export const waitForOrderFill = (orderId: string) =>
  new Promise((resolve, reject) => {
    console.log(`[info] waiting for order ${orderId} to fill`);
    const getBuyOrderInterval = setInterval(async () => {
      try {
        const buyOrder = await alpaca.getOrder(orderId);
        console.log(`[info] order ${orderId} status: ${buyOrder.status}`);
        if (buyOrder.status === 'filled') {
          clearInterval(getBuyOrderInterval);
          resolve(buyOrder);
        }
      } catch (error) {
        clearInterval(getBuyOrderInterval);
        reject(error);
      }
    }, 1000);
  });

export const getShouldBuy = async () => {
  const buyingPower = await getBuyingPower();

  // true if sma_fast > sma_slow
  const { ema } = await getLastBar();
  const output = ema.fast > ema.slow;
  console.log(
    `should buy: ${output} (buyingPower = ${buyingPower}; ema.fast = ${ema.fast}; ema.slow = ${ema.slow})`
  );
  return true;
  // return output;
};

export const buy = async () => {
  // cancel all open buy orders
  await alpaca.cancelAllOrders();

  // determine if we meet buy conditions
  if (await getShouldBuy()) {
    const buyingPower = await getBuyingPower();
    const currentPrice = await getCurrentPrice();
    const qty = Math.floor(buyingPower / currentPrice);
    if (qty < 1) {
      console.log('[info] not enough buying power');
      return;
    }

    console.log('[info] buying', qty, 'of', SYMBOL, 'at', currentPrice);
    const buyOrder = await alpaca.createOrder({
      symbol: SYMBOL,
      qty: qty,
      side: 'buy',
      type: 'market',
      time_in_force: 'day',
    });
    console.log('[info] buy order:', buyOrder);
    await waitForOrderFill(buyOrder.id);
    const tslOrder = await alpaca.createOrder({
      symbol: SYMBOL,
      qty: buyOrder.qty,
      side: 'sell',
      type: 'trailing_stop',
      trail_percent: TRAILING_STOP_LOSS_PERCENT,
      time_in_force: 'gtc',
    });
    console.log('[info] trailing stop loss order:', tslOrder);
  }
};

export const getShouldSell = async () => {
  const positions = await getPositions();
  const { ema } = await getLastBar();
  const output = Boolean(positions.length && ema.fast < ema.slow);
  console.log(
    `should sell: ${output} (positions.length = ${positions.length}; ema.fast = ${ema.fast}; ema.slow = ${ema.slow})`
  );
  return output;
};

export const sell = async () => {
  if (await getShouldSell()) {
    await alpaca.cancelAllOrders();
    await alpaca.closePosition(SYMBOL);
  }
};
