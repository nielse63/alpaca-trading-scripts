import fs from 'fs-extra';
import { getBuyingPower } from '../account';
import {
  AVAILABLE_CAPITAL_THRESHOLD,
  STDERR_LOG_FILE,
  STDOUT_LOG_FILE,
} from '../constants';
import { log } from '../helpers';
import { buySymbols } from './buy';
import closePositions from './closePositions';
import { BARS_TIMEFRAME_STRING, CRYPTO_UNIVERSE } from './constants';
import getPositions from './getPositions';

const run = async () => {
  // clear existing logs
  await fs.remove(STDOUT_LOG_FILE);
  await fs.remove(STDERR_LOG_FILE);

  // init logs
  console.log('');
  log('executing crypto script');

  // get current positions
  const cryptoPositions = await getPositions();

  // get current positions
  const closedPositions = await closePositions(
    cryptoPositions,
    BARS_TIMEFRAME_STRING
  );

  // prevent further execution if we have no capital
  const availableCapital = await getBuyingPower();
  if (availableCapital < AVAILABLE_CAPITAL_THRESHOLD) {
    log('no available capital');
    return;
  }

  // determine what we can buy
  // parallel fetch historical data
  const cryptoSymbols = cryptoPositions.map((p) => p.symbol);
  const symbolsToBuy = CRYPTO_UNIVERSE.filter(
    (symbol) =>
      !closedPositions.includes(symbol) && !cryptoSymbols.includes(symbol)
  );
  await buySymbols(symbolsToBuy);
};

export default run;
