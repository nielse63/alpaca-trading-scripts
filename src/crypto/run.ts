import { getBuyingPower } from '../account';
import alpaca from '../alpaca';
import { log } from '../helpers';
import { waitForOrderFill } from '../order';
import {
  calculateIndicators,
  fetchHistoricalData,
  generateSignals,
  CRYPTO_SYMBOL,
} from './helpers';

type BarObject = {
  close: number;
  high: number;
  low: number;
  open: number;
  timestamp: string;
};

type BarObjectWithIndicators = BarObject & {
  ema9: number | null;
  ema21: number | null;
  macd: number | null | undefined;
  macdSignal: number | null | undefined;
  rsi: number | null;
};

type BarObjectWithSignals = BarObjectWithIndicators & {
  signal: number;
};

export async function placeOrder(data: BarObjectWithSignals[]) {
  log('placing order');
  const capital = await getBuyingPower();
  log(`current capital: ${capital}`);
  const lastBar = data[data.length - 1];
  log(`last bar: ${JSON.stringify(lastBar, null, 2)}`);
  // buy signal
  if (lastBar.signal === 1) {
    const qty = parseFloat((capital / lastBar.close).toFixed(0));
    log(`Placing buy order for ${qty} shares of ${CRYPTO_SYMBOL}`);
    if (qty > 0) {
      const buyOrder = await alpaca.createOrder({
        symbol: CRYPTO_SYMBOL,
        qty: qty,
        side: 'buy',
        type: 'market',
        time_in_force: 'day',
      });
      await waitForOrderFill(buyOrder.id);
      log(`buy order placed: ${JSON.stringify(buyOrder, null, 2)}`);
      const tslOrder = await alpaca.createOrder({
        symbol: CRYPTO_SYMBOL,
        qty: buyOrder.qty,
        side: 'sell',
        type: 'trailing_stop',
        trail_percent: 5,
        time_in_force: 'gtc',
      });
      log(
        `trailing stop loss order placed: ${JSON.stringify(tslOrder, null, 2)}`
      );
    }
  } else if (lastBar.signal === -1) {
    log('should sell');
    const positions = await alpaca.getPosition(CRYPTO_SYMBOL);
    log(`open positions: ${JSON.stringify(positions, null, 2)}`);
    if (positions) {
      log('cancelling all open orders');
      await alpaca.cancelAllOrders();
      log('closing all posiitons');
      await alpaca.closePosition(CRYPTO_SYMBOL);
    }
  }
}

const run = async () => {
  const data = await fetchHistoricalData(CRYPTO_SYMBOL);
  const dataWithIndicators = calculateIndicators(data);
  const dataWithSignals = generateSignals(dataWithIndicators);
  try {
    await placeOrder(dataWithSignals);
  } catch (error) {
    log(`Error placing order: ${error}`);
  }
};

export default run;
