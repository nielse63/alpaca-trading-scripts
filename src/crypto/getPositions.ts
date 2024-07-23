import alpaca from '../alpaca';
import { log } from '../helpers';
import { AlpacaPosition } from './types.d';

const getPositions = async () => {
  const positions: AlpacaPosition[] = await alpaca.getPositions();
  const cryptoPositions = positions
    .filter((position) => {
      return position.asset_class === 'crypto';
    })
    .map((position) => {
      const { symbol } = position;
      if (symbol.endsWith('/USD')) {
        return position;
      }
      if (symbol.endsWith('USD') && !symbol.includes('/')) {
        return {
          ...position,
          symbol: position.symbol.replace('USD', '/USD'),
        };
      }
      return {
        ...position,
        symbol: `${symbol}/USD`,
      };
    });
  log(`current positions: ${cryptoPositions.map((p) => p.symbol).join(', ')}`);
  return cryptoPositions;
};

export default getPositions;
