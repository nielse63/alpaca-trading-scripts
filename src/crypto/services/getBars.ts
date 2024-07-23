import { subMinutes } from 'date-fns';
import alpaca from '../../alpaca';
import { AlpacaBarObject, BarObject } from '../types.d';

const getBars = async (symbol: string): Promise<BarObject[]> => {
  const end = new Date();
  const limit = 150;
  const start = subMinutes(end, 15 * limit).toISOString();
  const config = {
    timeframe: '15Min',
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
