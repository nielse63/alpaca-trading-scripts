import Alpaca from '@alpacahq/alpaca-trade-api';
import * as dotenv from 'dotenv';
import { PAPER_URL, cache } from './constants';
dotenv.config();

export const get = () => {
  if (!cache.alpaca) {
    // console.log('======');
    // console.log({
    //   keyId: process.env.ALPACA_KEY,
    //   secretKey: process.env.ALPACA_SECRET,
    //   paper: process.env.ALPACA_URL?.includes(PAPER_URL),
    // });
    // console.log('======');
    cache.alpaca = new Alpaca({
      keyId: process.env.ALPACA_KEY,
      secretKey: process.env.ALPACA_SECRET,
      paper: process.env.ALPACA_URL?.includes(PAPER_URL),
    });
  }
  return cache.alpaca;
};

export default get();
