import alpaca from '../alpaca';
import { error as errorLogger, log, toDecimal } from '../helpers';
import { AlpacaOrder } from '../types.d';
import { STOP_LIMIT_PERCENT } from './constants';
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

export const deleteSellOrdersForSymbol = async (symbol: string) => {
  const orders = await getSellOrdersForSymbol(symbol);
  if (!orders.length) {
    return;
  }
  const promises = orders.map((o: any) => alpaca.cancelOrder(o.id));
  try {
    log(`deleting ${promises.length} sell orders for ${symbol}`);
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
  const decimalPoints = price >= 1 ? 2 : 4;
  const stopPrice = toDecimal(price, decimalPoints);
  log(`creating stop limit sell order for ${symbol} at ${stopPrice}`);
  await alpaca.createOrder({
    side: 'sell',
    type: 'stop_limit',
    time_in_force: 'gtc',
    symbol,
    qty,
    stop_price: stopPrice,
    limit_price: stopPrice,
    position_intent: 'sell_to_close',
  });
};

export const updateSingleStopLimitSellOrder = async (order: AlpacaOrder) => {
  const { symbol, limit_price: limitPrice } = order;
  const oldStopLimitPrice = parseFloat(limitPrice);
  const quote: Map<string, AlpacaQuoteObject> =
    await alpaca.getLatestCryptoQuotes([symbol]);
  const { BidPrice: bidPrice } = quote.get(symbol) as AlpacaQuoteObject;
  const newStopLimitPrice = bidPrice * STOP_LIMIT_PERCENT;
  if (newStopLimitPrice <= oldStopLimitPrice) {
    log(
      `no update needed for ${symbol}: ${newStopLimitPrice} <= ${oldStopLimitPrice}`
    );
    return;
  }
  let qty;
  try {
    const position = await alpaca.getPosition(symbol.replace('/', ''));
    qty = parseFloat(position.qty);
  } catch (error: any) {
    errorLogger(
      `error getting position for ${symbol} (updateSingleStopLimitSellOrder)`,
      error?.response?.data
    );
  }
  log(
    `updating stop limit order for ${symbol} from ${oldStopLimitPrice} to ${newStopLimitPrice}`
  );
  try {
    await alpaca.replaceOrder(order.id, {
      qty,
      limit_price: newStopLimitPrice,
      stop_price: newStopLimitPrice,
    });
  } catch (error: any) {
    errorLogger('error updating stop limit order', error?.response?.data);
  }
};

export const updateStopLimitSellOrder = async (symbol: string) => {
  log(`checking for stop limit order update for ${symbol}`);
  let orders = [];
  try {
    orders = await getSellOrdersForSymbol(symbol);
  } catch (error: any) {
    errorLogger(
      `error getting sell orders for ${symbol}`,
      error?.response?.data
    );
    return;
  }
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
    let position;
    try {
      position = await alpaca.getPosition(symbol.replace('/', ''));
    } catch (error: any) {
      errorLogger(
        `error getting position for ${symbol}`,
        error?.response?.data
      );
      return;
    }
    await createStopLimitSellOrder(
      symbol,
      parseFloat(position.qty),
      parseFloat(position.avg_entry_price) * STOP_LIMIT_PERCENT
    );
    return;
  }
  const promises = stopLimitOrders.map(updateSingleStopLimitSellOrder);
  await Promise.all(promises);
};
