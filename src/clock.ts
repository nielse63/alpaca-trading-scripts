import findLastIndex from 'lodash.findlastindex';
import moment from 'moment';
import alpaca from './alpaca';
import { LOOKBACK_LIMIT, cache } from './constants';
import { IDateObject } from './types.d';

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
