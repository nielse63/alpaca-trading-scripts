import { getShouldBuy, getShouldSell } from '../order';

jest.mock('@alpacahq/alpaca-trade-api');

describe('order', () => {
  describe('getShouldBuy', () => {
    it('should return boolean', async () => {
      const shouldBuy = await getShouldBuy();
      expect(shouldBuy).toBeBoolean();
    });
  });

  describe('getShouldSell', () => {
    it('should return boolean', async () => {
      const shouldSell = await getShouldSell();
      expect(shouldSell).toBeBoolean();
    });
  });
});
