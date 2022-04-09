require('dotenv').config();
const last = require('lodash/last');
const { getAccount } = require('./src/account');
const { getData } = require('./src/bars');
const { buy, getShouldBuy } = require('./src/buy');
const { sell, getShouldSell } = require('./src/sell');

// constants
const SYMBOL = 'BTCUSD';

const main = async () => {
  const account = await getAccount();
  if (account.crypto_status !== 'ACTIVE') {
    console.log('Unable to trade crypto - sorry');
    return;
  }

  // get data
  const data = await getData(SYMBOL);
  const lastBar = last(data.bars);

  // determine if we should buy or sell
  const shouldBuy = getShouldBuy(lastBar);
  const shouldSell = await getShouldSell(lastBar);
  console.log({ lastBar, shouldBuy, shouldSell });

  // execute trade
  if (shouldBuy) {
    await buy(SYMBOL);
  } else if (shouldSell) {
    await sell(SYMBOL);
  }
};

(async () => {
  await main().catch(console.error);
})();
