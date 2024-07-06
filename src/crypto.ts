import { format, subWeeks } from 'date-fns';
import fs from 'fs';
import path from 'path';
import { EMA, MACD, RSI } from 'technicalindicators';
import { getBuyingPower } from './account';
import alpaca from './alpaca';
import { log } from './helpers';
import { waitForOrderFill } from './order';

type AlpacaBarObject = {
  Close: number;
  High: number;
  Low: number;
  TradeCount: number;
  Open: number;
  Timestamp: string;
  Volume: number;
  VWAP: number;
};

type BarObject = {
  close: number;
  high: number;
  low: number;
  open: number;
  timestamp: string;
};

type BarObjectWithIndicators = BarObject & {
  ema9: number | null;
  ema21: number | null;
  macd: number | null | undefined;
  macdSignal: number | null | undefined;
  rsi: number | null;
};

type BarObjectWithSignals = BarObjectWithIndicators & {
  signal: number;
};

type PositionObject = {
  buyPrice: number;
  sellPrice: number;
  qty: number;
  profit: number;
  profitPerc: number;
  capital: number;
};

type BacktestOutput = {
  bars: BarObjectWithSignals[];
  positions: PositionObject[];
  profit: number;
  profitPerc: number;
  winRate: number;
};

const CRYPTO_SYMBOL = 'AVAX/USD';

async function fetchHistoricalData() {
  const end = format(new Date(), 'yyyy-MM-dd');
  // const start = format(subMonths(end, 1), 'yyyy-MM-dd');
  const start = format(subWeeks(end, 2), 'yyyy-MM-dd');
  const response: Map<string, any> = await alpaca.getCryptoBars(
    [CRYPTO_SYMBOL],
    {
      timeframe: '15Min',
      start,
      end,
      sort: 'desc',
    }
  );
  const data = response.get(CRYPTO_SYMBOL);
  const formattedData: BarObject[] = data.map((d: AlpacaBarObject) => ({
    close: d.Close,
    high: d.High,
    low: d.Low,
    open: d.Open,
    timestamp: d.Timestamp,
  }));
  return formattedData;
}

