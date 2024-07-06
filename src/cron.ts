import cron from 'node-cron';
import crypto from './crypto';
import { log } from './helpers';

cron.schedule('0 * * * *', async () => {
  log('');
  log(`Running a task every hour at ${new Date().toISOString()}`);
  await crypto();
});
