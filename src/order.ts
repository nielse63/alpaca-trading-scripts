import { getBuyingPower } from './account';
import alpaca from './alpaca';
import { getLastBar } from './bars';
import { SYMBOL } from './constants';
import { getPositions } from './position';

export const waitForOrderFill = (orderId: string) =>
  new Promise((resolve, reject) => {
    const getBuyOrderInterval = setInterval(async () => {
      try {
        const buyOrder = await alpaca.getOrder(orderId);
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
  // const buyingPower = await getBuyingPower();

  // true if sma_fast > sma_slow
  const { ema } = await getLastBar();
  const output = ema.fast > ema.slow;
  // console.log(
  //   `should buy: ${output} (buyingPower = ${buyingPower}; ema.fast = ${ema.fast}; ema.slow = ${ema.slow})`
  // );
  return output;
};

export const buy = async () => {
  // cancel all open buy orders
  await alpaca.cancelAllOrders();

  // get available buying power - if <$1, return
  const buyingPower = await getBuyingPower();

  // determine if we meet buy conditions
  if (await getShouldBuy()) {
    const order = await alpaca.createOrder({
      symbol: SYMBOL,
      // qty,
      notional: buyingPower,
      side: 'buy',
      type: 'market',
      time_in_force: 'day',
    });
    console.log('[info] buy', order);
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
