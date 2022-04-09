require('dotenv').config();
const { SMA } = require('technicalindicators');
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

/**
 *
 * @param {string} symbol
 * @param {object} options
 * @returns {object[]}
 * @example
 * {
 *    Symbol: 'BTCUSD',
 *    Timestamp: 2022-04-08T09:00:00.000Z,
 *    Exchange: 'FTXU',
 *    Open: 43726,
 *    High: 43750,
 *    Low: 43680,
 *    Close: 43680,
 *    Volume: 0.2175,
 *    TradeCount: 6,
 *    VWAP: 43682.72092
 *  }
 */
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
  const vwapValues = bars.map(({ VWAP }) => VWAP);
  const smaFast = SMA.calculate({
    period: SMA_FAST_VALUE,
    values: vwapValues,
  });
  const smaSlow = SMA.calculate({
    period: SMA_SLOW_VALUE,
    values: vwapValues,
  });

  return {
    bars: bars.map((bar, index) => {
      const output = {
        ...bar,
        smaFast: null,
        smaSlow: null,
      };
      const smaFastIndex = index - SMA_FAST_VALUE + 1;
      const smaSlowIndex = index - SMA_SLOW_VALUE + 1;
      if (smaFastIndex > -1) {
        output.smaFast = smaFast[smaFastIndex];
      }
      if (smaSlowIndex > -1) {
        output.smaSlow = smaFast[smaSlowIndex];
      }
      return output;
    }),
    vwapValues,
    smaFast,
    smaSlow,
  };
};

exports.formatBar = formatBar;
exports.getCryptoBars = getCryptoBars;
exports.getData = getData;
