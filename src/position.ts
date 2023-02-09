import { cache, SYMBOL } from './constants';
import alpaca from './alpaca';
import { AlpacaPosition } from './types';

export const getPositions = async () => {
  if (!cache.positions || !cache.positions.length) {
    const positions = await alpaca.getPositions();
    cache.positions = positions.filter((position: AlpacaPosition) => {
      return position.symbol === SYMBOL;
    });
  }
  return cache.positions;
};
