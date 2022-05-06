require('dotenv').config();
const get = require('lodash/get');
const alpaca = require('./alpaca');
const { getCash } = require('./account');
const {
  waitForOrderFill,
  cancelAllBuyOrders,
  cancelAllSellOrders,
  createStopLossOrder,
} = require('./order');
const { DEFAULT_BARS_OPTIONS } = require('./constants');

const buy = async (symbol) => {
  await cancelAllBuyOrders(symbol);
  const latestQuote = await alpaca.getLatestCryptoQuote(symbol, {
    exchange: DEFAULT_BARS_OPTIONS.exchanges,
  });
  const price = latestQuote.AskPrice;
  const cash = await getCash();
  const qty = cash / price;
  // console.log({ latestQuote, price, cash, qty });
  if (qty <= 0.0001) {
    console.log('Not enough buying power for purchase');
    return null;
  }
  const order = await alpaca.createOrder({
    symbol,
    // notional: cash,
    qty,
    side: 'buy',
    type: 'market',
    time_in_force: 'ioc',
  });
  const filledOrder = await waitForOrderFill(order);
  await cancelAllSellOrders(symbol);
  await createStopLossOrder(symbol);
  // console.log('order', order);
  return filledOrder;
};

const getShouldBuy = async (lastBar) => {
  const sma = get(lastBar, 'SMA', { fast: 0, slow: 0 });
  const trend = get(lastBar, 'Trend', { up: false });
  return trend.up && sma.fast > sma.slow;
};

exports.buy = buy;
exports.getShouldBuy = getShouldBuy;
