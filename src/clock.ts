import findLastIndex from 'lodash/findLastIndex';
import moment from 'moment';
import { IDateObject } from './types.d';
import { LOOKBACK_LIMIT, cache } from './constants';
import alpaca from './alpaca';

export const getIsMarketOpen = async () => {
  if (!('isMarketOpen' in cache)) {
    const clock = await alpaca.getClock();
    cache.isMarketOpen = clock.is_open;
  }
  return cache.isMarketOpen;
};

export const getTradingDates = async () => {
  const tradingDays = await alpaca.getCalendar();
  const clock = await alpaca.getClock();
  const i = findLastIndex(
    tradingDays,
    (d: IDateObject) => d.date <= moment(clock).format('YYYY-MM-DD')
  );
  return tradingDays.slice(i - LOOKBACK_LIMIT, i);
};
