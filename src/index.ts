import Alpaca from '@alpacahq/alpaca-trade-api';
import * as dotenv from 'dotenv';
import findLastIndex from 'lodash/findLastIndex';
import moment from 'moment';
import { SMA } from 'trading-signals';
import {
  AlpacaQuote,
  AlpacaTrade,
  AlpacaBar,
  IDateObject,
  AlpacaAccount,
  BarSMA,
  IBar,
  AlpacaOrder,
  ICacheObject,
} from './types.d';
// import MockQuote from './__fixtures__/quote';
dotenv.config();

const SYMBOL = 'MSFT';
const SMA_FAST_INTERVAL = 7;
const SMA_SLOW_INTERVAL = 14;
const LOOKBACK_LIMIT = 50;
const TRAIL_STOP_LOSS_PERCENT = 5.0;
const alpaca = new Alpaca({
  keyId: process.env.ALPACA_KEY,
  secretKey: process.env.ALPACA_SECRET,
  paper: true,
});
const cache: ICacheObject = {
  account: {
    id: '',
    account_number: '',
    status: '',
    crypto_status: '',
    currency: '',
    buying_power: 0,
    regt_buying_power: 0,
    daytrading_buying_power: 0,
    effective_buying_power: 0,
    non_marginable_buying_power: 0,
    bod_dtbp: 0,
    cash: 0,
    accrued_fees: 0,
    pending_transfer_in: 0,
    portfolio_value: 0,
    pattern_day_trader: false,
    trading_blocked: false,
    transfers_blocked: false,
    account_blocked: false,
    created_at: '',
    trade_suspended_by_user: false,
    multiplier: 0,
    shorting_enabled: false,
    equity: 0,
    last_equity: 0,
    long_market_value: 0,
    short_market_value: 0,
    position_market_value: 0,
    initial_margin: 0,
    maintenance_margin: 0,
    last_maintenance_margin: 0,
    sma: 0,
    daytrade_count: 0,
    balance_asof: '',
    crypto_tier: 0,
  },
  bars: [],
};
const ACCOUNT_NUMERIC_KEYS = [
  'buying_power',
  'regt_buying_power',
  'daytrading_buying_power',
  'effective_buying_power',
  'non_marginable_buying_power',
  'bod_dtbp',
  'cash',
  'accrued_fees',
  'pending_transfer_in',
  'portfolio_value',
  'multiplier',
  'equity',
  'last_equity',
  'long_market_value',
  'short_market_value',
  'position_market_value',
  'initial_margin',
  'maintenance_margin',
  'last_maintenance_margin',
  'sma',
];

const getIsMarketOpen = async () => {
  if (!('isMarketOpen' in cache)) {
    const clock = await alpaca.getClock();
    cache.isMarketOpen = clock.is_open;
  }
  return cache.isMarketOpen;
};

const getAccount = async () => {
  if (!cache.account.id) {
    const response = await alpaca.getAccount();
    const account = Object.entries(response).reduce(
      (previousValue, [key, value]) => {
        const newValue =
          ACCOUNT_NUMERIC_KEYS.includes(key) && typeof value === 'string'
            ? parseFloat(value)
            : value;
        return {
          ...previousValue,
          [key]: newValue,
        };
      },
      { ...cache.account }
    );
    cache.account = account;
  }
  return cache.account;
};

const getTradingDates = async () => {
  const tradingDays = await alpaca.getCalendar();
  const clock = await alpaca.getClock();
  const i = findLastIndex(
    tradingDays,
    (d: IDateObject) => d.date <= moment(clock).format('YYYY-MM-DD')
  );
  return tradingDays.slice(i - LOOKBACK_LIMIT, i);
};

const getBars = async () => {
  if (cache.bars && cache.bars.length) {
    return cache.bars;
  }

  const pastTradingDays = await getTradingDates();
  const bars = alpaca.getBarsV2(SYMBOL, {
    start: pastTradingDays.shift().date,
    end: pastTradingDays.pop().date,
    timeframe: '1Day',
  });

  const smaFast = new SMA(SMA_FAST_INTERVAL);
  const smaSlow = new SMA(SMA_SLOW_INTERVAL);
  const barsData: AlpacaBar[] = [];
  for await (const bar of bars) {
    barsData.push(bar);
  }
  const latestBar = await alpaca.getLatestBar(SYMBOL);
  barsData.push(latestBar);
  cache.bars = barsData.map((b, i) => {
    const bar = {
      ...b,
      sma: {
        fast: 0,
        slow: 0,
      },
    };
    smaFast.update(bar.ClosePrice);
    smaSlow.update(bar.ClosePrice);
    if (i >= SMA_FAST_INTERVAL) {
      bar.sma.fast = parseFloat(smaFast.getResult().valueOf());
    }
    if (i >= SMA_SLOW_INTERVAL) {
      bar.sma.slow = parseFloat(smaSlow.getResult().valueOf());
    }
    return bar;
  });
  return cache.bars;
};

