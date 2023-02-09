import { getPositions } from '../position';

jest.mock('@alpacahq/alpaca-trade-api');

describe('getPositions', () => {
  describe('getPositions', () => {
    it('should return array', async () => {
      const positions = await getPositions();
      expect(positions).toBeArray();
    });
  });
});
