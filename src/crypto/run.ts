import { getBuyingPower } from '../account';
import alpaca from '../alpaca';
import { error as errorLogger, log } from '../helpers';
import { waitForOrderFill } from '../order';
import closePositions from './closePositions';
import getCryptoPositions from './getCryptoPositions';
import {
  calculateIndicators,
  CRYPTO_UNIVERSE,
  fetchHistoricalData,
  generateSignals,
} from './helpers';

const run = async () => {
  const crypotPositions = await getCryptoPositions();

  // determine if we need to sell open positions
  const closedPositions = await closePositions(crypotPositions);

  // determine what we can buy
  const shouldBuy = [];
  for (const symbol of CRYPTO_UNIVERSE) {
    if (closedPositions.includes(symbol)) {
      continue;
    }
    const data = await fetchHistoricalData(symbol);
    const lastClosePrice = data[data.length - 1].close;
    if (lastClosePrice > 100 || lastClosePrice < 2) {
      continue;
    }
    const dataWithIndicators = calculateIndicators(data);
    // log(JSON.stringify(dataWithIndicators, null, 2));
    // process.exit(0);
    const dataWithSignals = generateSignals(dataWithIndicators);
    const lastBar = dataWithSignals[data.length - 1];
    log(`last bar for ${symbol}: ${JSON.stringify(lastBar, null, 2)}`);
    if (lastBar.signal > 0) {
      shouldBuy.push({ ...lastBar, symbol });
    }
  }
  if (!shouldBuy.length) {
    log('no assets to buy');
    return;
  }

  log('assets to buy:');
  shouldBuy.forEach((b) => {
    log(`- ${b.symbol}`);
  });
  const availableCapital = await getBuyingPower();
  const amountPerPosition = availableCapital / shouldBuy.length;
  for (const lastBar of shouldBuy) {
    const { symbol } = lastBar;
    const qty = parseFloat((amountPerPosition / lastBar.close).toFixed(4));
    if (qty > 0) {
      let buyOrder;
      // let tslOrder;
      try {
        log(`Placing buy order for ${qty} shares of ${symbol}`);
        buyOrder = await alpaca.createOrder({
          symbol: symbol,
          qty: qty,
          side: 'buy',
          type: 'market',
          time_in_force: 'ioc',
        });
        await waitForOrderFill(buyOrder.id);
        log(`buy order placed: ${JSON.stringify(buyOrder, null, 2)}`);
      } catch (error: any) {
        console.error(error.response.data);
        errorLogger('error placing buy order');
        errorLogger(error);
      }

      // try {
      //   tslOrder = await alpaca.createOrder({
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
  }
};

// run().catch(console.error);

export default run;
