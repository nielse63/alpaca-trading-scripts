import { getShouldBuy, getShouldSell, waitForOrderFill, buy } from '../order';
import alpaca from '../alpaca';

jest.mock('@alpacahq/alpaca-trade-api');

describe('order', () => {
  describe('waitForOrderFill', () => {
    it('should resolve an object', async () => {
      const orderId = 'test';
      const order = await waitForOrderFill(orderId);
      expect(order).toBeObject();
      expect(order).toContainKeys(['id', 'status']);
    });
  });

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

  describe('buy', () => {
    it('should cancel all orders', async () => {
      const spy = jest.spyOn(alpaca, 'cancelAllOrders');
      await buy();
      expect(spy).toHaveBeenCalled();
    });
  });
});
