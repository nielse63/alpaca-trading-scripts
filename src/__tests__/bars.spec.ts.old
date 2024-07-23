import { getBars, getCurrentPrice } from '../bars';
import { cache } from '../constants';

jest.mock('@alpacahq/alpaca-trade-api');

describe('bars', () => {
  afterEach(() => {
    cache.bars = [];
  });

  describe('getBars', () => {
    it('should get bars', async () => {
      const bars = await getBars();
      expect(bars).toBeArray();
    });
  });

  describe('getCurrentPrice', () => {
    it('should get latest price', async () => {
      const price = await getCurrentPrice();
      expect(price).toBeNumber();
    });
  });
});
