const sub = require('date-fns/sub');

const SYMBOL = 'BTCUSD';

const DEFAULT_BARS_OPTIONS = {
  // limit: 100,
  exchanges: 'FTXU',
  start: sub(new Date(), {
    // years: 1,
    // months: 1,
    weeks: 1,
    // days: 7,
    // hours: 5,
    // minutes: 9,
    // seconds: 30
  }),
  end: new Date(),
  timeframe: '1Hour',
};
const SMA_SLOW_VALUE = 25;
const SMA_FAST_VALUE = 10;
const RSI_INTERVAL = 14;
const PRICE_VALUE_KEY = 'Close';

module.exports = {
  SYMBOL,
  DEFAULT_BARS_OPTIONS,
  SMA_SLOW_VALUE,
  SMA_FAST_VALUE,
  RSI_INTERVAL,
  PRICE_VALUE_KEY,
};
