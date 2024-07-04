import { SYMBOL } from './constants';
import { AlpacaAccount, AlpacaPosition, IBar } from './types.d';
import Alpaca from '@alpacahq/alpaca-trade-api';
import alpaca from './alpaca';
import { getBars, getCurrentPrice } from './bars';
import { getPositions, hasLongPosition, hasShortPosition } from './position';
import { waitForOrderFill } from './order';
import { log } from './helpers';
// import { getBuyingPower } from "./account";

const TREND_DIRECTION = {
  UP: 'UP',
  DOWN: 'DOWN',
};

class TradingStrategy {
  bars: IBar[];
  account: AlpacaAccount;
  positions: AlpacaPosition[];
  alpaca: Alpaca;
  trendDirection: string;
  isLong: boolean;
  isShort: boolean;

  constructor(account: AlpacaAccount) {
    this.bars = [];
    this.account = account;
    this.positions = [];
    this.alpaca = alpaca;
    this.trendDirection = '';
    this.isLong = false;
    this.isShort = false;
  }

  async getData() {
    this.bars = await getBars();
    this.positions = await getPositions();
    this.trendDirection = await this.getTrendDirection();
    this.isLong = await hasLongPosition();
    this.isShort = await hasShortPosition();
  }

  async getTrendDirection() {
    const lastBar = this.bars[this.bars.length - 1];
    if (lastBar.ema.fast > lastBar.ema.slow) {
      return TREND_DIRECTION.UP;
    }
    return TREND_DIRECTION.DOWN;
  }

  async shouldEnterLong() {
    const lastPrice = await getCurrentPrice();
    return (
      this.trendDirection === TREND_DIRECTION.UP &&
      this.account.buying_power > lastPrice
    );
  }

  async shouldExitLong() {
    return this.isLong && this.trendDirection === TREND_DIRECTION.DOWN;
  }

  async shouldEnterShort() {
    const canShort =
      this.account.shorting_enabled && this.account.initial_margin > 0;
    return canShort && this.trendDirection === TREND_DIRECTION.DOWN;
  }

  async shouldExitShort() {
    return this.isShort && this.trendDirection === TREND_DIRECTION.UP;
  }

  async exitShort() {
    const shortPosition = this.positions.find(
      (position) => position.side === 'short' && position.symbol === SYMBOL
    );
    if (!shortPosition) {
      return;
    }
    await this.alpaca.closePosition(SYMBOL);
  }

  async enterLong() {
    await this.alpaca.cancelAllOrders();
    await this.exitShort();
    const buyingPower = this.account.cash;
    const currentPrice = await getCurrentPrice();
    const qty = Math.floor(buyingPower / currentPrice);
    if (qty < 1) {
      log('[info] not enough buying power');
      return;
    }
    log('[info] buying', qty, 'of', SYMBOL, 'at', currentPrice);
    const buyOrder = await this.alpaca.createOrder({
      symbol: SYMBOL,
      qty: qty,
      side: 'buy',
      type: 'limit',
      time_in_force: 'day',
      limit_price: currentPrice,
      order_class: 'oto',
      stop_loss: {
        stop_price: currentPrice * 0.985,
      },
    });
    log('[info] buy order:', buyOrder);
    await waitForOrderFill(buyOrder.id);
  }

  async run() {
    await this.getData();
    // if(await this.shouldEnterLong()) {
    //   await this.enterLong();
    // } else if(await this.shouldExitLong()) {
    //   await this.exitLong();
    // } else if(await this.shouldEnterShort()) {
    //   await this.enterShort();
    // } else if(await this.shouldExitShort()) {
    //   await this.exitShort();
    // }
  }
}

export default TradingStrategy;
