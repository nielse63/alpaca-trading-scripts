import { isNumeric, parseResponseObject } from '../helpers';
import MockAccount from '../__fixtures__/account';
import { AlpacaAccount } from '../types';

describe('helpers', () => {
  describe('isNumeric', () => {
    it('should return true for numeric strings', () => {
      expect(isNumeric('123')).toBeTrue();
      expect(isNumeric('0')).toBeTrue();
      expect(isNumeric('-1')).toBeTrue();
      expect(isNumeric('1.5')).toBeTrue();
      expect(isNumeric('0.5')).toBeTrue();
    });

    it('should return false for non-numeric strings', () => {
      expect(isNumeric('howdy')).toBeFalse();
      expect(isNumeric('')).toBeFalse();
    });

    it('should return false for non-strings', () => {
      expect(isNumeric(null)).toBeFalse();
      expect(isNumeric({})).toBeFalse();
    });
  });

  describe('parseResponseObject', () => {
    it('should return an object', () => {
      expect(parseResponseObject({})).toBeObject();
    });

    it('should convert numeric string values to numbers', () => {
      const output: AlpacaAccount = parseResponseObject(MockAccount);
      expect(output.buying_power).toBeNumber();
    });

    it('should not alter non-numeric strings and non-string values', () => {
      const output: AlpacaAccount = parseResponseObject(MockAccount);
      expect(output.id).toBeString();
      expect(output.pattern_day_trader).toBeBoolean();
    });
  });
});