function calculateIndicators(data: BarObject[]): BarObjectWithIndicators[] {
  const closePrices = data.map((d: BarObject) => d.close);

  const ema9 = EMA.calculate({ period: 9, values: closePrices });
  const ema21 = EMA.calculate({ period: 21, values: closePrices });
  const macd = MACD.calculate({
    values: closePrices,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  const rsi = RSI.calculate({ period: 14, values: closePrices });

  return data
    .map((d: BarObject, i: number) => ({
      ...d,
      ema9: ema9[i] || null,
      ema21: ema21[i] || null,
      macd: macd[i] ? macd[i].MACD : null,
      macdSignal: macd[i] ? macd[i].signal : null,
      rsi: rsi[i] || null,
    }))
    .reverse();
}

function generateSignals(
  data: BarObjectWithIndicators[]
): BarObjectWithSignals[] {
  return data.map((d: BarObjectWithIndicators, i: number) => {
    if (i === 0 || !d.ema9 || !d.ema21 || !d.macd || !d.macdSignal || !d.rsi) {
      return { ...d, signal: 0 };
    }

    const prev = data[i - 1];
    let signal = 0;

    // buy signal
    if (
      d.ema9 > d.ema21 &&
      prev.ema9 !== null &&
      prev.ema21 !== null &&
      prev.ema9 <= prev.ema21 &&
      d.macd > d.macdSignal &&
      d.rsi < 70
    ) {
      signal = 1;

      // sell signal
    } else if (
      d.ema9 < d.ema21 &&
      prev.ema9 !== null &&
      prev.ema21 !== null &&
      prev.ema9 >= prev.ema21 &&
      d.macd < d.macdSignal &&
      d.rsi > 30 &&
      d.rsi < 70
    ) {
      signal = -1;
    }

    return { ...d, signal };
  });
}

async function backtest(data: BarObjectWithSignals[]) {
  let position = 0; // 0: no position, 1+: long, -1-: short
  // const initialCapital = await getBuyingPower();
  const initialCapital = 10000;
  let capital = initialCapital;
  let buyPrice = 0;
  const positions: PositionObject[] = [];
  const defaultPositionObject: PositionObject = Object.freeze({
    buyPrice: 0,
    sellPrice: 0,
    qty: 0,
    profit: 0,
    profitPerc: 0,
    capital: 0,
  });
  let positionObject = {
    ...defaultPositionObject,
  };
  let wins = 0;
  let losses = 0;
  const output: BacktestOutput = {
    bars: [],
    positions: [],
    profit: 0,
    profitPerc: 0,
    winRate: 0,
  };

  data.forEach((d: BarObjectWithSignals) => {
    // calc stop loss
    output.bars.push(d);

    // buy signal
    if (d.signal === 1 && position === 0) {
      const qty = parseFloat((capital / d.close).toFixed(0));
      positionObject = {
        ...positionObject,
        buyPrice: d.close,
        qty,
      };
      position = qty;
      buyPrice = d.close;
      positions.push(positionObject);

      // sell signal
    } else if (position > 1 && d.signal === -1) {
      const profit = parseFloat((position * (d.close - buyPrice)).toFixed(2));
      const profitPerc = parseFloat(
        (((d.close - buyPrice) / buyPrice) * 100).toFixed(2)
      );
      capital += profit; // Update capital based on trade
      position = 0;
      const lastPositionIndex = positions.length - 1;
      const lastPosition = positions[lastPositionIndex];
      positionObject = {
        ...lastPosition,
        sellPrice: d.close,
        profit,
        profitPerc,
        capital,
      };
      positions[lastPositionIndex] = positionObject;
      output.profit += profit;
      if (profit > 0) {
        wins++;
      } else {
        losses++;
      }
      positionObject = { ...defaultPositionObject };
    }

    // return { ...d, capital };
  });

  return {
    ...output,
    positions,
    profitPerc: parseFloat(((output.profit / initialCapital) * 100).toFixed(2)),
    winRate: parseFloat(((wins / (wins + losses)) * 100).toFixed(2)),
  };
}

async function placeOrder(data: BarObjectWithSignals[]) {
  log('placing order');
  const capital = await getBuyingPower();
  log(`current capital: ${capital}`);
  const lastBar = data[data.length - 1];
  log(`last bar: ${JSON.stringify(lastBar, null, 2)}`);
  // buy signal
  if (lastBar.signal === 1) {
    const qty = parseFloat((capital / lastBar.close).toFixed(0));
    log(`Placing buy order for ${qty} shares of ${CRYPTO_SYMBOL}`);
    if (qty > 0) {
      const buyOrder = await alpaca.createOrder({
        symbol: CRYPTO_SYMBOL,
        qty: qty,
        side: 'buy',
        type: 'market',
        time_in_force: 'day',
      });
      await waitForOrderFill(buyOrder.id);
      log(`buy order placed: ${JSON.stringify(buyOrder, null, 2)}`);
      const tslOrder = await alpaca.createOrder({
        symbol: CRYPTO_SYMBOL,
        qty: buyOrder.qty,
        side: 'sell',
        type: 'trailing_stop',
        trail_percent: 5,
        time_in_force: 'gtc',
      });
      log(
        `trailing stop loss order placed: ${JSON.stringify(tslOrder, null, 2)}`
      );
    }
  } else if (lastBar.signal === -1) {
    log('should sell');
    const positions = await alpaca.getPosition(CRYPTO_SYMBOL);
    log(`open positions: ${JSON.stringify(positions, null, 2)}`);
    if (positions) {
      log('cancelling all open orders');
      await alpaca.cancelAllOrders();
      log('closing all posiitons');
      await alpaca.closePosition(CRYPTO_SYMBOL);
    }
  }
}

const crypto = async () => {
  const data = await fetchHistoricalData();
  const dataWithIndicators = calculateIndicators(data);
  // console.log(dataWithIndicators);
  const dataWithSignals = generateSignals(dataWithIndicators);
  const results = await backtest(dataWithSignals);
  log(
    `results of backtest: ${JSON.stringify(
      {
        winRate: results.winRate,
        profit: parseFloat(results.profit.toFixed(2)),
        profitPerc: parseFloat(results.profitPerc.toFixed(2)),
      },
      null,
      2
    )}`
  );
  const filepath = path.resolve(__dirname, '../backtest.json');
  fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
  try {
    await placeOrder(dataWithSignals);
  } catch (error) {
    log(`Error placing order: ${error}`);
  }
};

// crypto().catch(console.error);

export default crypto;
