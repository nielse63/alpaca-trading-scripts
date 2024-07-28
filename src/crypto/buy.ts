import { getBuyingPower } from '../account';
import alpaca from '../alpaca';
import { getBarsWithSignals } from '../bars';
import { AVAILABLE_CAPITAL_THRESHOLD } from '../constants';
import { error as errorLogger, log } from '../helpers';
import { waitForOrderFill } from '../order';
import { IS_DEV } from './constants';
import {
  // createStopLimitSellOrder,
  deleteBuyOrdersForSymbol,
  deleteSellOrdersForSymbol,
  updateStopLimitSellOrder,
} from './orders';
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

  const { BidPrice: bidPrice } = latestQuote.get(symbol) as AlpacaQuoteObject;
  // const limitPrice = (askPrice - bidPrice) / 2 + bidPrice;
  // console.log({ symbol, bidPrice, latestBidPrice, limitPrice });
  const qty = buyingPower / bidPrice;
  const costBasis = qty * bidPrice;

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
      // limit_price: limitPrice,
      time_in_force: 'gtc',
      position_intent: 'buy_to_open',
    };
    log(
      `Placing buy order for ${buyConfig.qty} shares of ${symbol}:`,
      buyConfig
    );
    if (!IS_DEV) {
      const buyOrder = await alpaca.createOrder(buyConfig);
      log(`buy order for ${symbol} created:`);
      if (buyConfig.type === 'market') {
        await waitForOrderFill(buyOrder.id);
        await deleteSellOrdersForSymbol(symbol);
        // const { qty: buyFilledQty, avg_entry_price: buyFilledAvgPrice } =
        //   await alpaca.getPosition(symbol.replace('/', ''));
        try {
          await updateStopLimitSellOrder(symbol);
        } catch (e: any) {
          errorLogger(
            `error creating stop limit sell order for ${symbol}`,
            e?.response?.data
          );
        }
      }
    }
    log(`buy order for ${symbol} completed successfully`);
  } catch (error: any) {
    errorLogger(`error placing buy order for ${symbol}`, error?.response?.data);
  }
};

export const buySymbols = async (symbols: string[]) => {
  // close open buy orders for all symbols
  const deletePromises = symbols.map((symbol) =>
    deleteBuyOrdersForSymbol(symbol)
  );
  try {
    await Promise.all(deletePromises);
  } catch (error: any) {
    errorLogger(
      'error deleting buy orders for all symbols',
      error?.response?.data
    );
  }

  // calculate buying power per symbol
  const maxBuyingPower = await getBuyingPower();
  if (maxBuyingPower < AVAILABLE_CAPITAL_THRESHOLD) {
    log('not enough capital to buy - stopping execution');
    return;
  }

  // evaluate if we can buy
  const barPromises = symbols.map((symbol) => getBarsWithSignals(symbol));
  const barsWithSignals = await Promise.all(barPromises);
  const symbolsToBuy = barsWithSignals
    .filter((bar) => bar.signals.buy)
    .map((bar) => bar.symbol);

  if (!symbolsToBuy.length) {
    log('no symbols to buy - stopping execution');
    return;
  }

  log(`symbols to buy: ${symbolsToBuy.join(', ')}`);

  // calculate buying power per symbol
  const buyingPower = maxBuyingPower / symbolsToBuy.length;
  log(`buying power per symbol: ${buyingPower}`);

  if (buyingPower < AVAILABLE_CAPITAL_THRESHOLD) {
    log('not enough capital to buy - stopping execution');
    return;
  }

  // buy symbols
  for (const symbol of symbolsToBuy) {
    try {
      await buySymbol(symbol, buyingPower);
    } catch (error) {
      errorLogger(`error buying ${symbol}`, error);
    }
  }
};
