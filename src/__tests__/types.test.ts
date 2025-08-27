import { convertType, extractConstraints } from '../types';

describe('Types Module', () => {
  describe('convertType', () => {
    it('should convert UUID type correctly', () => {
      const result = convertType('UUID');
      expect(result).toEqual({ type: 'string', format: 'uuid' });
    });

    it('should convert date-time type correctly', () => {
      const result = convertType('datetime');
      expect(result).toEqual({ type: 'string', format: 'date-time' });
    });

    it('should convert date type correctly', () => {
      const result = convertType('date');
      expect(result).toEqual({ type: 'string', format: 'date' });
    });

    it('should convert number type correctly', () => {
      const result = convertType('number');
      expect(result).toEqual({ type: 'number', format: 'double' });
    });

    it('should convert string type correctly', () => {
      const result = convertType('string');
      expect(result).toEqual({ type: 'string' });
    });

    it('should default to string for unknown types', () => {
      const result = convertType('unknown');
      expect(result).toEqual({ type: 'string' });
    });

    it('should handle case insensitive input', () => {
      const result = convertType('STRING');
      expect(result).toEqual({ type: 'string' });
    });
  });

  describe('extractConstraints', () => {
    it('should extract maxLength from string with parentheses', () => {
      const result = extractConstraints('String (50)');
      expect(result).toEqual({ maxLength: 50 });
    });

    it('should extract maxLength from number with parentheses', () => {
      const result = extractConstraints('Number (100)');
      expect(result).toEqual({ maxLength: 100 });
    });

    it('should return empty object when no constraints present', () => {
      const result = extractConstraints('String');
      expect(result).toEqual({});
    });

    it('should handle multiple numbers and extract first', () => {
      const result = extractConstraints('String (25) something (50)');
      expect(result).toEqual({ maxLength: 25 });
    });
  });
});