// import run from './run';
import { buySymbol } from './buy';

const runBuy = async () => {
  // await run();
  await buySymbol('AVAX/USD');
};

const INTERVAL_DELAY = 1000 * 60 * 5;

// run every five minutes
runBuy().then(() => {
  setInterval(runBuy, INTERVAL_DELAY);
});
