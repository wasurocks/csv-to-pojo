import { convertType, extractConstraints, normalizeTypeString } from '../types';

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

  describe('convertType - enhanced types', () => {
    it('should convert Decimal type correctly', () => {
      const result = convertType('Decimal (15,2)');
      expect(result).toEqual({ type: 'number', format: 'decimal' });
    });

    it('should convert Integer type correctly', () => {
      const result = convertType('Integer (3)');
      expect(result).toEqual({ type: 'integer', format: 'int32' });
    });

    it('should convert Boolean type correctly', () => {
      const result = convertType('Boolean');
      expect(result).toEqual({ type: 'boolean' });
    });

    it('should convert Object type correctly', () => {
      const result = convertType('Object');
      expect(result).toEqual({ type: 'object' });
    });
  });

  describe('convertType - array types', () => {
    it('should convert Array String type correctly', () => {
      const result = convertType('Array String');
      expect(result).toEqual({ 
        type: 'array', 
        isArray: true, 
        elementType: 'string' 
      });
    });

    it('should convert Array String with constraints correctly', () => {
      const result = convertType('Array String (10)');
      expect(result).toEqual({ 
        type: 'array', 
        isArray: true, 
        elementType: 'string' 
      });
    });

    it('should convert Array Object correctly', () => {
      const result = convertType('Array Object');
      expect(result).toEqual({ 
        type: 'array', 
        isArray: true, 
        elementType: 'object' 
      });
    });

    it('should convert Array Number correctly', () => {
      const result = convertType('Array Number');
      expect(result).toEqual({ 
        type: 'array', 
        isArray: true, 
        elementType: 'number',
        elementFormat: 'double'
      });
    });

    it('should convert Array Boolean correctly', () => {
      const result = convertType('Array Boolean');
      expect(result).toEqual({ 
        type: 'array', 
        isArray: true, 
        elementType: 'boolean' 
      });
    });

    it('should convert Array Integer correctly', () => {
      const result = convertType('Array Integer (3)');
      expect(result).toEqual({ 
        type: 'array', 
        isArray: true, 
        elementType: 'integer',
        elementFormat: 'int32'
      });
    });

    it('should handle simple array without element type', () => {
      const result = convertType('Array');
      expect(result).toEqual({ 
        type: 'array', 
        isArray: true, 
        elementType: 'string' 
      });
    });

    it('should handle case insensitive array types', () => {
      const result = convertType('ARRAY STRING (50)');
      expect(result).toEqual({ 
        type: 'array', 
        isArray: true, 
        elementType: 'string' 
      });
    });
  });

  describe('extractConstraints', () => {
    it('should extract maxLength from string with parentheses', () => {
      const result = extractConstraints('String (50)');
      expect(result).toEqual({ maxLength: 50 });
    });

    it('should extract precision and scale from decimal', () => {
      const result = extractConstraints('Decimal (15,2)');
      expect(result).toEqual({ precision: 15, scale: 2 });
    });

    it('should return empty object when no constraints present', () => {
      const result = extractConstraints('String');
      expect(result).toEqual({});
    });

    it('should extract constraints from array element types', () => {
      const result = extractConstraints('Array String (10)');
      expect(result).toEqual({ maxLength: 10 });
    });

    it('should extract decimal constraints from array element types', () => {
      const result = extractConstraints('Array Decimal (15,2)');
      expect(result).toEqual({ precision: 15, scale: 2 });
    });

    it('should extract integer constraints from array element types', () => {
      const result = extractConstraints('Array Integer (3)');
      expect(result).toEqual({ maximum: 999 });
    });

    it('should handle array types without constraints', () => {
      const result = extractConstraints('Array String');
      expect(result).toEqual({});
    });
  });

  describe('normalizeTypeString', () => {
    it('should handle complex type strings', () => {
      const result = normalizeTypeString('String (1) String (20)');
      expect(result).toBe('String (1)');
    });

    it('should trim whitespace', () => {
      const result = normalizeTypeString('  String (50)  ');
      expect(result).toBe('String (50)');
    });

    it('should handle empty strings', () => {
      const result = normalizeTypeString('');
      expect(result).toBe('');
    });
  });
});