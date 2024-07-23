import data from '../__fixtures__/closePrices';
import getRSI from '../getRSI';

describe('getRSI', () => {
  it('should return a number', () => {
    const output = getRSI(data, 14);
    expect(output).toBeNumber();
  });
});