const getLastBar = async () => {
  const bars = await getBars();
  return (
    bars.pop() || {
      ClosePrice: 0,
      sma: {
        fast: 0,
        slow: 0,
      },
    }
  );
};

const cancelBuyOrders = async () => {
  // @ts-ignore
  const orders: AlpacaOrder[] = await alpaca.getOrders({
    status: 'open',
  });
  const buyOrders = orders.filter(({ side }) => {
    return side === 'buy';
  });
  const promises = buyOrders.map(({ id }) => {
    return alpaca.cancelOrder(id);
  });
  await Promise.all(promises);
};

const waitForOrderFill = (orderId: string) =>
  new Promise((resolve, reject) => {
    const getBuyOrderInterval = setInterval(async () => {
      try {
        const buyOrder = await alpaca.getOrder(orderId);
        if (buyOrder.status === 'filled') {
          clearInterval(getBuyOrderInterval);
          resolve(buyOrder);
        }
      } catch (error) {
        clearInterval(getBuyOrderInterval);
        reject(error);
      }
    }, 1000);
  });

const buy = async () => {
  // cancel all open buy orders
  await cancelBuyOrders();

  // get available buying power - if <$1, return
  const account = await getAccount();
  const { non_marginable_buying_power: buyingPower } = account;
  if (buyingPower < 1) {
    console.warn('buying power < $1');
    return;
  }

  // calculate number of shares we can purchase - return if too low
  // const isMarketOpen = await getIsMarketOpen();
  // for dev only
  // const quote = isMarketOpen ? await alpaca.getLatestQuote(SYMBOL) : MockQuote;
  // const { AskPrice: lastPrice } = quote;
  // for prod
  // const { AskPrice: lastPrice } = await alpaca.getLatestQuote(SYMBOL);
  // const qty = buyingPower / lastPrice;
  // if (qty <= 0.0001) {
  //   console.warn(`too low a qty to buy: ${qty}`);
  //   return;
  // }

  // determine if we meet buy conditions
  const lastBar = await getLastBar();
  const { ClosePrice, sma } = lastBar;
  if (ClosePrice < sma.fast || sma.fast < sma.slow) {
    console.warn(
      `does not mean condition to buy: {price: ${ClosePrice}, sma_fast: ${sma.fast}, sma_slow: ${sma.slow}}`
    );
    return;
  }

  // all conditions are satisfied, create buy order
  const order = await alpaca.createOrder({
    symbol: SYMBOL,
    // qty,
    notional: buyingPower,
    side: 'buy',
    type: 'market',
    time_in_force: 'day',
  });
  console.log({ order });

  // wait until the order is filled
  await waitForOrderFill(order.id);

  // create a trailing stop loss order
  const tslOrder = alpaca.createOrder({
    symbol: SYMBOL,
    qty: order.qty,
    side: 'sell',
    type: 'trailing_stop',
    trail_percent: TRAIL_STOP_LOSS_PERCENT, // stop price will be hwm * (1 - TRAIL_STOP_LOSS_PERCENT)
    time_in_force: 'gtc',
  });
  console.log({ tslOrder });
};

const sell = async () => {
  const lastBar = await getLastBar();
  const { ClosePrice, sma } = lastBar;
  if (ClosePrice < sma.fast) {
    await alpaca.closePosition(SYMBOL);
  }
};

const main = async () => {
  // // make sure the market is open
  // const isMarketOpen = await getIsMarketOpen();
  // if (!isMarketOpen) {
  //   console.warn('market is not open - exiting');
  //   return;
  // }

  // get account data
  const account = await getAccount();
  // console.log(account);
  const { status } = account;
  if (status !== 'ACTIVE') {
    console.error('account is not active - exiting');
    return;
  }

  // get positions
  const positions = await alpaca.getPosition(SYMBOL);
  // console.log(positions);

  // execute trades if conditions are met
  if (positions.length) {
    await sell();
  } else {
    await buy();
  }
};

main()
  .then(() => {
    console.log('done');
  })
  .catch(console.error);

export default main;

export {
  AlpacaQuote,
  AlpacaTrade,
  AlpacaBar,
  IDateObject,
  AlpacaAccount,
  BarSMA,
  IBar,
  AlpacaOrder,
  ICacheObject,
};
