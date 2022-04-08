require('dotenv').config();
const Alpaca = require('@alpacahq/alpaca-trade-api');
const { SMA } = require('technicalindicators');
const sub = require('date-fns/sub');
const last = require('lodash/last');

const alpacaConfig = {
  keyId: process.env.APCA_API_KEY_ID,
  secretKey: process.env.APCA_API_SECRET_KEY,
  paper: process.env.APCA_API_BASE_URL === 'https://paper-api.alpaca.markets',
};
console.log({ alpacaConfig });
const alpaca = new Alpaca(alpacaConfig);

const getAccount = async () => {
  const account = await alpaca.getAccount();
  return account;
};

const getCash = async () => {
  const { cash } = await getAccount();
  return parseFloat(cash);
};

const getPosition = async (symbol) => {
  const positions = await alpaca.getPositions();
  return positions.filter((position) => position.symbol === symbol);
};

const getHasPostionForSymbol = async (symbol) => {
  const positions = await alpaca.getPositions();
  return !!positions.find((position) => position.symbol === symbol);
};

const DEFAULT_BARS_OPTIONS = {
  // limit: 600,
  exchanges: 'CBSE',
  start: sub(new Date(), {
    // years: 1,
    months: 3,
    // weeks: 1,
    // days: 7,
    // hours: 5,
    // minutes: 9,
    // seconds: 30
  }),
  end: new Date(),
  timeframe: '15Min',
};
const SMA_SLOW_VALUE = 21;
const SMA_FAST_VALUE = 7;

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
  const closeValues = bars.map(({ Close }) => Close);
  const smaFast = SMA.calculate({
    period: SMA_FAST_VALUE,
    values: closeValues,
  });
  const smaSlow = SMA.calculate({
    period: SMA_SLOW_VALUE,
    values: closeValues,
  });

  return {
    bars: bars.map((bar, index) => {
      const output = {
        ...bar,
        smaFast: null,
        smaSlow: null,
      };
      if (index - SMA_FAST_VALUE > -1) {
        output.smaFast = smaFast[index - SMA_FAST_VALUE];
      }
      if (index - SMA_SLOW_VALUE > -1) {
        output.smaSlow = smaFast[index - SMA_SLOW_VALUE];
      }
      return output;
    }),
    closeValues,
    smaFast,
    smaSlow,
  };
};

const buy = async (lastBar) => {
  const symbol = lastBar.Symbol;
  const latestQuote = await alpaca.getLatestCryptoQuote(symbol, {
    exchange: 'CBSE',
  });
  const price = latestQuote.AskPrice;
  const cash = await getCash();
  const qty = cash / price;
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
  console.log('order', order);
  return order;
};

const sell = async (symbol) => {
  const [position] = await getPosition(symbol);
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
  console.log('order', order);
  return order;
};

const getShouldBuy = async (lastBar) => lastBar.smaFast > lastBar.smaSlow;

const getShouldSell = async (lastBar) => {
  const hasPosition = await getHasPostionForSymbol(lastBar.Symbol);
  return hasPosition && lastBar.smaFast <= lastBar.smaSlow;
};

const main = async () => {
  const SYMBOL = 'BTCUSD';
  const account = await getAccount();
  if (account.crypto_status !== 'ACTIVE') {
    console.log('Unable to trade crypto - sorry');
    return;
  }

  // get data
  const data = await getData(SYMBOL);
  const lastBar = last(data.bars);

  // determine if we should buy or sell
  const shouldBuy = await getShouldBuy(lastBar);
  const shouldSell = await getShouldSell(lastBar);
  console.log({ lastBar, shouldBuy, shouldSell });

  // execute trade
  if (shouldBuy) {
    await buy(lastBar);
  } else if (shouldSell) {
    await sell(SYMBOL);
  }
};

(async () => {
  await main().catch(console.error);
})();
