require('dotenv').config();
const alpaca = require('./alpaca');
const { getCash } = require('./account');
const { DEFAULT_BARS_OPTIONS } = require('./constants');

const buy = async (symbol) => {
  const latestQuote = await alpaca.getLatestCryptoQuote(symbol, {
    exchange: DEFAULT_BARS_OPTIONS.exchanges,
  });
  const price = latestQuote.AskPrice;
  const cash = await getCash();
  const qty = cash / price;
  console.log({ latestQuote, price, cash, qty });
  if (qty <= 0.0001) {
    console.log('Not enough buying power for purchase');
    return null;
  }
  const order = await alpaca.createOrder({
    symbol,
    notional: cash,
    side: 'buy',
    type: 'market',
    time_in_force: 'ioc',
  });
  // console.log('order', order);
  return order;
};

const getShouldBuy = (lastBar) =>
  lastBar.VWAP > lastBar.smaFast && lastBar.smaFast > lastBar.smaSlow;

exports.buy = buy;
exports.getShouldBuy = getShouldBuy;
