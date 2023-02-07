import Alpaca from '@alpacahq/alpaca-trade-api';
import * as dotenv from 'dotenv';
import { cache } from './constants';
dotenv.config();

export const get = () => {
  if (!cache.alpaca) {
    cache.alpaca = new Alpaca({
      keyId: process.env.ALPACA_KEY,
      secretKey: process.env.ALPACA_SECRET,
      paper: true,
    });
  }
  return cache.alpaca;
};

export default get();
