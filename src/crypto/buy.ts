import { getBuyingPower } from '../account';
import alpaca from '../alpaca';
import { getBarsWithSignals } from '../bars';
import { AVAILABLE_CAPITAL_THRESHOLD } from '../constants';
import { error as errorLogger, log } from '../helpers';
import { waitForOrderFill } from '../order';
import { IS_DEV } from './constants';
import { AlpacaQuoteObject } from './types.d';

export const buySymbol = async (symbol: string, purchaseLength: number = 1) => {
  log(`evaluating buy signals for: ${symbol}`);
  const barWithSignals = await getBarsWithSignals(symbol);
  const { signals, lastIndicators } = barWithSignals;
  const shouldBuy = signals.buy;

  if (!shouldBuy) {
    log(`no buy signal for ${symbol}:`, { signals, lastIndicators });
    return;
  }

  const availableCapital = await getBuyingPower();
  const buyingPower = parseFloat(
    ((availableCapital / purchaseLength) * 0.975).toFixed(2)
  );
  if (buyingPower < AVAILABLE_CAPITAL_THRESHOLD) {
    log('no available capital');
    return;
  }

  // get latest quotes
  const latestQuote: Map<string, AlpacaQuoteObject> =
    await alpaca.getLatestCryptoQuotes([symbol]);
  if (!latestQuote.has(symbol)) {
    errorLogger(`no latest quote for ${symbol}`);
    return;
  }

  const { AskPrice: latestAskPrice, BidPrice: latestBidPrice } =
    latestQuote.get(symbol) as AlpacaQuoteObject;
  const limitPrice = parseFloat(
    ((latestAskPrice - latestBidPrice) / 2 + latestBidPrice).toFixed(2)
  );
  let qty = parseFloat((availableCapital / limitPrice).toFixed(2));
  const costBasis = parseFloat((qty * limitPrice).toFixed(2));
  if (costBasis > availableCapital) {
    qty = parseFloat((buyingPower / limitPrice).toFixed(2));
  }

  if (costBasis < 1) {
    log(`cost basis less than 1 for ${symbol}: ${costBasis}`);
    return;
  }

  // place buy order
  try {
    const buyConfig = {
      symbol: symbol,
      qty: qty,
      side: 'buy',
      type: 'market',
      // limit_price: limitPrice,
      time_in_force: 'gtc',
    };
    log(`Placing buy order for ${qty} shares of ${symbol}:`, buyConfig);
    if (!IS_DEV) {
      await alpaca.cancelAllOrders();
      const buyOrder = await alpaca.createOrder(buyConfig);
      if (buyConfig.type === 'market') {
        await waitForOrderFill(buyOrder.id);
      }
    }
    log(`buy order for ${symbol} completed successfully`);
  } catch (error: any) {
    errorLogger(`error placing buy order for ${symbol}`, error?.response?.data);
  }
};

export const buySymbols = async (symbols: string[]) => {
  for (const symbol of symbols) {
    await buySymbol(symbol, symbols.length);
  }
};
