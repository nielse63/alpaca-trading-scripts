import {
  AlpacaQuote,
  AlpacaTrade,
  AlpacaBar,
} from '@alpacahq/alpaca-trade-api/dist/resources/datav2/entityv2';
import Alpaca from '@alpacahq/alpaca-trade-api';

export interface IDateObject {
  date: string;
  open: string;
  close: string;
  session_open: string;
  session_close: string;
}

export type AlpacaAccount = {
  id: string;
  account_number: string;
  status: string;
  crypto_status: string;
  currency: string;
  buying_power: number;
  regt_buying_power: number;
  daytrading_buying_power: number;
  effective_buying_power: number;
  non_marginable_buying_power: number;
  bod_dtbp: number;
  cash: number;
  accrued_fees: number;
  pending_transfer_in: number;
  portfolio_value: number;
  pattern_day_trader: boolean;
  trading_blocked: boolean;
  transfers_blocked: boolean;
  account_blocked: boolean;
  created_at: string;
  trade_suspended_by_user: boolean;
  multiplier: number;
  shorting_enabled: boolean;
  equity: number;
  last_equity: number;
  long_market_value: number;
  short_market_value: number;
  position_market_value: number;
  initial_margin: number;
  maintenance_margin: number;
  last_maintenance_margin: number;
  sma: number;
  daytrade_count: number;
  balance_asof: string;
  crypto_tier: number;
};

export type BarSMA = {
  sma: {
    fast: number;
    slow: number;
  };
};

type IBar = AlpacaBar & BarSMA;

export type AlpacaOrder = {
  [key: string]: string | number | boolean;
};

export type AlpacaPosition = {
  [key: string]: string | number | boolean;
};

export interface ICacheObject {
  isMarketOpen?: boolean;
  alpaca?: Alpaca | null;
  account: AlpacaAccount;
  bars: IBar[];
  positions: AlpacaPosition[];
}

export { IBar, AlpacaBar, AlpacaQuote, AlpacaTrade };
