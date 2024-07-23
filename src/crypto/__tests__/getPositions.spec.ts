import getPositions from '../getPositions';

describe('getPositions', () => {
  it('should return an array of position objects', async () => {
    const cryptoPositions = await getPositions();
    expect(cryptoPositions).toBeArray();
    cryptoPositions.forEach((position) => {
      expect(position).toBeObject();
      expect(position).toContainKeys(['asset_class', 'symbol']);
    });
  });

  it('should objects exclusively with asset_class == crypto', async () => {
    const cryptoPositions = await getPositions();
    cryptoPositions.forEach((position) => {
      expect(position.asset_class).toEqual('crypto');
    });
  });

  it('should append `/USD` to symbols that dont have it', async () => {
    const cryptoPositions = await getPositions();
    cryptoPositions.forEach((position) => {
      expect(position.symbol).toMatch(/[A-Z]{3,}\/USD$/);
    });
  });
});
