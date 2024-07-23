import positionsFixture from '../../__fixtures__/positions';
import closePositions from '../closePositions';

jest.mock('../helpers', () => {
  const originalModule = jest.requireActual('../helpers');

  return {
    __esModule: true,
    ...originalModule,
    fetchHistoricalData: jest.fn().mockResolvedValue([{ close: 100 }]),
    calculateIndicators: jest.fn().mockReturnValue([{ close: 100 }]),
    generateSignals: jest.fn().mockReturnValue([{ signal: -1 }]),
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
