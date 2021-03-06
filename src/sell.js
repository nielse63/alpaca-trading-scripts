require('dotenv').config();
const get = require('lodash/get');
const alpaca = require('./alpaca');
const { getPosition, hasPosition } = require('./positions');

const sell = async (symbol) => {
  const position = await getPosition(symbol);
  if (!position) {
    console.log('Position not found');
    return null;
  }
  const qty = parseFloat(position.qty);
  if (qty <= 0.0001) {
    console.log('sell: qty <= 0.0001', qty);
    return null;
  }
  const order = await alpaca.createOrder({
    symbol,
    qty,
    side: 'sell',
    type: 'market',
    time_in_force: 'ioc',
  });
  // console.log('order', order);
  return order;
};

const getShouldSell = async (lastBar) => {
  const exists = await hasPosition(lastBar.Symbol);
  if (!exists) return false;
  const trend = get(lastBar, 'Trend', { nb: false, down: false });
  return (trend.nb || trend.down) && lastBar.SMA.fast <= lastBar.SMA.slow;
};

exports.sell = sell;
exports.getShouldSell = getShouldSell;
