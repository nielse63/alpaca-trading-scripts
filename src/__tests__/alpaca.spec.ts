import { get } from '../alpaca';
import { cache } from '../constants';

jest.mock('@alpacahq/alpaca-trade-api');

describe('alpaca', () => {
  afterEach(() => {
    jest.clearAllMocks();
    delete cache.alpaca;
  });

  it('should return alpaca instance', () => {
    const alpaca = get();
    expect(alpaca).toBeDefined();
  });

  it('should return cached value', () => {
    expect(cache.alpaca).not.toBeDefined();
    get();
    expect(cache.alpaca).toBeDefined();
  });
});
