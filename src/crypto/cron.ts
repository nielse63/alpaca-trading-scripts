import run from './run';

const runBuy = async () => {
  await run();
};

const INTERVAL_DELAY = 1000 * 60 * 5;

// run every five minutes
runBuy().then(() => {
  setInterval(runBuy, INTERVAL_DELAY);
});
