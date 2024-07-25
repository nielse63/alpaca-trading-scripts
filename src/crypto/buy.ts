import { getBuyingPower } from '../account';
import alpaca from '../alpaca';
import { getBarsWithSignals } from '../bars';
import { AVAILABLE_CAPITAL_THRESHOLD } from '../constants';
import { error as errorLogger, log } from '../helpers';
import { waitForOrderFill } from '../order';
import { IS_DEV } from './constants';
import { AlpacaQuoteObject } from './types.d';

export const buySymbol = async (symbol: string) => {
  log(`attempting to buy symbol: ${symbol}`);
  const barWithSignals = await getBarsWithSignals(symbol);
  const { signals, lastIndicators } = barWithSignals;
  const shouldBuy = signals.buy;

  if (!shouldBuy) {
    log(`no buy signal for ${symbol}:`, { signals, lastIndicators });
    return;
  }

  const availableCapital = await getBuyingPower();
  const buyingPower = parseFloat((availableCapital * 0.95).toFixed(2));
  if (buyingPower < AVAILABLE_CAPITAL_THRESHOLD) {
    log('no available capital');
    return;
  }

  // get latest quotes
  const latestQuote: Map<string, AlpacaQuoteObject> =
    await alpaca.getLatestCryptoQuotes([symbol]);

  const latestAskPrice = latestQuote.has(symbol)
    ? latestQuote.get(symbol)?.AskPrice
    : undefined;
  if (!latestAskPrice) {
    errorLogger(`no latest bid price for ${symbol}`);
    return;
  }
  let qty = parseFloat((availableCapital / latestAskPrice).toFixed(2));
  const costBasis = parseFloat((qty * latestAskPrice).toFixed(2));
  if (costBasis > availableCapital) {
    qty = parseFloat((buyingPower / latestAskPrice).toFixed(2));
  }

  if (costBasis < 1) {
    log(`cost basis less than 1 for ${symbol}: ${costBasis}`);
    return;
  }

  // place buy order
  try {
    log(`Placing buy order for ${qty} shares of ${symbol}`);
    if (!IS_DEV) {
      const buyOrder = await alpaca.createOrder({
        symbol: symbol,
        qty: qty,
        side: 'buy',
        type: 'limit',
        limit_price: latestAskPrice,
        time_in_force: 'ioc',
      });
      await waitForOrderFill(buyOrder.id);
    }
    log(`buy order for ${symbol} completed successfully`);
  } catch (error: any) {
    errorLogger(`error placing buy order for ${symbol}`, error?.response?.data);
  }
};

export const buySymbols = async (symbols: string[]) => {
  for (const symbol of symbols) {
    await buySymbol(symbol);
  }
};
