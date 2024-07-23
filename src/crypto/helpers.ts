// import { subMinutes } from 'date-fns';
// import { EMA, MACD, RSI } from 'technicalindicators';
// import alpaca from '../alpaca';
// import {
//   AlpacaBarObject,
//   BarObject,
//   BarObjectWithIndicators,
//   BarObjectWithSignals,
// } from './types.d';

// export const CRYPTO_UNIVERSE = [
//   'AAVE',
//   'AVAX',
//   'BAT',
//   'BCH',
//   'BTC',
//   'CRV',
//   'DOGE',
//   'DOT',
//   'ETH',
//   'GRT',
//   'LINK',
//   'LTC',
//   'MKR',
//   'SHIB',
//   'SUSHI',
//   'UNI',
//   'USDC',
//   'USDT',
//   'XTZ',
//   'YFI',
// ].map((s) => `${s}/USD`);

// export async function fetchHistoricalData(symbol: string) {
//   const end = new Date();
//   const limit = 100;
//   const start = subMinutes(end, 15 * limit).toISOString();
//   const response: Map<string, AlpacaBarObject[]> = await alpaca.getCryptoBars(
//     [symbol],
//     {
//       timeframe: '15Min',
//       start,
//       end,
//       sort: 'asc',
//     }
//   );
//   const data = response.get(symbol);
//   const formattedData: BarObject[] = (data as AlpacaBarObject[]).map(
//     (d: AlpacaBarObject) => ({
//       close: d.Close,
//       high: d.High,
//       low: d.Low,
//       open: d.Open,
//       timestamp: d.Timestamp,
//       symbol,
//     })
//   );
//   return formattedData;
// }

// export const formatIndicatorArray = (
//   array: (number | null | undefined)[],
//   length: number
// ): (number | null)[] => {
//   let i = 0;
//   while (i < length) {
//     array.splice(i, 0, null);
//     i += 1;
//   }
//   return array.map((d) => (d === undefined ? null : d));
// };

// export const getMACDTrend = (data: (number | null)[], index: number) => {
//   if (index < 3) return 'UNKNOWN';
//   let i = 0;
//   const output = [];
//   while (i < 3) {
//     const value: number | null = data[index - i] || null;
//     if (value) {
//       output.push(value);
//     }
//     i += 1;
//   }
//   if (output.length < 3) return 'UNKNOWN';
//   if (output[2] > output[1] && output[1] > output[0]) return 'UP';
//   if (output[2] <= output[1] && output[1] <= output[0]) return 'DOWN';
//   return 'NEUTRAL';
// };

// export function calculateIndicators(
//   data: BarObject[]
// ): BarObjectWithIndicators[] {
//   const closePrices = data.map((d: BarObject) => d.close);

//   const EMA_FAST_PERIOD = 9;
//   const EMA_SLOW_PERIOD = 21;
//   const MACD_FAST_PERIOD = 12;
//   const MACD_SLOW_PERIOD = 26;
//   const MACD_SIGNAL_PERIOD = 9;
//   const RSI_PERIOD = 14;

//   const emaFast = formatIndicatorArray(
//     EMA.calculate({
//       period: EMA_FAST_PERIOD,
//       values: closePrices,
//     }),
//     EMA_FAST_PERIOD
//   );
//   const emaSlow = formatIndicatorArray(
//     EMA.calculate({
//       period: EMA_SLOW_PERIOD,
//       values: closePrices,
//     }),
//     EMA_SLOW_PERIOD
//   );
//   const macdData = MACD.calculate({
//     values: closePrices,
//     fastPeriod: MACD_FAST_PERIOD,
//     slowPeriod: MACD_SLOW_PERIOD,
//     signalPeriod: MACD_SIGNAL_PERIOD,
//     SimpleMAOscillator: false,
//     SimpleMASignal: false,
//   });
//   const macdArray = formatIndicatorArray(
//     macdData.map((d) => d.MACD),
//     MACD_SLOW_PERIOD
//   );
//   const macdSignalArray = formatIndicatorArray(
//     macdData.map((d) => d.signal),
//     MACD_SLOW_PERIOD
//   );
//   const rsi = formatIndicatorArray(
//     RSI.calculate({ period: RSI_PERIOD, values: closePrices }),
//     RSI_PERIOD
//   );

//   return data.map((d: BarObject, i: number) => {
//     const ema9 = emaFast[i] || null;
//     const ema21 = emaSlow[i] || null;
//     const emaGap = ema9 && ema21 ? Math.abs(ema9 - ema21) : null;
//     const macd = macdArray[i] ? macdArray[i] : null;
//     const macdSignal = macdSignalArray[i] ? macdSignalArray[i] : null;
//     const macdGap = macd && macdSignal && Math.abs(macdSignal - macd);
//     const macdTrend = getMACDTrend(macdArray, i);

//     return {
//       ...d,
//       ema9,
//       ema21,
//       emaGap,
//       macd,
//       macdSignal,
//       macdGap,
//       rsi: rsi[i] || null,
//       macdTrend,
//     };
//   });
// }

// export function generateSignals(
//   data: BarObjectWithIndicators[]
// ): BarObjectWithSignals[] {
//   return data.map((d: BarObjectWithIndicators, i: number) => {
//     if (i === 0 || !d.ema9 || !d.ema21 || !d.macd || !d.macdSignal || !d.rsi) {
//       return { ...d, signal: 0 };
//     }

//     const prev = data[i - 1];
//     let signal = 0;

//     const buySignal =
//       (signal !== 1 &&
//         d.ema9 > d.ema21 &&
//         // prev.ema9 !== null &&
//         // prev.ema21 !== null &&
//         // prev.ema9 <= prev.ema21 &&
//         d.macd > d.macdSignal &&
//         d.rsi < 70) ||
//       (signal !== 1 &&
//         prev.ema9 !== null &&
//         prev.ema21 !== null &&
//         d.ema9 > prev.ema9 &&
//         d.emaGap !== null &&
//         prev.emaGap !== null &&
//         d.emaGap < prev.emaGap &&
//         d.ema9 > d.ema21 &&
//         d.macd > d.macdSignal &&
//         d.rsi < 70);

//     // buy signal
//     if (buySignal) {
//       signal = 1;

//       // sell signal
//     } else if (
//       signal !== -1 &&
//       d.macdTrend === 'DOWN' &&
//       d.ema9 < d.ema21 &&
//       d.rsi > 30 /*&&
//       prev.ema9 !== null &&
//       prev.ema21 !== null &&
//       prev.ema9 >= prev.ema21 &&
//       d.macd < d.macdSignal &&
//       d.rsi < 70*/
//     ) {
//       signal = -1;
//     }

//     return {
//       ...d,
//       signal,
//     };
//   });
// }
