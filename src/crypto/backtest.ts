// import fs from 'fs';
// import path from 'path';
// import { log } from '../helpers';
import {
  calculateIndicators,
  CRYPTO_UNIVERSE,
  fetchHistoricalData,
  generateSignals,
} from './helpers';

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
  });

  return {
    ...output,
    positions,
    initialCapital,
    profitPerc: parseFloat(((output.profit / initialCapital) * 100).toFixed(2)),
    winRate: parseFloat(((wins / (wins + losses)) * 100).toFixed(2)),
  };
}

const backtestForSymbol = async (symbol: string) => {
  const data = await fetchHistoricalData(symbol);
  const dataWithIndicators = calculateIndicators(data);
  const dataWithSignals = generateSignals(dataWithIndicators);
  const results = await backtest(dataWithSignals);
  const output = {
    initialCapital: results.initialCapital,
    winRate: results.winRate,
    profit: parseFloat(results.profit.toFixed(2)),
    profitPerc: parseFloat(results.profitPerc.toFixed(2)),
  };
  console.log(
    `results of backtest for ${symbol}: ${JSON.stringify(output, null, 2)}`
  );
  return {
    symbol,
    ...output,
  };
  // const filepath = path.resolve(__dirname, '../../backtest.json');
  // fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
};

const backtestUniverses = async () => {
  let highestProfitPerc = 0;
  let bestPerformingSymbol = '';
  let bestResults = {};
  for (const symbol of CRYPTO_UNIVERSE) {
    const results = await backtestForSymbol(symbol);
    if (results.profitPerc > highestProfitPerc) {
      bestResults = results;
      highestProfitPerc = results.profitPerc;
      bestPerformingSymbol = symbol;
    }
  }
  console.log('best performing symbol:', bestPerformingSymbol, bestResults);
};

backtestUniverses().catch(console.error);
