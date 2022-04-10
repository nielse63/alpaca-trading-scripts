require('dotenv').config();
const { SMA } = require('technicalindicators');
const reverse = require('lodash/reverse');
const get = require('lodash/get');
const alpaca = require('./alpaca');
const {
  DEFAULT_BARS_OPTIONS,
  SMA_SLOW_VALUE,
  SMA_FAST_VALUE,
} = require('./constants');

const formatBar = (bar) => ({
  ...bar,
  Timestamp: new Date(bar.Timestamp),
});

const getCryptoBars = async (symbol, options = {}) => {
  const response = await alpaca.getCryptoBars(symbol, {
    ...DEFAULT_BARS_OPTIONS,
    ...options,
  });
  const bars = [];
  // eslint-disable-next-line no-restricted-syntax
  for await (const bar of response) {
    bars.push(formatBar(bar));
  }
  return bars;
};

const getData = async (symbol, options = {}) => {
  const bars = await getCryptoBars(symbol, options);
  const values = bars.map(({ Close }) => Close);
  const smaFast = SMA.calculate({
    period: SMA_FAST_VALUE,
    values,
  });
  const smaSlow = SMA.calculate({
    period: SMA_SLOW_VALUE,
    values,
  });
  const reversed = {
    smaFast: reverse(smaFast),
    smaSlow: reverse(smaSlow),
    bars: reverse(bars),
  };
  const reversedBarsWithSMA = reversed.bars.map((bar, index) => {
    const output = {
      ...bar,
      smaFast: get(reversed, `smaFast[${index}]`, null),
      smaSlow: get(reversed, `smaSlow[${index}]`, null),
    };
    return output;
  });

  return {
    bars: reverse(reversedBarsWithSMA),
    values,
    smaFast,
    smaSlow,
  };
};

exports.formatBar = formatBar;
exports.getCryptoBars = getCryptoBars;
exports.getData = getData;
