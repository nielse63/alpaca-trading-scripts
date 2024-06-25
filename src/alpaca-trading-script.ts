import { getAccount, getBuyingPower } from './account';
import { getIsMarketOpen } from './clock';
import { buy, sell } from './order';
import { getPositions } from './position';

const alpacaTradingScript = async () => {
  console.log('running at', new Date().toISOString());
  // make sure the market is open
  console.log('checking if market is open');
  const isMarketOpen = await getIsMarketOpen();
  if (!isMarketOpen) {
    console.warn('market is not open - exiting');
    return;
  }
  console.log('market is open!');

  // get account data
  console.log('getting account data');
  const account = await getAccount();
  const { status } = account;
  if (status !== 'ACTIVE') {
    console.error('account is not active - exiting');
    return;
  }

  // get positions
  console.log('getting positions');
  const positions = await getPositions();

  // if we have open positions, determine if they should be sold
  if (positions.length) {
    console.log('running sell function');
    await sell();
  }
  // if we have more than $1, see what (and if) we can buy
  const buyingPower = await getBuyingPower();
  if (buyingPower > 1) {
    console.log('running buy function');
    await buy();
  }
};

export default alpacaTradingScript;
