import { cache, SYMBOL } from './constants';
import alpaca from './alpaca';

export const getPositions = async () => {
  if (!cache.positions || !cache.positions.length) {
    cache.positions = await alpaca.getPosition(SYMBOL);
  }
  return cache.positions;
};
