require('dotenv').config();
const get = require('lodash/get');
const alpaca = require('./alpaca');
const { getPosition } = require('./positions');
const { DEFAULT_BARS_OPTIONS } = require('./constants');

const waitForOrderFill = (order) =>
  new Promise((resolve, reject) => {
    const getBuyOrderInterval = setInterval(async () => {
      try {
        const buyOrder = await alpaca.getOrder(order.id);
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

const cancelAllOrders = async () => {
  await alpaca.cancelAllOrders();
};

const getOpenOrders = async (symbol = '') => {
  const orders = await alpaca.getOrders({
    status: 'open',
  });
  if (!symbol) {
    return orders;
  }
  return orders.filter((order) => order.symbol === symbol);
};

const cancelAllBuyOrders = async (symbol) => {
  console.log('cancelling all buy orders');
  const orders = await getOpenOrders();
  const buyOrders = orders.filter(
    (order) => order.side === 'buy' && order.symbol === symbol
  );
  const promises = buyOrders.map((order) => alpaca.cancelOrder(order.id));
  await Promise.all(promises);
};

const cancelAllSellOrders = async (symbol) => {
  console.log('cancelling all sell orders');
  const orders = await getOpenOrders();
  const buyOrders = orders.filter(
    (order) => order.side === 'sell' && order.symbol === symbol
  );
  const promises = buyOrders.map((order) => alpaca.cancelOrder(order.id));
  await Promise.all(promises);
};

const createStopLossOrder = async (symbol) => {
  const position = await getPosition(symbol);
  const averageEntryPrice = get(position, 'avg_entry_price', null);
  // console.log(position);
  if (!averageEntryPrice) {
    throw new Error(`undefined average_entry_price`);
  }
  const limitPrice = averageEntryPrice * 0.9975;
  const stopPrice = averageEntryPrice * 0.995;
  // console.log({ averageEntryPrice, limitPrice, stopPrice });
  const order = await alpaca.createOrder({
    symbol,
    qty: position.qty,
    side: 'sell',
    type: 'stop_limit',
    time_in_force: 'gtc',
    limit_price: limitPrice,
    stop_price: stopPrice,
  });
  return order;
};

const updateStopLossOrder = async (symbol) => {
  const openOrders = await getOpenOrders(symbol);
  const stopLossOrders = openOrders.filter(
    (order) => order.type === 'stop_limit'
  );
  const position = await getPosition(symbol);
  if (!position) return null;
  if (!stopLossOrders.length) {
    console.log('No stop limit orders to update, creating a new one');
    await createStopLossOrder(symbol);
    return null;
  }
  const [stopLossOrder] = stopLossOrders;
  const latestQuote = await alpaca.getLatestCryptoQuote(symbol, {
    exchange: DEFAULT_BARS_OPTIONS.exchanges,
  });
  const price = latestQuote.AskPrice;
  const averageEntryPrice = parseFloat(get(position, 'avg_entry_price', null));
  const newLimitPrice = price * 0.9975;
  const newStopPrice = price * 0.995;
  const currentStopPrice = parseFloat(stopLossOrder.stop_price);
  // console.log({ price, averageEntryPrice, currentStopPrice, newStopPrice });
  if (newStopPrice <= currentStopPrice) {
    console.log(`New stop prices is lower than current stop price`, {
      averageEntryPrice,
      newStopPrice,
      currentStopPrice,
    });
    return null;
  }
  if (
    newLimitPrice === stopLossOrder.limit_price ||
    newStopPrice === stopLossOrder.stop_price
  ) {
    console.log('Order parameters have not changed');
    return null;
  }
  // console.log(alpaca);
  const newStopLossOrder = alpaca.replaceOrder(stopLossOrder.id, {
    symbol,
    qty: position.qty,
    side: 'sell',
    type: 'stop_limit',
    time_in_force: 'gtc',
    limit_price: `${newLimitPrice}`,
    stop_price: `${newStopPrice}`,
  });
  console.log('updated stop loss order', newStopLossOrder);
  return newStopLossOrder;
};

exports.waitForOrderFill = waitForOrderFill;
exports.cancelAllOrders = cancelAllOrders;
exports.getOpenOrders = getOpenOrders;
exports.cancelAllBuyOrders = cancelAllBuyOrders;
exports.cancelAllSellOrders = cancelAllSellOrders;
exports.createStopLossOrder = createStopLossOrder;
exports.updateStopLossOrder = updateStopLossOrder;
