import { cache } from './constants';
import alpaca from './alpaca';
import { parseResponseObject } from './helpers';

export const getAccount = async () => {
  if (!cache.account.id) {
    const response = await alpaca.getAccount();
    const account = parseResponseObject(response);
    cache.account = account;
  }
  return cache.account;
};

export const getBuyingPower = async () => {
  const account = await getAccount();
  return account.cash;
};
