import { ACCOUNT_NUMERIC_KEYS, cache } from './constants';
import alpaca from './alpaca';

export const get = async () => {
  if (!cache.account.id) {
    const response = await alpaca.getAccount();
    const account = Object.entries(response).reduce(
      (previousValue, [key, value]) => {
        const newValue =
          ACCOUNT_NUMERIC_KEYS.includes(key) && typeof value === 'string'
            ? parseFloat(value)
            : value;
        return {
          ...previousValue,
          [key]: newValue,
        };
      },
      { ...cache.account }
    );
    cache.account = account;
  }
  return cache.account;
};

export default get;
