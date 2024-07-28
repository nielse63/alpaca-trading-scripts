import { error as errorLogger, timeframeToSeconds } from '../helpers';
import { BARS_TIMEFRAME_STRING } from './constants';
import run from './run';

const runBuy = async () => {
  try {
    await run();
  } catch (error) {
    errorLogger(error);
  }
};

const INTERVAL_DELAY = 1000 * timeframeToSeconds(BARS_TIMEFRAME_STRING);

// run every ${INTERVAL_DELAY}
runBuy()
  .then(() => {
    setInterval(runBuy, INTERVAL_DELAY);
  })
  .catch(errorLogger);
