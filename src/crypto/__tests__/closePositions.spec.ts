import positionsFixture from '../../__fixtures__/positions';
import closePositions from '../closePositions';

jest.mock('../../bars/getBarsWithSignals', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      signals: {
        sell: true,
      },
    })),
  };
});
const MOCK_POSITIONS = positionsFixture
  .filter(({ asset_class }) => asset_class === 'crypto')
  .map((position) => ({
    ...position,
    symbol: `${position.symbol.replace('/', '').replace('USD', '')}/USD`,
  }));

describe('closePositions', () => {
  it('should return an array of closed positions', async () => {
    const closedPositions = await closePositions(MOCK_POSITIONS);
    expect(closedPositions).toEqual(['AAVE/USD', 'AVAX/USD', 'BAT/USD']);
  });
});
