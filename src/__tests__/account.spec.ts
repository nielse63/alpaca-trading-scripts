import { getAccount, getBuyingPower } from '../account';

jest.mock('@alpacahq/alpaca-trade-api');

describe('alpaca', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAccount', () => {
    it('should return acccount object', async () => {
      const account = await getAccount();
      expect(account).toBeDefined();
    });
  });

  describe('getBuyingPower', () => {
    it('should return value', async () => {
      const buyingPower = await getBuyingPower();
      expect(buyingPower).toBeDefined();
    });
  });
});
