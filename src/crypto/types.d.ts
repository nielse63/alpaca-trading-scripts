export type AlpacaPosition = {
  asset_id: string;
  symbol: string;
  exchange?: string;
  asset_class?: string;
  asset_marginable?: boolean;
  qty: string;
  avg_entry_price?: string;
  side?: string;
  market_value?: string;
  cost_basis?: string;
  unrealized_pl?: string;
  unrealized_plpc?: string;
  unrealized_intraday_pl?: string;
  unrealized_intraday_plpc?: string;
  current_price?: string;
  lastday_price?: string;
  change_today?: string;
  qty_available?: string;
};

export type AlpacaBarObject = {
  Close: number;
  High: number;
  Low: number;
  TradeCount: number;
  Open: number;
  Timestamp: string;
  Volume: number;
  VWAP: number;
};

export type AlpacaQuoteObject = {
  AskPrice: number;
  AskSize: number;
  BidPrice: number;
  BidSize: number;
  Timestamp: string;
};

export type AlpacaCryptoBarsConfig = {
  timeframe: string;
  sort: string;
  limit: number;
  page_token?: string;
};

export type BarObject = {
  close: number;
  high: number;
  low: number;
  open: number;
  timestamp: string;
  symbol: string;
};

export type BarObjectWithIndicators = BarObject & {
  ema9: number | null;
  ema21: number | null;
  emaGap: number | null;
  macd: number | null | undefined;
  macdSignal: number | null | undefined;
  macdGap: number | null | undefined;
  rsi: number | null;
  macdTrend?: string;
};

export type BarObjectWithSignals = BarObjectWithIndicators & {
  signal: number;
};

export type FetchedHistoricalDataObject = {
  data?: BarObject[];
  error?: string;
};

export type BarObjectWithIndicatorsNew = BarObject & {
  emaFast: number | null;
  emaSlow: number | null;
  macdValue: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
  rsi: number | null;
};

export type IndicatorsObjectType = {
  symbol: string;
  data: BarObjectWithIndicatorsNew[];
  lastIndicators: {
    emaFast: number;
    emaSlow: number;
    macdValue: number;
    macdSignal: number;
    macdHistogram: number;
    rsi: number;
    close: number;
  };
};

export type SignalsObjectType = IndicatorsObjectType & {
  signals: {
    buy: boolean;
    sell: boolean;
  };
};
