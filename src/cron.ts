import cron from 'node-cron';
import crypto from './crypto';
import { log } from './helpers';

cron.schedule('*/15 * * * *', async () => {
  log('');
  log(`executing crypto at ${new Date().toISOString()}`);
  await crypto();
});
