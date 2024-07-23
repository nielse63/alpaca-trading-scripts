import { RSI } from 'trading-signals';

const getRSI = (data: number[], interval: number) => {
  const rsi = new RSI(interval);
  data.forEach((d) => {
    rsi.update(d);
  });

  return parseFloat(rsi.getResult().toFixed(4));
};

export default getRSI;
