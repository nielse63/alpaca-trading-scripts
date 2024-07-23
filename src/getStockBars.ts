import alpaca from './alpaca';
import { generatorToArray } from './helpers';
import { AlpacaBar } from './types.d';
import { subMinutes, subHours, subDays, format } from 'date-fns';

const getBars = async (symbol: string, timeframe: string = '1Day') => {
  let end = new Date();
  const limit = 150;
  let subFn = subMinutes;
  if (timeframe.includes('Hour')) {
    subFn = subHours;
  } else if (timeframe.includes('Day')) {
    subFn = subDays;
    end = subDays(end, 1);
  }
  const subAmount = parseFloat(timeframe.replace(/\D/g, ''));
  const start = subFn(end, subAmount * limit).toISOString();
  const config = {
    timeframe,
    start: timeframe.includes('Day') ? format(start, 'yyyy-MM-dd') : start,
    end: timeframe.includes('Day') ? format(end, 'yyyy-MM-dd') : end,
    sort: 'asc',
  };
  console.log({ symbol, config });
  const response = alpaca.getBarsV2(symbol, config);
  console.log({ response });

  const bars = await generatorToArray(response);
  console.log({ bars });

  const formattedData = (bars as AlpacaBar[]).map((d: AlpacaBar) => ({
    close: d.ClosePrice,
    high: d.HighPrice,
    low: d.LowPrice,
    open: d.OpenPrice,
    timestamp: d.Timestamp,
    symbol,
  }));
  return formattedData;
};

export default getBars;
