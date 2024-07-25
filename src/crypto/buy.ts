import { getBuyingPower } from '../account';
import alpaca from '../alpaca';
import { getBarsWithSignals } from '../bars';
import { AVAILABLE_CAPITAL_THRESHOLD } from '../constants';
import { error as errorLogger, log } from '../helpers';
import { waitForOrderFill } from '../order';
import { IS_DEV } from './constants';
import { AlpacaQuoteObject } from './types.d';
import { deleteBuyOrdersForSymbol } from './orders';

export const buySymbol = async (symbol: string, buyingPower: number) => {
  log(`evaluating buy signals for: ${symbol}`);
  const barWithSignals = await getBarsWithSignals(symbol);
  const { signals } = barWithSignals;
  const shouldBuy = signals.buy;

  log(`signals for ${symbol}:`, signals);
  if (!shouldBuy) {
    return;
  }

  // const availableCapital = await getBuyingPower();
  // const buyingPower = parseFloat(
  //   ((availableCapital / purchaseLength) * 0.975).toFixed(2)
  // );

  // get latest quotes
  const latestQuote: Map<string, AlpacaQuoteObject> =
    await alpaca.getLatestCryptoQuotes([symbol]);
  if (!latestQuote.has(symbol)) {
    errorLogger(`no latest quote for ${symbol}`);
    return;
  }

  const { AskPrice: latestAskPrice } = latestQuote.get(
    symbol
  ) as AlpacaQuoteObject;
  // const limitPrice = (latestAskPrice - latestBidPrice) / 2 + latestBidPrice;
  // console.log({ symbol, latestAskPrice, latestBidPrice, limitPrice });
  const qty = buyingPower / latestAskPrice;
  const costBasis = qty * latestAskPrice;

  if (costBasis < 1) {
    log(`cost basis less than 1 for ${symbol}: ${costBasis}`);
    return;
  }

  // place buy order
  try {
    const buyConfig = {
      symbol: symbol,
      qty: parseFloat(qty.toFixed(4)),
      side: 'buy',
      type: 'market',
      time_in_force: 'gtc',
    };
    log(
      `Placing buy order for ${buyConfig.qty} shares of ${symbol}:`,
      buyConfig
    );
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
  const maxBuyingPower = await getBuyingPower();
  const buyingPower = (maxBuyingPower * 0.975) / symbols.length;
  log(`buying power per symbol: ${buyingPower}`);
  if (buyingPower < AVAILABLE_CAPITAL_THRESHOLD) {
    log('no available capital');
    return;
  }
  for (const symbol of symbols) {
    await deleteBuyOrdersForSymbol(symbol);
    await buySymbol(symbol, buyingPower);
  }
};
