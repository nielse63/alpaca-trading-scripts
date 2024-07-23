import run from './run';

const fn = async () => {
  await run();
};

const TIME_INTERVAL = 1000 * 60 * 15; // 15 minutes
fn().then(() => {
  setInterval(fn, TIME_INTERVAL);
});
