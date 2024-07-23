import data from '../__fixtures__/closePrices';
import getEMA from '../getEMA';

describe('getEMA', () => {
  it('should return a number', () => {
    const output = getEMA(data, 9);
    expect(output).toBeNumber();
  });
});
