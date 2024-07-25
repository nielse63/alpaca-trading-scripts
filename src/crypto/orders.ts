import alpaca from '../alpaca';
import { error as errorLogger, log } from '../helpers';

export const getAllOrders = async () => {
  // @ts-ignore
  const orders = await alpaca.getOrders({
    status: 'open',
    // until: new Date().toISOString(),
    // after: new Date(new Date().getTime() - 1000 * 60 * 60 * 24).toISOString(),
    // direction: 'desc',
    nested: true,
    // symbols: [],
    // limit: 100,
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
