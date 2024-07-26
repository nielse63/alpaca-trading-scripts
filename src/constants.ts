import { ICacheObject } from './types.d';
import path from 'path';

export const PAPER_URL = 'https://paper-api.alpaca.markets/v2';
export const SYMBOL = 'BAC';
export const SMA_FAST_INTERVAL = 11;
export const SMA_SLOW_INTERVAL = 23;
export const LOOKBACK_LIMIT = SMA_SLOW_INTERVAL * 3;
export const TIME_INTERVAL = '1Hour';
export const STOP_LOSS_PERCENT = 0.99;
export const TRAILING_STOP_LOSS_PERCENT = 1.5;
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
export const STDOUT_LOG_FILE = path.resolve(__dirname, '../stdout.log');
export const STDERR_LOG_FILE = path.resolve(__dirname, '../stderr.log');
export const AVAILABLE_CAPITAL_THRESHOLD = 5;
