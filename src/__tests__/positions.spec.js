const { getPositions, getPosition, hasPosition } = require('../positions');
const alpaca = require('../alpaca');
const MOCK_POSITION = require('../__fixtures__/position');

describe('positions', () => {
  let getPositionsMock;

  beforeEach(() => {
    getPositionsMock = jest
      .spyOn(alpaca, 'getPositions')
      .mockImplementation(() => Promise.resolve([MOCK_POSITION]));
  });

  describe('getPositions', () => {
    it('should get all positions', async () => {
      const positions = await getPositions();
      expect(positions).toBeArray();
      expect(getPositionsMock).toHaveBeenCalledOnce();
    });
  });

  describe('getPosition', () => {
    it('should get single position', async () => {
      const position = await getPosition(MOCK_POSITION.symbol);
      expect(position).toBeObject();
      expect(getPositionsMock).toHaveBeenCalledOnce();
    });
  });

  describe('hasPosition', () => {
    it('should return true if position exists', async () => {
      const output = await hasPosition(MOCK_POSITION.symbol);
      expect(output).toBeBoolean();
      expect(output).toBe(true);
      expect(getPositionsMock).toHaveBeenCalledOnce();
    });

    it('should return false if position does not exist', async () => {
      const output = await hasPosition('AAPL');
      expect(output).toBeBoolean();
      expect(output).toBe(false);
      expect(getPositionsMock).toHaveBeenCalledOnce();
    });
  });
});
