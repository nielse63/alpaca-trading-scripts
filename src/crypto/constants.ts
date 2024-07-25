export const EMA_FAST_PERIOD = 9;
export const EMA_SLOW_PERIOD = 21;
export const MACD_SHORT_INTERVAL = 12;
export const MACD_LONG_INTERVAL = 26;
export const MACD_SIGNAL_INTERVAL = 9;
export const RSI_INTERVAL = 14;
export const BARS_TIMEFRAME_MINUTES = 5;
export const BARS_TIMEFRAME_STRING = '5Min';
export const IS_DEV =
  process.env.NODE_ENV === undefined || process.env.NODE_ENV === 'development';
export const CRYPTO_UNIVERSE = [
  // 'AAVE',
  'AVAX',
  'BAT',
  // 'BCH',
  // 'BTC',
  // 'CRV',
  'DOGE',
  // 'DOT',
  // 'ETH',
  'GRT',
  'LINK',
  // 'LTC',
  // 'MKR',
  'SHIB',
  // 'SUSHI',
  // 'UNI',
  // 'USDC',
  // 'USDT',
  // 'XTZ',
  // 'YFI',
].map((s) => `${s}/USD`);
