import data from '../__fixtures__/closePrices';
import getMACD from '../getMACD';

describe('getMACD', () => {
  it('should return an object of numbers', () => {
    const output = getMACD(data, 12, 26, 9);
    expect(output).toBeObject();
    expect(output).toContainAllKeys(['macd', 'signal', 'histogram']);
    expect(output.macd).toBeNumber();
    expect(output.signal).toBeNumber();
    expect(output.histogram).toBeNumber();
  });

  it('should handle default values', () => {
    const output = getMACD(data);
    expect(output).toBeDefined();
    expect(output.macd).toEqual(-0.185);
    expect(output.signal).toEqual(-0.2113);
    expect(output.histogram).toEqual(0.0263);
  });
});
