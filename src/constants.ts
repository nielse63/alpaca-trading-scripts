import { ICacheObject } from './types';

export const PAPER_URL = 'https://paper-api.alpaca.markets';
export const SYMBOL = 'MSFT';
export const SMA_FAST_INTERVAL = 7;
export const SMA_SLOW_INTERVAL = 14;
export const LOOKBACK_LIMIT = 50;
export const cache: ICacheObject = {
  alpaca: null,
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
  positions: [],
};
