import run from './run';

const fn = async () => {
  await run();
};

const TIME_INTERVAL = 1000 * 60 * 60; // 1 hour
fn().then(() => {
  setInterval(fn, TIME_INTERVAL);
});
