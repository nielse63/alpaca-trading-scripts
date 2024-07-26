import { getBuyingPower } from '../account';
import alpaca from '../alpaca';
import { getBarsWithSignals } from '../bars';
import { AVAILABLE_CAPITAL_THRESHOLD } from '../constants';
import { error as errorLogger, log } from '../helpers';
import { waitForOrderFill } from '../order';
import { IS_DEV } from './constants';
import { createStopLimitSellOrder, deleteBuyOrdersForSymbol } from './orders';
import { AlpacaQuoteObject } from './types.d';

export const buySymbol = async (symbol: string, buyingPower: number) => {
  // log(`evaluating buy signals for: ${symbol}`);
  // const barWithSignals = await getBarsWithSignals(symbol);
  // const { signals } = barWithSignals;
  // const shouldBuy = signals.buy;

  // log(`signals for ${symbol}:`, signals);
  // if (!shouldBuy) {
  //   return;
  // }

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
    const buyQty = parseFloat(qty.toFixed(4));
    const buyConfig = {
      symbol: symbol,
      qty: buyQty,
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
      log(`buy order for ${symbol} created:`, buyOrder);
      if (buyConfig.type === 'market') {
        const {
          filled_qty: buyFilledQty,
          filled_avg_price: buyFilledAvgPrice,
        } = await waitForOrderFill(buyOrder.id);
        const filledQty = parseFloat(buyFilledQty) || buyQty;
        try {
          await createStopLimitSellOrder(
            symbol,
            filledQty,
            parseFloat(buyFilledAvgPrice)
          );
        } catch (e: any) {
          errorLogger(`error creating stop limit sell order for ${symbol}`, e);
        }
      }
    }
    log(`buy order for ${symbol} completed successfully`);
  } catch (error: any) {
    errorLogger(`error placing buy order for ${symbol}`, error?.response?.data);
  }
};

export const buySymbols = async (symbols: string[]) => {
  const maxBuyingPower = await getBuyingPower();
  if (maxBuyingPower < AVAILABLE_CAPITAL_THRESHOLD) {
    log('no available capital');
    return;
  }

  // evaluate if we can buy
  const symbolsToBuy = [];
  for (const symbol of symbols) {
    log(`evaluating buy signals for: ${symbol}`);
    const barWithSignals = await getBarsWithSignals(symbol);
    const { signals } = barWithSignals;
    const shouldBuy = signals.buy;

    log(`signals for ${symbol}:`, signals);
    if (shouldBuy) {
      symbolsToBuy.push(symbol);
    }
  }

  if (!symbolsToBuy.length) {
    log('no symbols to buy - stopping execution');
    return;
  }

  // calculate buying power per symbol
  const buyingPower = (maxBuyingPower * 0.975) / symbolsToBuy.length;
  log(`buying power per symbol: ${buyingPower}`);

  // buy symbols
  for (const symbol of symbolsToBuy) {
    try {
      await deleteBuyOrdersForSymbol(symbol);
    } catch (error) {
      errorLogger(`error deleting buy orders for ${symbol}`, error);
    }
    try {
      await buySymbol(symbol, buyingPower);
    } catch (error) {
      errorLogger(`error buying ${symbol}`, error);
    }
  }
};
