import { EMA } from 'trading-signals';

const getEMA = (data: number[], period: number) => {
  const ema = new EMA(period);
  data.forEach((d) => {
    ema.update(d);
  });

  return parseFloat(ema.getResult().toFixed(4));
};

export default getEMA;
