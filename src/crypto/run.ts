import fs from 'fs-extra';
import { getBuyingPower } from '../account';
import alpaca from '../alpaca';
import { getBarsWithSignals } from '../bars';
import {
  STDERR_LOG_FILE,
  STDOUT_LOG_FILE,
  AVAILABLE_CAPITAL_THRESHOLD,
} from '../constants';
import { error as errorLogger, log } from '../helpers';
import closePositions from './closePositions';
import { CRYPTO_UNIVERSE } from './constants';
import getPositions from './getPositions';
import {
  AlpacaQuoteObject,
  SignalsObjectType,
  AlpacaPosition,
} from './types.d';

export const runSell = async (cryptoPositions: AlpacaPosition[] = []) => {
  log('executing `runSell` function');
  const positions = cryptoPositions.length
    ? cryptoPositions
    : await getPositions();

  // determine if we need to sell open positions
  const closedPositions = await closePositions(positions, '15Min');
  return closedPositions;
};

const run = async (shouldRunSell: boolean = true) => {
  // clear existing logs
  await fs.remove(STDOUT_LOG_FILE);
  await fs.remove(STDERR_LOG_FILE);

  // init logs
  console.log('');
  log('executing crypto script');

  // get current positions
  const cryptoPositions = await getPositions();

  // get current positions
  const closedPositions = shouldRunSell ? await runSell(cryptoPositions) : [];
  const cryptoSymbols = cryptoPositions.map((p) => p.symbol);

  // prevent further execution if we have no capital
  let availableCapital = await getBuyingPower();
  if (availableCapital < AVAILABLE_CAPITAL_THRESHOLD) {
    log('no available capital');
    return;
  }

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
      // console.log({ symbol: object.symbol, lastClosePrice, signals });
      if (signals.buy && lastClosePrice < 100 /*&& lastClosePrice > 1*/) {
        acc.push(object);
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
    console.log({ symbol, qty, costBasis, availableCapital });

    // prevent buying if cost basis is less than 1
    if (costBasis < 1) {
      log(`cost basis less than 1 for ${symbol}: ${costBasis}`);
      continue;
    }

    // place buy order
    try {
      log(`Placing buy order for ${qty} shares of ${symbol}`);
      await alpaca.createOrder({
        symbol: symbol,
        qty: qty,
        side: 'buy',
        type: 'market',
        time_in_force: 'ioc',
      });
      // await waitForOrderFill(buyOrder.id);
      log(`buy order for ${symbol} completed successfully`);
    } catch (error: any) {
      errorLogger(`error placing buy order for ${symbol}`);
      console.error(error?.response?.data);
      errorLogger(JSON.stringify(error?.response?.data, null, 2));
    }
  }
};

export default run;
