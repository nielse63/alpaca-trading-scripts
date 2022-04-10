const { getAccount, getCash } = require('../account');

const accountKeys = [
  'id',
  'account_number',
  'status',
  'crypto_status',
  'currency',
  'buying_power',
  'regt_buying_power',
  'daytrading_buying_power',
  'non_marginable_buying_power',
  'cash',
  'accrued_fees',
  'pending_transfer_in',
  'portfolio_value',
  'pattern_day_trader',
  'trading_blocked',
  'transfers_blocked',
  'account_blocked',
  'created_at',
  'trade_suspended_by_user',
  'multiplier',
  'shorting_enabled',
  'equity',
  'last_equity',
  'long_market_value',
  'short_market_value',
  'initial_margin',
  'maintenance_margin',
  'last_maintenance_margin',
  'sma',
  'daytrade_count',
];

describe.skip('account', () => {
  describe('getAccount', () => {
    it('should get account', async () => {
      const account = await getAccount();
      expect(account).toBeObject();
      expect(account).toContainAllKeys(accountKeys);
    });
  });

  describe('getCash', () => {
    it('should get cash value', async () => {
      const cash = await getCash();
      expect(cash).toBeNumber();
      expect(cash).not.toBeInteger();
    });
  });
});
