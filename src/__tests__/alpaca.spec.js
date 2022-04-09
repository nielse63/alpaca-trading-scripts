const Alpaca = require('@alpacahq/alpaca-trade-api');
const alpaca = require('../alpaca');

describe('alpaca', () => {
  it('should be defined', () => {
    expect(alpaca).toBeDefined();
    expect(alpaca).toBeInstanceOf(Alpaca);
  });
});
