require('dotenv').config();
const { onRequest } = require('firebase-functions/v2/https');
const logger = require('firebase-functions/logger');
const Alpaca = require('@alpacahq/alpaca-trade-api');
const axios = require('axios');

const alpaca = new Alpaca({
  keyId: process.env.ALPACA_KEY,
  secretKey: process.env.ALPACA_SECRET,
  paper: process.env.ALPACA_URL?.includes('paper'),
});

const formatSymbol = (symbol) =>
  !symbol.includes('/') ? symbol.replace(/USD$/, '/USD') : symbol;

const toDecimal = (value, points = 2) => {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  return parseFloat(`${numericValue.toFixed(points)}`);
};

const getBuyingPower = async () => {
  const account = await alpaca.getAccount();
  return parseFloat(account.non_marginable_buying_power);
};

const getPositionForSymbol = async (symbol) => {
  try {
    const position = await alpaca.getPosition(symbol.replace('/', ''));
    return position;
  } catch (error) {
    return null;
  }
};

const getOrdersForSymbol = async (symbol, config = {}) => {
  const options = {
    status: 'open',
    nested: true,
    symbols: formatSymbol(symbol),
    ...config,
  };
  logger.info('alpaca.getOrders options', JSON.stringify(options));
  const orders = await alpaca.getOrders(options);
  return orders;
};

const getCryptoSnapshot = async (symbol) => {
  const url = 'https://data.alpaca.markets/v1beta3/crypto/us/snapshots';
  const {
    data: { snapshots: data },
  } = await axios({
    method: 'get',
    url,
    params: {
      symbols: symbol,
    },
  });
  return data[symbol];
};

const getMidPrice = (snapshot) => {
  const { latestQuote } = snapshot;
  const { ap: askPrice, bp: bidPrice } = latestQuote;
  return toDecimal((askPrice + bidPrice) / 2, 4);
};

const closeOrdersForSymbol = async (symbol) => {
  const orders = await getOrdersForSymbol(symbol);
  const orderIds = orders.map((order) => order.id);
  const promises = orderIds.map((id) => alpaca.cancelOrder(id));
  try {
    await Promise.all(promises);
    return orderIds;
  } catch (error) {
    console.error(error);
  }
  return [];
};

const createBuyOrder = async (symbol) => {
  const maxBuyingPower = await getBuyingPower();
  const snapshot = await getCryptoSnapshot(symbol);
  const price = getMidPrice(snapshot);
  const buyingPower = maxBuyingPower * 0.99;
  const qty = toDecimal(buyingPower / price, 4);
  const options = {
    side: 'buy',
    symbol,
    // type: 'market',
    // notional: buyingPower,
    type: 'limit',
    limit_price: price,
    qty,
    time_in_force: 'gtc',
    position_intent: 'buy_to_open',
  };
  logger.info('alpaca.createOrder options:', JSON.stringify(options));
  // return options;
  const order = await alpaca.createOrder(options);
  return order;
};

const createSellOrder = async (symbol) => {
  const position = await getPositionForSymbol(symbol);
  if (!position) {
    return null;
  }
  const snapshot = await getCryptoSnapshot(symbol);
  const price = getMidPrice(snapshot);
  const qty = parseFloat(position.qty);
  const options = {
    side: 'sell',
    type: 'limit',
    limit_price: price,
    time_in_force: 'gtc',
    symbol,
    position_intent: 'sell_to_close',
    qty,
  };
  logger.info('alpaca.createOrder options:', JSON.stringify(options));
  // return options;
  const order = await alpaca.createOrder(options);
  return order;
};

const createOrder = async (symbol, side, price) => {
  if (side === 'buy') {
    return createBuyOrder(formatSymbol(symbol), price);
  }
  return createSellOrder(formatSymbol(symbol), price);
};

exports.orders = onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'method not allowed' });
  }
  logger.info('orders request body:', JSON.stringify(req.body));
  const { body } = req;
  const { symbol, side, price = null } = body;
  if (!symbol) {
    return res.status(400).json({ message: 'symbol is required' });
  }
  if (!side) {
    return res.status(400).json({ message: 'symbol is required' });
  }

  const output = {
    buying_power: null,
    cancelled_orders: [],
    order: null,
  };

  // check buying power
  try {
    const buyingPower = await getBuyingPower();
    output.buying_power = buyingPower;
    if (buyingPower <= 5) {
      return res.status(400).json({ message: 'insufficient buying power' });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message, block: 'getBuyingPower', error });
  }

  // cancel open buy orders
  try {
    output.cancelled_orders = await closeOrdersForSymbol(symbol, 'buy');
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message, block: 'closeOrdersForSymbol', error });
  }

  // place new order
  try {
    const order = await createOrder(symbol, side, price);
    output.order = order;
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message, block: 'createOrder', error });
  }

  return res.json(output);
});
