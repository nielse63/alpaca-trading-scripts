import { log } from '../helpers';
import run from './run';

const TIME_INTERVAL = 1000 * 60 * 15; // 15 minutes
setInterval(async () => {
  log('');
  log(`executing crypto at ${new Date().toISOString()}`);
  await run();
}, TIME_INTERVAL);
