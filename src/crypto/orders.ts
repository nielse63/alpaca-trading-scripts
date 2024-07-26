import alpaca from '../alpaca';
import { error as errorLogger, log } from '../helpers';
import { AlpacaQuoteObject } from './types.d';

export const getAllOrders = async () => {
  // @ts-ignore
  const orders = await alpaca.getOrders({
    status: 'open',
    nested: true,
  });
  return orders;
};

export const getOrdersForSymbol = async (symbol: string) => {
  // @ts-ignore
  const orders = await alpaca.getOrders({
    status: 'open',
    nested: true,
    symbols: symbol,
  });
  return orders;
};

export const getBuyOrdersForSymbol = async (symbol: string) => {
  const orders = await getOrdersForSymbol(symbol);
  return orders.filter((o: any) => o.side === 'buy');
};

export const getSellOrdersForSymbol = async (symbol: string) => {
  const orders = await getOrdersForSymbol(symbol);
  return orders.filter((o: any) => o.side === 'sell');
};

export const deleteOrdersForSymbol = async (symbol: string) => {
  const orders = await getOrdersForSymbol(symbol);
  if (!orders.length) {
    return;
  }
  const promises = orders.map((o: any) => alpaca.cancelOrder(o.id));
  try {
    log(`deleting ${promises.length} orders for ${symbol}`);
    await Promise.all(promises);
  } catch (error: any) {
    errorLogger('error deleting buy orders', error?.response?.data);
  }
};

export const deleteBuyOrdersForSymbol = async (symbol: string) => {
  const orders = await getBuyOrdersForSymbol(symbol);
  if (!orders.length) {
    return;
  }
  const promises = orders.map((o: any) => alpaca.cancelOrder(o.id));
  try {
    log(`deleting ${promises.length} buy orders for ${symbol}`);
    await Promise.all(promises);
  } catch (error: any) {
    errorLogger('error deleting buy orders', error?.response?.data);
  }
};

export const createStopLimitSellOrder = async (
  symbol: string,
  qty: number,
  price: number
) => {
  const stopLimitPrice = price * 0.985;
  log(`creating stop limit sell order for ${symbol} at ${stopLimitPrice}`);
  await alpaca.createOrder({
    symbol,
    qty,
    side: 'sell',
    type: 'stop_limit',
    time_in_force: 'gtc',
    limit_price: stopLimitPrice,
    stop_price: stopLimitPrice,
  });
};

export const updateStopLimitSellOrder = async (symbol: string) => {
  log(`checking for stop limit order update for ${symbol}`);
  const orders = await getSellOrdersForSymbol(symbol);
  const blacklistStatuses = [
    'accepted',
    'pending_new',
    'pending_cancel',
    'pending_replace',
  ];
  const stopLimitOrders = orders.filter(
    (o: any) => o.type === 'stop_limit' && !blacklistStatuses.includes(o.status)
  );
  if (!stopLimitOrders.length) {
    return;
  }
  const [stopLimitOrder] = stopLimitOrders;
  const oldStopLimitPrice = parseFloat(stopLimitOrder.limit_price);
  const quote: Map<string, AlpacaQuoteObject> =
    await alpaca.getLatestCryptoQuotes([symbol]);
  const { BidPrice: bidPrice } = quote.get(symbol) as AlpacaQuoteObject;
  const newStopLimitPrice = bidPrice * 0.99;
  if (newStopLimitPrice <= oldStopLimitPrice) {
    log(
      `no update needed for ${symbol}: ${newStopLimitPrice} <= ${oldStopLimitPrice}`
    );
    return;
  }
  log(
    `updating stop limit order for ${symbol} from ${oldStopLimitPrice} to ${newStopLimitPrice}`
  );
  try {
    await alpaca.replaceOrder(stopLimitOrder.id, {
      limit_price: newStopLimitPrice,
      stop_price: newStopLimitPrice,
    });
  } catch (error: any) {
    errorLogger('error updating stop limit order', error?.response?.data);
  }
};
