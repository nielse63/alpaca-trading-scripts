import { AlpacaOrder } from './types.d';
import { SYMBOL, TRAIL_STOP_LOSS_PERCENT } from './constants';
import alpaca from './alpaca';
import { get as getAccount } from './account';
import { getLastBar } from './bars';
// import MockQuote from './__fixtures__/quote';

export const cancelBuyOrders = async () => {
  // @ts-ignore
  const orders: AlpacaOrder[] = await alpaca.getOrders({
    status: 'open',
  });
  const buyOrders = orders.filter(({ side }) => {
    return side === 'buy';
  });
  const promises = buyOrders.map(({ id }) => {
    return alpaca.cancelOrder(id);
  });
  await Promise.all(promises);
};

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

export const buy = async () => {
  // cancel all open buy orders
  await cancelBuyOrders();

  // get available buying power - if <$1, return
  const account = await getAccount();
  const { non_marginable_buying_power: buyingPower } = account;
  if (buyingPower < 1) {
    console.warn('buying power < $1');
    return;
  }

  // calculate number of shares we can purchase - return if too low
  // const isMarketOpen = await getIsMarketOpen();
  // for dev only
  // const quote = isMarketOpen ? await alpaca.getLatestQuote(SYMBOL) : MockQuote;
  // const { AskPrice: lastPrice } = quote;
  // for prod
  // const { AskPrice: lastPrice } = await alpaca.getLatestQuote(SYMBOL);
  // const qty = buyingPower / lastPrice;
  // if (qty <= 0.0001) {
  //   console.warn(`too low a qty to buy: ${qty}`);
  //   return;
  // }

  // determine if we meet buy conditions
  const lastBar = await getLastBar();
  const { ClosePrice, sma } = lastBar;
  if (ClosePrice < sma.fast || sma.fast < sma.slow) {
    console.warn(
      `does not mean condition to buy: {price: ${ClosePrice}, sma_fast: ${sma.fast}, sma_slow: ${sma.slow}}`
    );
    return;
  }

  // all conditions are satisfied, create buy order
  const order = await alpaca.createOrder({
    symbol: SYMBOL,
    // qty,
    notional: buyingPower,
    side: 'buy',
    type: 'market',
    time_in_force: 'day',
  });
  console.log({ order });

  // wait until the order is filled
  await waitForOrderFill(order.id);

  // create a trailing stop loss order
  const tslOrder = alpaca.createOrder({
    symbol: SYMBOL,
    qty: order.qty,
    side: 'sell',
    type: 'trailing_stop',
    trail_percent: TRAIL_STOP_LOSS_PERCENT, // stop price will be hwm * (1 - TRAIL_STOP_LOSS_PERCENT)
    time_in_force: 'gtc',
  });
  console.log({ tslOrder });
};

export const sell = async () => {
  const lastBar = await getLastBar();
  const { ClosePrice, sma } = lastBar;
  if (ClosePrice < sma.fast) {
    await alpaca.closePosition(SYMBOL);
  }
};
