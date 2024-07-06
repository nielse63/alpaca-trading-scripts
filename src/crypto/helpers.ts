import { subWeeks } from 'date-fns';
import { EMA, MACD, RSI } from 'technicalindicators';
import alpaca from '../alpaca';

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
  emaGap: number | null;
  macd: number | null | undefined;
  macdSignal: number | null | undefined;
  macdGap: number | null | undefined;
  rsi: number | null;
};

type BarObjectWithSignals = BarObjectWithIndicators & {
  signal: number;
};

export const CRYPTO_SYMBOL = 'AAVE/USD';
export const CRYPTO_UNIVERSE = [
  'AAVE',
  'AVAX',
  'BAT',
  'BCH',
  'BTC',
  'CRV',
  'DOGE',
  'DOT',
  'ETH',
  'GRT',
  'LINK',
  'LTC',
  'MKR',
  'SHIB',
  'SUSHI',
  'UNI',
  'USDC',
  'USDT',
  'XTZ',
  'YFI',
].map((s) => `${s}/USD`);

export async function fetchHistoricalData(symbol: string) {
  const end = new Date();
  const start = subWeeks(end, 2).toISOString();
  const response: Map<string, AlpacaBarObject[]> = await alpaca.getCryptoBars(
    [symbol],
    {
      timeframe: '15Min',
      start,
      end,
      sort: 'desc',
    }
  );
  const data = response.get(symbol);
  const formattedData: BarObject[] = (data as AlpacaBarObject[]).map(
    (d: AlpacaBarObject) => ({
      close: d.Close,
      high: d.High,
      low: d.Low,
      open: d.Open,
      timestamp: d.Timestamp,
    })
  );
  return formattedData.slice(-1000);
}

export function calculateIndicators(
  data: BarObject[]
): BarObjectWithIndicators[] {
  const closePrices = data.map((d: BarObject) => d.close);

  const emaFast = EMA.calculate({ period: 9, values: closePrices });
  const emaSlow = EMA.calculate({ period: 21, values: closePrices });
  const macdData = MACD.calculate({
    values: closePrices,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  const rsi = RSI.calculate({ period: 14, values: closePrices });

  return data
    .map((d: BarObject, i: number) => {
      const ema9 = emaFast[i] || null;
      const ema21 = emaSlow[i] || null;
      const emaGap = ema9 && ema21 ? Math.abs(ema9 - ema21) : null;
      const macd = macdData[i] ? macdData[i].MACD : null;
      const macdSignal = macdData[i] ? macdData[i].signal : null;
      const macdGap = macd && macdSignal ? Math.abs(macdSignal - macd) : null;

      return {
        ...d,
        ema9,
        ema21,
        emaGap,
        macd,
        macdSignal,
        macdGap,
        rsi: rsi[i] || null,
      };
    })
    .reverse();
}

export function generateSignals(
  data: BarObjectWithIndicators[]
): BarObjectWithSignals[] {
  return data.map((d: BarObjectWithIndicators, i: number) => {
    if (i === 0 || !d.ema9 || !d.ema21 || !d.macd || !d.macdSignal || !d.rsi) {
      return { ...d, signal: 0 };
    }

    const prev = data[i - 1];
    let signal = 0;

    const buySignal =
      (signal !== 1 &&
        d.ema9 > d.ema21 &&
        // prev.ema9 !== null &&
        // prev.ema21 !== null &&
        // prev.ema9 <= prev.ema21 &&
        d.macd > d.macdSignal &&
        d.rsi < 70) ||
      (signal !== 1 &&
        prev.ema9 !== null &&
        prev.ema21 !== null &&
        d.ema9 > prev.ema9 &&
        d.emaGap !== null &&
        prev.emaGap !== null &&
        d.emaGap < prev.emaGap &&
        d.ema9 > d.ema21 &&
        d.macd > d.macdSignal &&
        d.rsi < 70);

    // buy signal
    if (buySignal) {
      signal = 1;

      // sell signal
    } else if (
      signal !== -1 &&
      d.ema9 < d.ema21 &&
      prev.ema9 !== null &&
      prev.ema21 !== null &&
      prev.ema9 >= prev.ema21 &&
      d.macd < d.macdSignal &&
      d.rsi > 30 /*&&
      d.rsi < 70*/
    ) {
      signal = -1;
    }

    return { ...d, signal };
  });
}
