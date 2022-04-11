require('dotenv').config();
const { SMA, EMA, RSI, ADX } = require('trading-signals');
const get = require('lodash/get');
const alpaca = require('./alpaca');
const {
  SYMBOL,
  DEFAULT_BARS_OPTIONS,
  SMA_FAST_VALUE,
  SMA_SLOW_VALUE,
  PRICE_VALUE_KEY,
  RSI_INTERVAL,
} = require('./constants');

// global vars
let smaFast;
let smaSlow;
let emaFast;
let emaSlow;
let rsiValue;
let rsiMA;
const highestArray = [];
let highMA;
const lowestArray = [];
let lowMA;
let adx;
let adxMA;

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

const getEMA = (bar) => {
  let fast = null;
  let slow = null;
  emaFast.update(get(bar, PRICE_VALUE_KEY, null));
  emaSlow.update(get(bar, PRICE_VALUE_KEY, null));
  try {
    fast = parseFloat(emaFast.getResult().valueOf());
  } catch (error) {}
  try {
    slow = parseFloat(emaSlow.getResult().valueOf());
  } catch (error) {}

  return { fast, slow };
};

const getRSI = (bar) => {
  let value = null;
  let ma = null;
  rsiValue.update(get(bar, PRICE_VALUE_KEY, null));
  try {
    value = parseFloat(rsiValue.getResult().valueOf());
  } catch (error) {}

  if (value) {
    rsiMA.update(value);
    try {
      ma = parseFloat(rsiMA.getResult().valueOf());
    } catch (error) {}
  }

  return { value, ma };
};

const getTrend = (bar) => {
  const hash = {
    sma: false,
    high: false,
    low: false,
    adx: false,
    rsi: false,
  };

  const { prices } = smaSlow;
  hash.sma =
    prices.length < 4
      ? false
      : get(prices, '[0]', 0) + get(prices, '[1]', 0) >
        get(prices, '[2]', 0) + get(prices, '[3]', 0);

  // highest
  const high = get(bar, 'High', null);
  highestArray.push(high);
  const highest = Math.max(...highestArray.slice(-21));

  highMA.update(highest);
  hash.high =
    highMA.prices.length < 2
      ? false
      : get(highMA.prices, '[0]', 0) > get(highMA.prices, '[1]', 0);

  // lowest
  const low = get(bar, 'Low', null);
  lowestArray.push(low);
  const lowest = Math.max(...lowestArray.slice(-21));

  lowMA.update(lowest);
  hash.low =
    lowMA.prices.length < 2
      ? false
      : get(lowMA.prices, '[0]', 0) > get(lowMA.prices, '[1]', 0);

  // dmi
  adx.update({
    high: bar.High,
    low: bar.Low,
    close: bar.Close,
  });
  if (adx.pdi) {
    adxMA.update(parseFloat(adx.pdi));
    hash.adx =
      adxMA.prices.length < 4
        ? false
        : get(adxMA.prices, '[0]', 0) + get(adxMA.prices, '[1]', 0) >
          get(adxMA.prices, '[2]', 0) + get(adxMA.prices, '[3]', 0);
  }

  // rsi
  try {
    hash.rsi = rsiValue.getResult().valueOf() > 50;
  } catch (error) {}

  // string value
  const up = (hash.low || hash.high) && hash.sma && hash.adx && hash.rsi;
  const na = !up && (hash.low || hash.sma) && (hash.adx || hash.rsi);
  const nb = !up && !na && (hash.low || hash.sma || hash.adx || hash.rsi);
  const down = !up && !na && !nb;
  return {
    up,
    na,
    nb,
    down,
  };
};

const getBars = async (options = {}) => {
  const response = await alpaca.getCryptoBars(SYMBOL, {
    ...DEFAULT_BARS_OPTIONS,
    ...options,
  });
  const bars = [];
  let index = 0;
  smaFast = new SMA(SMA_FAST_VALUE);
  smaSlow = new SMA(SMA_SLOW_VALUE);
  emaFast = new EMA(SMA_FAST_VALUE);
  emaSlow = new EMA(SMA_SLOW_VALUE);
  rsiValue = new RSI(RSI_INTERVAL, SMA);
  rsiMA = new SMA(Math.min(RSI_INTERVAL / 2));
  highMA = new SMA(SMA_SLOW_VALUE);
  lowMA = new SMA(SMA_SLOW_VALUE);
  adx = new ADX(4, SMA);
  adxMA = new SMA(SMA_SLOW_VALUE);

  // eslint-disable-next-line no-restricted-syntax
  for await (const object of response) {
    const bar = formatBar(object);

    bars.push({
      Index: index,
      ...bar,
      SMA: getSMA(bar),
      EMA: getEMA(bar),
      RSI: getRSI(bar),
      Trend: getTrend(bar),
    });
    index += 1;
  }
  return bars;
};

module.exports = getBars;
