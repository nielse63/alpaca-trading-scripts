import moment from 'moment';
import business from 'moment-business';
import mockAccount from '../../src/__fixtures__/account';
import mockBars from '../../src/__fixtures__/bars';
import mockPositions from '../../src/__fixtures__/positions';

class Alpaca {
  constructor(config = {}) {
    this.keyId = config.keyId;
    this.secretKey = config.secretKey;
    this.paper = config.paper;
  }

  getAccount() {
    return new Promise((resolve) => {
      resolve(mockAccount);
    });
  }

  *getBarsV2() {
    const calender = this.getCalendar();
    for (let object of calender) {
      // TODO: set dynamic values for better testing
      const bar = {
        Timestamp: `${object.date}T05:00:00Z`,
        OpenPrice: 256.88,
        HighPrice: 256.94,
        LowPrice: 256.85,
        ClosePrice: 256.87,
        Volume: 3557,
        TradeCount: 50,
        VWAP: 256.8893,
      };
      yield bar;
    }
  }

  getClock() {
    return {
      timestamp: '2023-02-08T11:57:15.905021285-05:00',
      is_open: true,
      next_open: '2023-02-09T09:30:00-05:00',
      next_close: '2023-02-08T16:00:00-05:00',
    };
  }

  getCalendar() {
    const days = 365;
    const startDate = moment().subtract(days, 'days');
    const currentDay = startDate.clone();
    let output = [];
    let i = 0;
    while (i < days) {
      if (business.isWeekDay(currentDay)) {
        output.push({
          date: currentDay.format('YYYY-MM-DD'),
          open: '09:30',
          close: '16:00',
          session_open: '0400',
          session_close: '2000',
        });
      }
      currentDay.add(1, 'day');
      i += 1;
    }
    return output;
  }

  getLatestBar() {
    return new Promise((resolve) => {
      const lastBar = mockBars[mockBars.length - 1];
      lastBar.Timestamp = `${moment().format('YYYY-MM-DD')}T05:00:00Z`;
      resolve(lastBar);
    });
  }

  getPositions() {
    return new Promise((resolve) => {
      resolve(mockPositions);
    });
  }

  async cancelAllOrders() {
    return [];
  }

  async getOrder(orderId) {
    return {
      id: orderId,
      status: 'filled',
    };
  }

  async createOrder(order) {
    return {
      id: '62d63c55-d3b8-4b97-91c9-719710c675dd',
      client_order_id: 'f8f53b80-389f-43e0-a948-b9e3df694f8f',
      created_at: '2023-02-06T22:05:40.640649Z',
      updated_at: '2023-02-06T22:05:40.640649Z',
      submitted_at: '2023-02-06T22:05:40.640165Z',
      filled_at: null,
      expired_at: null,
      canceled_at: null,
      failed_at: null,
      replaced_at: null,
      replaced_by: null,
      replaces: null,
      asset_id: 'b6d1aa75-5c9c-4353-a305-9e2caa1925ab',
      symbol: order.symbol,
      asset_class: 'us_equity',
      notional: order?.notional || null,
      qty: order?.qty || null,
      filled_qty: '0',
      filled_avg_price: null,
      order_class: '',
      order_type: 'market',
      type: 'market',
      side: order.side,
      time_in_force: order.time_in_force,
      limit_price: null,
      stop_price: null,
      status: 'accepted',
      extended_hours: false,
      legs: null,
      trail_percent: null,
      trail_price: null,
      hwm: null,
      subtag: null,
      source: null,
    };
  }

  async closePosition(symbol) {
    return {
      message: 'Position is being liquidated',
      symbol,
    };
  }
}

export default Alpaca;
