import { format, subWeeks } from 'date-fns';
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
  macd: number | null | undefined;
  macdSignal: number | null | undefined;
  rsi: number | null;
};

type BarObjectWithSignals = BarObjectWithIndicators & {
  signal: number;
};

export const CRYPTO_SYMBOL = 'AVAX/USD';

export async function fetchHistoricalData(symbol: string) {
  const end = format(new Date(), 'yyyy-MM-dd');
  const start = format(subWeeks(end, 2), 'yyyy-MM-dd');
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
  return formattedData;
}

export function calculateIndicators(
  data: BarObject[]
): BarObjectWithIndicators[] {
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

export function generateSignals(
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
