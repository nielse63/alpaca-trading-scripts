import { SYMBOL } from './constants';
import alpaca from './alpaca';
import { get as getAccount } from './account';
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
  const account = await getAccount();
  const { non_marginable_buying_power: buyingPower } = account;

  // true if sma_fast > sma_slow
  const { sma } = await getLastBar();
  return buyingPower > 1 && sma.fast > sma.slow;
};

export const buy = async () => {
  // cancel all open buy orders
  await alpaca.cancelAllOrders();

  // get available buying power - if <$1, return
  const account = await getAccount();
  const { non_marginable_buying_power: buyingPower } = account;

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
  return positions.length && sma.fast < sma.slow;
};

export const sell = async () => {
  if (await getShouldSell()) {
    await alpaca.cancelAllOrders();
    await alpaca.closePosition(SYMBOL);
  }
};
