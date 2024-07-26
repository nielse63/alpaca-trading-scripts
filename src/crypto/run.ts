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
import { updateStopLimitSellOrder } from './orders';

const run = async () => {
  // clear existing logs
  await fs.remove(STDOUT_LOG_FILE);
  await fs.remove(STDERR_LOG_FILE);

  // init logs
  console.log('');
  log('executing crypto script');

  // get current positions
  const cryptoPositions = await getPositions();

  // close positions that have a sell signal
  const closedPositions = await closePositions(
    cryptoPositions,
    BARS_TIMEFRAME_STRING
  );
  const cryptoSymbols = cryptoPositions
    .map((position) => position.symbol)
    .filter((symbol) => !closedPositions.includes(symbol));

  // update existing stop limit sell orders
  for (const symbol of cryptoSymbols) {
    await updateStopLimitSellOrder(symbol);
  }

  // prevent further execution if we have no capital
  const availableCapital = await getBuyingPower();
  if (availableCapital < AVAILABLE_CAPITAL_THRESHOLD) {
    log('not enough capital to buy - stopping execution');
    return;
  }

  // determine what we can buy
  // parallel fetch historical data
  const symbolsToBuy = CRYPTO_UNIVERSE.filter(
    (symbol) => !closedPositions.includes(symbol)
  );
  await buySymbols(symbolsToBuy);
};

export default run;
