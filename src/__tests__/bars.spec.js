const last = require('lodash/last');
const getBars = require('../bars');
const alpaca = require('../alpaca');
const MOCK_BAR = require('../__fixtures__/bar');

describe('bars', () => {
  let getCryptoBarsMock;

  beforeEach(() => {
    getCryptoBarsMock = jest
      .spyOn(alpaca, 'getCryptoBars')
      .mockImplementation(async function* mock() {
        const bars = [];
        let i = 0;
        while (i < 100) {
          i += 1;
          bars.push(MOCK_BAR);
        }
        // eslint-disable-next-line no-restricted-syntax
        for await (const bar of bars) {
          yield bar;
        }
      });
  });

  // describe('formatBar', () => {
  //   it('should convert timestamp to date', () => {
  //     const bar = formatBar(MOCK_BAR);
  //     expect(bar.Timestamp).toBeDate();
  //   });
  // });

  // describe('getCryptoBars', () => {
  //   it('should get bars', async () => {
  //     const bars = await getCryptoBars(MOCK_BAR.Symbol);
  //     expect(bars).toBeArray();
  //     expect(bars[0]).toBeObject();
  //     expect(getCryptoBarsMock).toHaveBeenCalledOnce();
  //   });
  // });

  describe('getBars', () => {
    it('should get data array', async () => {
      const bars = await getBars(MOCK_BAR.Symbol);
      expect(bars).toBeArray();
      expect(getCryptoBarsMock).toHaveBeenCalledOnce();
      // expect(data).toBeObject();
      // expect(data).toContainAllKeys(['bars', 'values', 'smaFast', 'smaSlow']);
      // expect(data.bars).toBeArray();
      // expect(data.values).toBeArray();
      // expect(data.smaFast).toBeArray();
      // expect(data.smaSlow).toBeArray();
    });

    it('should have null smaFast and smaSlow values in first object', async () => {
      const [bar] = await getBars(MOCK_BAR.Symbol);
      expect(bar.SMA.fast).toBeNull();
      expect(bar.SMA.slow).toBeNull();
    });

    it('should have valid sma values in last object', async () => {
      const bars = await getBars(MOCK_BAR.Symbol);
      const bar = last(bars);
      expect(bar.SMA.fast).not.toBeNull();
      expect(bar.SMA.slow).not.toBeNull();
    });
  });
});
