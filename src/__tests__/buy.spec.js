const { buy, getShouldBuy } = require('../buy');
const alpaca = require('../alpaca');
const MOCK_QUOTE = require('../__fixtures__/quote');
const MOCK_ACCOUNT = require('../__fixtures__/account');
const MOCK_ORDER = require('../__fixtures__/order');
const MOCK_BAR = require('../__fixtures__/bar');

jest.mock('../alpaca');

describe('buy', () => {
  let getAccountMock;
  let getLatestCryptoQuoteMock;
  let createOrderMock;

  beforeEach(() => {
    getAccountMock = jest
      .spyOn(alpaca, 'getAccount')
      .mockImplementation(() => Promise.resolve(MOCK_ACCOUNT));
    getLatestCryptoQuoteMock = jest
      .spyOn(alpaca, 'getLatestCryptoQuote')
      .mockImplementation(() => Promise.resolve(MOCK_QUOTE));
    createOrderMock = jest.spyOn(alpaca, 'createOrder').mockImplementation(() =>
      Promise.resolve({
        ...MOCK_ORDER,
        side: 'buy',
      })
    );
  });

  describe('buy', () => {
    it('should place buy order', async () => {
      const order = await buy(MOCK_QUOTE.Symbol);

      expect(getAccountMock).toHaveBeenCalledOnce();
      expect(getLatestCryptoQuoteMock).toHaveBeenCalledOnce();
      expect(createOrderMock).toHaveBeenCalledOnce();
      expect(order).toBeObject();
    });

    it('should not place order when not enough cash', async () => {
      getAccountMock = jest.spyOn(alpaca, 'getAccount').mockImplementation(() =>
        Promise.resolve({
          ...MOCK_ACCOUNT,
          cash: '0',
        })
      );
      const order = await buy(MOCK_QUOTE.Symbol);

      expect(createOrderMock).not.toHaveBeenCalledOnce();
      expect(order).toBeNull();
    });
  });

  describe('getShouldBuy', () => {
    it('should return false if sma fast < VWAP', () => {
      const shouldBuy = getShouldBuy({
        ...MOCK_BAR,
        smaFast: MOCK_BAR.Close + 10,
        smaSlow: MOCK_BAR.Close - 20,
      });
      expect(shouldBuy).toBe(false);
    });

    it('should return false if sma fast < sma slow', () => {
      const shouldBuy = getShouldBuy({
        ...MOCK_BAR,
        smaFast: MOCK_BAR.Close - 20,
        smaSlow: MOCK_BAR.Close + 10,
      });
      expect(shouldBuy).toBe(false);
    });

    it('should return true if VWAP > sma fast and sma fast > sma slow', () => {
      const shouldBuy = getShouldBuy({
        ...MOCK_BAR,
        smaFast: MOCK_BAR.Close - 10,
        smaSlow: MOCK_BAR.Close - 20,
      });
      expect(shouldBuy).toBe(true);
    });
  });
});
