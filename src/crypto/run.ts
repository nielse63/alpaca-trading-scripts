import fs from 'fs-extra';
import { getBuyingPower } from '../account';
import alpaca from '../alpaca';
import { STDERR_LOG_FILE, STDOUT_LOG_FILE } from '../constants';
import { error as errorLogger, log } from '../helpers';
import { CRYPTO_UNIVERSE } from './constants';
// import { waitForOrderFill } from '../order';
import closePositions from './closePositions';
import getPositions from './getPositions';
import { getBarsWithSignals } from '../bars';
import {
  AlpacaQuoteObject,
  // BarObjectWithSignals,
  // FetchedHistoricalDataObject,
  SignalsObjectType,
} from './types.d';

const run = async () => {
  // clear existing logs
  await fs.remove(STDOUT_LOG_FILE);
  await fs.remove(STDERR_LOG_FILE);

  // init logs
  console.log('');
  log('executing crypto script');

  // get current positions
  const cryptoPositions = await getPositions();
  const cryptoSymbols = cryptoPositions.map((p) => p.symbol);

  // determine if we need to sell open positions
  const closedPositions = await closePositions(cryptoPositions);

  // determine what we can buy
  // parallel fetch historical data
  const symbolsToFetch = CRYPTO_UNIVERSE.filter(
    (symbol) =>
      !closedPositions.includes(symbol) && !cryptoSymbols.includes(symbol)
  );
  const fetchPromises = symbolsToFetch.map((symbol) =>
    getBarsWithSignals(symbol)
      .then((data) => data)
      .catch((error) => {
        console.error(error);
        errorLogger(error);
      })
  );
  const barsWithSignals: (SignalsObjectType | void)[] =
    await Promise.all(fetchPromises);

  // filter and process data
  const shouldBuy: SignalsObjectType[] = barsWithSignals.reduce(
    (acc: SignalsObjectType[], object: SignalsObjectType | void) => {
      if (!object) return acc;
      const { signals, lastIndicators } = object;
      const { close: lastClosePrice } = lastIndicators;
      if (lastClosePrice >= 2) {
        // const dataWithIndicators = calculateIndicators(data);
        // const dataWithSignals = generateSignals(dataWithIndicators);
        // const lastBar = dataWithSignals[data.length - 1];
        // log(`${lastBar.symbol}:\n${JSON.stringify(dataWithSignals, null, 2)}`);
        if (signals.buy) {
          acc.push(object);
        }
      }
      return acc;
    },
    []
  );

  if (!shouldBuy.length) {
    log('no assets to buy');
    return;
  }

  const symbols = shouldBuy.map((b) => b.symbol);
  log(`assets to buy: ${symbols.join(', ')}`);

  // prevent buying if we have no capital
  let availableCapital = await getBuyingPower();
  if (availableCapital < 10) {
    log('no available capital');
    return;
  }
  const amountPerPosition = availableCapital / shouldBuy.length;

  // get latest quotes
  const latestQuotes: Map<string, AlpacaQuoteObject> =
    await alpaca.getLatestCryptoQuotes(symbols);

  // buy assets
  for (const object of shouldBuy) {
    const { symbol } = object;

    // determine qty and cost basis
    const latestBidPrice = latestQuotes.has(symbol)
      ? latestQuotes.get(symbol)?.BidPrice
      : undefined;
    if (!latestBidPrice) continue;
    let qty = parseFloat((amountPerPosition / latestBidPrice).toFixed(4));
    availableCapital = await getBuyingPower();
    let costBasis = qty * latestBidPrice;
    if (costBasis > availableCapital) {
      costBasis = availableCapital;
      qty = parseFloat((costBasis / latestBidPrice).toFixed(4));
    }
    console.log({ symbol, qty, costBasis });

    // prevent buying if cost basis is less than 1
    if (costBasis < 1) {
      log(`cost basis less than 1 for ${symbol}: ${costBasis}`);
      continue;
    }

    // place buy order
    try {
      log(`Placing buy order for ${qty} shares of ${symbol}`);
      const buyOrder = await alpaca.createOrder({
        symbol: symbol,
        qty: qty,
        side: 'buy',
        type: 'market',
        time_in_force: 'ioc',
      });
      // await waitForOrderFill(buyOrder.id);
      log(`buy order placed: ${JSON.stringify(buyOrder, null, 2)}`);
    } catch (error: any) {
      console.error(error?.response?.data);
      errorLogger('error placing buy order');
      errorLogger(error);
    }

    // try {
    //   const tslOrder = await alpaca.createOrder({
    //     symbol: symbol,
    //     qty: buyOrder.qty,
    //     side: 'sell',
    //     type: 'trailing_stop',
    //     trail_percent: 5,
    //     time_in_force: 'gtc',
    //   });
    //   log(
    //     `trailing stop loss order placed: ${JSON.stringify(tslOrder, null, 2)}`
    //   );
    //   await waitForOrderFill(buyOrder.id);
    // } catch (error) {
    //   console.error(error);
    //   errorLogger('error placing trailing stop loss order');
    //   errorLogger(error);
    // }
  }
};

export default run;
