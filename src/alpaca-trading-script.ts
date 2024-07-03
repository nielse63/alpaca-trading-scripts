import moment from 'moment';
import { getAccount, getBuyingPower } from './account';
import { getIsMarketOpen } from './clock';
import { buy, sell } from './order';
import { getPositions } from './position';
import { log, error } from './helpers';

const alpacaTradingScript = async () => {
  log('[info] running at', moment().format('YYYY-MM-DD HH:mm:ss'));
  // make sure the market is open
  log('[info] checking if market is open');
  const isMarketOpen = await getIsMarketOpen();
  if (!isMarketOpen) {
    log('[warning] market is not open - exiting');
    return;
  }
  log('[info] market is open!');

  // get account data
  log('[info] getting account data');
  const account = await getAccount();
  const { status } = account;
  if (status !== 'ACTIVE') {
    error('account is not active - exiting');
    return;
  }

  // get positions
  log('[info] getting positions');
  const positions = await getPositions();

  // if we have open positions, determine if they should be sold
  if (positions.length) {
    log('[info] running sell function');
    await sell();
  }
  // if we have more than $1, see what (and if) we can buy
  const buyingPower = await getBuyingPower();
  if (buyingPower > 1) {
    log('[info] running buy function');
    await buy();
  }
};

export default alpacaTradingScript;
