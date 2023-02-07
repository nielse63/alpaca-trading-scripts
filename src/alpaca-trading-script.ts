import { getIsMarketOpen } from './clock';
import { get as getAccount } from './account';
import { buy, sell } from './order';
import { getPositions } from './position';

const alpacaTradingScript = async () => {
  // make sure the market is open
  const isMarketOpen = await getIsMarketOpen();
  if (!isMarketOpen) {
    console.warn('market is not open - exiting');
    return;
  }

  // get account data
  const account = await getAccount();
  const { status } = account;
  if (status !== 'ACTIVE') {
    console.error('account is not active - exiting');
    return;
  }

  // get positions
  const positions = await getPositions();

  // execute trades if conditions are met
  if (positions.length) {
    await sell();
  } else {
    await buy();
  }
};

export default alpacaTradingScript;
