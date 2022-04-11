const { sell, getShouldSell } = require('../sell');
const alpaca = require('../alpaca');
const MOCK_QUOTE = require('../__fixtures__/quote');
const MOCK_POSITION = require('../__fixtures__/position');
const MOCK_ORDER = require('../__fixtures__/order');
const MOCK_BAR = require('../__fixtures__/bar');

describe('sell', () => {
  let getPositionsMock;
  let createOrderMock;

  beforeEach(() => {
    getPositionsMock = jest
      .spyOn(alpaca, 'getPositions')
      .mockImplementation(() => Promise.resolve([MOCK_POSITION]));
    createOrderMock = jest.spyOn(alpaca, 'createOrder').mockImplementation(() =>
      Promise.resolve({
        ...MOCK_ORDER,
        side: 'sell',
      })
    );
  });

  describe('sell', () => {
    it('should place sell order', async () => {
      const order = await sell(MOCK_QUOTE.Symbol);

      expect(getPositionsMock).toHaveBeenCalledOnce();
      expect(createOrderMock).toHaveBeenCalledOnce();
      expect(order).toBeObject();
    });

    it('should not place order when position not help', async () => {
      getPositionsMock = jest
        .spyOn(alpaca, 'getPositions')
        .mockImplementation(() => Promise.resolve([]));
      await sell(MOCK_QUOTE.Symbol);

      expect(createOrderMock).not.toHaveBeenCalled();
    });

    it('should not place order when position qty <= 0.0001', async () => {
      getPositionsMock = jest
        .spyOn(alpaca, 'getPositions')
        .mockImplementation(() =>
          Promise.resolve([
            {
              ...MOCK_POSITION,
              qty: '0.0001',
            },
          ])
        );
      await sell(MOCK_QUOTE.Symbol);

      expect(createOrderMock).not.toHaveBeenCalled();
    });
  });

  describe('getShouldSell', () => {
    it('should call getPositions', async () => {
      getPositionsMock = jest
        .spyOn(alpaca, 'getPositions')
        .mockImplementation(() => Promise.resolve([]));
      expect(getPositionsMock).toHaveBeenCalled();
    });

    it('should return false if the position isnt held', async () => {
      const shouldSell = await getShouldSell({
        ...MOCK_BAR,
        SMA: {
          fast: MOCK_BAR.Close + 10,
          slow: MOCK_BAR.Close - 20,
        },
      });
      expect(shouldSell).toBe(false);
    });

    it('should return false if Close > sma fast', async () => {
      const shouldSell = await getShouldSell({
        ...MOCK_BAR,
        SMA: {
          fast: MOCK_BAR.Close + 10,
          slow: MOCK_BAR.Close - 20,
        },
      });
      expect(shouldSell).toBe(false);
    });

    it('should return false if sma fast > sma slow', async () => {
      const shouldSell = await getShouldSell({
        ...MOCK_BAR,
        SMA: {
          fast: MOCK_BAR.Close - 10,
          slow: MOCK_BAR.Close - 20,
        },
      });
      expect(shouldSell).toBe(false);
    });

    it('should return true if position is held, sma fast < sma slow, and Close < sma fast', async () => {
      const shouldSell = await getShouldSell({
        ...MOCK_BAR,
        SMA: {
          fast: MOCK_BAR.Close + 10,
          slow: MOCK_BAR.Close + 20,
        },
      });
      expect(shouldSell).toBe(true);
    });
  });
});
