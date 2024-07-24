import alpaca from './alpaca';
import { parseResponseObject } from './helpers';

export const getAccount = async () => {
  const response = await alpaca.getAccount();
  const account = parseResponseObject(response);
  return account;
};

export const getBuyingPower = async () => {
  const account = await getAccount();
  return account.non_marginable_buying_power;
};
