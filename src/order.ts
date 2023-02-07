import { SYMBOL } from './constants';
import alpaca from './alpaca';
import { getBuyingPower } from './account';
import { getLastBar } from './bars';
import { getPositions } from './position';
// import MockQuote from './__fixtures__/quote';

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
  const buyingPower = await getBuyingPower();

  // true if sma_fast > sma_slow
  const { sma } = await getLastBar();
  const output = buyingPower > 1 && sma.fast > sma.slow;
  console.log(
    `should buy: ${output} (buyingPower = ${buyingPower}; sma.fast = ${sma.fast}; sma.slow = ${sma.slow})`
  );
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
    console.log({ order });
  }
};

export const getShouldSell = async () => {
  const positions = await getPositions();
  const { sma } = await getLastBar();
  const output = positions.length && sma.fast < sma.slow;
  console.log(
    `should sell: ${output} (positions.length = ${positions.length}; sma.fast = ${sma.fast}; sma.slow = ${sma.slow})`
  );
  return output;
};

export const sell = async () => {
  if (await getShouldSell()) {
    await alpaca.cancelAllOrders();
    await alpaca.closePosition(SYMBOL);
  }
};
