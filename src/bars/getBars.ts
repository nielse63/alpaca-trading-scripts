import { subDays, subHours, subMinutes } from 'date-fns';
import alpaca from '../alpaca';
import { BARS_TIMEFRAME_STRING } from '../crypto/constants';
import { AlpacaBarObject, BarObject } from '../crypto/types.d';

const getBars = async (
  symbol: string,
  timeframe: string = BARS_TIMEFRAME_STRING
): Promise<BarObject[]> => {
  const end = new Date();
  const limit = 150;
  let subFn = subMinutes;
  if (timeframe.includes('Hour')) {
    subFn = subHours;
  } else if (timeframe.includes('Day')) {
    subFn = subDays;
  }
  const subAmount = parseFloat(timeframe.replace(/\D/g, ''));
  const start = subFn(end, subAmount * limit).toISOString();
  const config = {
    timeframe,
    start,
    end,
    sort: 'asc',
  };
  const response: Map<string, AlpacaBarObject[]> = await alpaca.getCryptoBars(
    [symbol],
    config
  );
  const data = response.get(symbol);
  const formattedData = (data as AlpacaBarObject[]).map(
    (d: AlpacaBarObject) => ({
      close: d.Close,
      high: d.High,
      low: d.Low,
      open: d.Open,
      timestamp: d.Timestamp,
      symbol,
    })
  );
  return formattedData;
};

export default getBars;
