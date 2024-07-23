import getBars from '../getBars';

const MOCK_SYMBOL = 'BTC/USD';

describe('getBars', () => {
  it('should return an array of objects', async () => {
    const result = await getBars(MOCK_SYMBOL);
    expect(result).toBeArray();
    const [item] = result;
    expect(item).toBeObject();
    expect(item).toContainAllKeys([
      'close',
      'high',
      'low',
      'open',
      'timestamp',
      'symbol',
    ]);
    expect(item.symbol).toBe(MOCK_SYMBOL);
    const numericKeys = ['close', 'high', 'low', 'open'];
    const stringKeys = ['timestamp', 'symbol'];
    numericKeys.forEach((key) => {
      expect(item[key]).toBeNumber();
    });
    stringKeys.forEach((key) => {
      expect(item[key]).toBeString();
    });
  });
});
