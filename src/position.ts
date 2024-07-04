import alpaca from './alpaca';
import { cache, SYMBOL } from './constants';
import { AlpacaPosition } from './types.d';

export const getPositions = async () => {
  if (!cache.positions || !cache.positions.length) {
    const positions = await alpaca.getPositions();
    cache.positions = positions.filter((position: AlpacaPosition) => {
      return position.symbol === SYMBOL;
    });
  }
  return cache.positions;
};

export const hasLongPosition = async () => {
  const positions = await getPositions();
  if (!positions.length) {
    return false;
  }
  return positions.some((position: AlpacaPosition) => {
    return position.side === 'long';
  });
};

export const hasShortPosition = async () => {
  const positions = await getPositions();
  if (!positions.length) {
    return false;
  }
  return positions.some((position: AlpacaPosition) => {
    return position.side === 'short';
  });
};
