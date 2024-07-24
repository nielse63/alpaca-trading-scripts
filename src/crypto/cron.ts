import run from './run';

const runBuy = async () => {
  await run();
};

// const ONE_HOUR = 1000 * 60 * 60;
const INTERVAL_DELAY = 1000 * 60 * 5;

// run every 15 minutes
// runSell().then(() => {
//   setInterval(runSell, FIFTEEN_MIN);
// });

// run every hour
runBuy().then(() => {
  setInterval(runBuy, INTERVAL_DELAY);
});
