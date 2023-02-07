import * as dotenv from 'dotenv';
import alpacaTradingScript from './alpaca-trading-script';
dotenv.config();

alpacaTradingScript()
  .then(() => {
    console.log('done');
  })
  .catch(console.error);
