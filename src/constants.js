const sub = require('date-fns/sub');

const DEFAULT_BARS_OPTIONS = {
  // limit: 600,
  exchanges: 'FTXU',
  start: sub(new Date(), {
    // years: 1,
    // months: 1,
    weeks: 3,
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

module.exports = {
  DEFAULT_BARS_OPTIONS,
  SMA_SLOW_VALUE,
  SMA_FAST_VALUE,
};
