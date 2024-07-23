import { getBuyingPower } from '../account';
import alpaca from '../alpaca';
import { log } from '../helpers';
import { waitForOrderFill } from '../order';
import {
  calculateIndicators,
  CRYPTO_UNIVERSE,
  fetchHistoricalData,
  generateSignals,
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

type AlpacaPosition = {
  asset_id: string;
  symbol: string;
  exchange: string;
  asset_class: string;
  asset_marginable: boolean;
  qty: string;
  avg_entry_price: string;
  side: string;
  market_value: string;
  cost_basis: string;
  unrealized_pl: string;
  unrealized_plpc: string;
  unrealized_intraday_pl: string;
  unrealized_intraday_plpc: string;
  current_price: string;
  lastday_price: string;
  change_today: string;
  qty_available: string;
};

export async function placeOrder(data: BarObjectWithSignals[], symbol: string) {
  log(`placing order for ${symbol}`);
  const capital = await getBuyingPower();
  log(`current capital: ${capital}`);
  const lastBar = data[data.length - 1];
  log(`last bar: ${JSON.stringify({ ...lastBar, symbol }, null, 2)}`);
  // buy signal
  if (lastBar.signal === 1) {
    const qty = parseFloat((capital / lastBar.close).toFixed(0));
    log(`Placing buy order for ${qty} shares of ${symbol}`);
    if (qty > 0) {
      const buyOrder = await alpaca.createOrder({
        symbol: symbol,
        qty: qty,
        side: 'buy',
        type: 'market',
        time_in_force: 'day',
      });
      await waitForOrderFill(buyOrder.id);
      log(`buy order placed: ${JSON.stringify(buyOrder, null, 2)}`);
      const tslOrder = await alpaca.createOrder({
        symbol: symbol,
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
    log(`should sell ${symbol}`);
    const positions = await alpaca.getPosition(symbol);
    log(`open positions: ${JSON.stringify(positions, null, 2)}`);
    if (positions) {
      log('cancelling all open orders');
      await alpaca.cancelAllOrders();
      log(`closing all posiitons for ${symbol}`);
      await alpaca.closePosition(symbol);
    }
  }
  console.log('');
}

const runForSymbol = async (symbol: string) => {
  const data = await fetchHistoricalData(symbol);
  const dataWithIndicators = calculateIndicators(data);
  const dataWithSignals = generateSignals(dataWithIndicators);
  try {
    await placeOrder(dataWithSignals, symbol);
  } catch (error) {
    log(`Error placing order: ${error}`);
  }
};

const run = async () => {
  const positions = await alpaca.getPositions();
  const crypotPositions = positions
    .filter((position: AlpacaPosition) => {
      return position.asset_class === 'crypto';
    })
    .map((position: AlpacaPosition) => {
      return {
        ...position,
        symbol: position.symbol.replace('USD', '/USD'),
      };
    });

  // determine if we need to sell open positions
  for (const position of crypotPositions) {
    const { symbol } = position;
    const data = await fetchHistoricalData(symbol);
    const dataWithIndicators = calculateIndicators(data);
    const dataWithSignals = generateSignals(dataWithIndicators);
    const lastBar = dataWithSignals[data.length - 1];
    if (lastBar.signal === -1) {
      log(`closing all posiitons for ${symbol}`);
      await alpaca.closePosition(symbol);
    }
  }

  for (const symbol of CRYPTO_UNIVERSE) {
    await runForSymbol(symbol);
  }
};

// run().catch(console.error);

export default run;
