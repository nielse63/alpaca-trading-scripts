require('dotenv').config();
const { SMA } = require('trading-signals');
const get = require('lodash/get');
const alpaca = require('./alpaca');
const {
  SYMBOL,
  DEFAULT_BARS_OPTIONS,
  SMA_FAST_VALUE,
  SMA_SLOW_VALUE,
  PRICE_VALUE_KEY,
} = require('./constants');

// global vars
let smaFast;
let smaSlow;

const formatBar = (bar) => ({
  ...bar,
  Timestamp: new Date(bar.Timestamp),
});

const getSMA = (bar) => {
  let fast = null;
  let slow = null;
  smaFast.update(get(bar, PRICE_VALUE_KEY, null));
  smaSlow.update(get(bar, PRICE_VALUE_KEY, null));
  try {
    fast = parseFloat(smaFast.getResult().valueOf());
  } catch (error) {}
  try {
    slow = parseFloat(smaSlow.getResult().valueOf());
  } catch (error) {}

  return { fast, slow };
};

const getBars = async () => {
  const response = await alpaca.getCryptoBars(SYMBOL, DEFAULT_BARS_OPTIONS);
  const bars = [];
  smaFast = new SMA(SMA_FAST_VALUE);
  smaSlow = new SMA(SMA_SLOW_VALUE);
  // eslint-disable-next-line no-restricted-syntax
  for await (const object of response) {
    const bar = formatBar(object);

    bars.push({
      ...bar,
      SMA: getSMA(bar),
    });
  }
  return bars;
};

module.exports = getBars;
