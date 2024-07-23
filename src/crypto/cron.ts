import { log } from '../helpers';
import run from './run';

const fn = async () => {
  log('');
  log(`executing crypto at ${new Date()}`);
  await run();
};

// fn().catch(console.error);

const TIME_INTERVAL = 1000 * 60 * 15; // 15 minutes
fn().then(() => {
  setInterval(fn, TIME_INTERVAL);
});
