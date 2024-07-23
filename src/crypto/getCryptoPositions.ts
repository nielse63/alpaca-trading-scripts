import alpaca from '../alpaca';
import { log } from '../helpers';
import { AlpacaPosition } from './types.d';

const getCryptoPositions = async () => {
  const positions: AlpacaPosition[] = await alpaca.getPositions();
  const crypotPositions = positions
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
  log(`current positions: ${crypotPositions.map((p) => p.symbol).join(', ')}`);
  return crypotPositions;
};

export default getCryptoPositions;
