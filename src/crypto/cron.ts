import run, { runSell } from './run';

const runBuy = async () => {
  await run(false);
};

const ONE_HOUR = 1000 * 60 * 60;
const FIFTEEN_MIN = 1000 * 60 * 15;

// run every 15 minutes
runSell().then(() => {
  setInterval(runSell, FIFTEEN_MIN);
});

// run every hour
runBuy().then(() => {
  setInterval(runBuy, ONE_HOUR);
});
