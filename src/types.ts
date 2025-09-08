export interface TypeMapping {
  type: string;
  format?: string;
  isArray?: boolean;
  elementType?: string;
  elementFormat?: string;
}

export interface ConstraintInfo {
  maxLength?: number;
  precision?: number;
  scale?: number;
  minimum?: number;
  maximum?: number;
}

export function convertType(typeStr: string): TypeMapping {
  const normalizedType = typeStr.toLowerCase().trim();
  
  // Handle Array types first (e.g., "Array String (10)", "Array Object")
  if (normalizedType.includes('array')) {
    const arrayMatch = typeStr.match(/array\s+(.+)/i);
    if (arrayMatch) {
      const elementTypeStr = arrayMatch[1].trim();
      const elementTypeMapping = convertType(elementTypeStr);
      return {
        type: 'array',
        isArray: true,
        elementType: elementTypeMapping.type,
        elementFormat: elementTypeMapping.format
      };
    }
    // Fallback for simple "array" without element type
    return { type: 'array', isArray: true, elementType: 'string' };
  }
  
  // Handle UUID types
  if (normalizedType.includes('uuid')) {
    return { type: 'string', format: 'uuid' };
  }
  
  // Handle date and date-time types  
  if (normalizedType.includes('datetime') || (normalizedType.includes('date') && normalizedType.includes('time'))) {
    return { type: 'string', format: 'date-time' };
  }
  
  if (normalizedType.includes('date')) {
    return { type: 'string', format: 'date' };
  }
  
  // Handle decimal types (e.g., "Decimal (15,2)")
  if (normalizedType.includes('decimal')) {
    return { type: 'number', format: 'decimal' };
  }
  
  // Handle integer types (e.g., "Integer (3)")
  if (normalizedType.includes('integer') || normalizedType.includes('int')) {
    return { type: 'integer', format: 'int32' };
  }
  
  // Handle boolean types
  if (normalizedType.includes('boolean') || normalizedType.includes('bool')) {
    return { type: 'boolean' };
  }
  
  // Handle number types (general)
  if (normalizedType.includes('number') || normalizedType.includes('numeric')) {
    return { type: 'number', format: 'double' };
  }
  
  // Handle object types
  if (normalizedType.includes('object')) {
    return { type: 'object' };
  }
  
  // Handle string types (most common, including variations)
  if (normalizedType.includes('string') || normalizedType.includes('text') || normalizedType.includes('varchar')) {
    return { type: 'string' };
  }
  
  // Default to string for unknown types
  return { type: 'string' };
}

export function extractConstraints(typeStr: string): ConstraintInfo {
  const constraints: ConstraintInfo = {};
  
  // Handle Array types - extract constraints from element type
  const normalizedType = typeStr.toLowerCase();
  if (normalizedType.includes('array')) {
    const arrayMatch = typeStr.match(/array\s+(.+)/i);
    if (arrayMatch) {
      const elementTypeStr = arrayMatch[1].trim();
      // Recursively extract constraints from the element type
      return extractConstraints(elementTypeStr);
    }
    return constraints;
  }
  
  // Extract single number constraint (e.g., "String (50)" -> maxLength: 50)
  const singleNumberMatch = typeStr.match(/\((\d+)\)/);
  if (singleNumberMatch) {
    const value = parseInt(singleNumberMatch[1], 10);
    
    if (normalizedType.includes('string') || normalizedType.includes('text')) {
      constraints.maxLength = value;
    } else if (normalizedType.includes('integer')) {
      // For integers, the number often represents maximum digits
      constraints.maximum = Math.pow(10, value) - 1;
    }
  }
  
  // Extract decimal precision and scale (e.g., "Decimal (15,2)" -> precision: 15, scale: 2)
  const decimalMatch = typeStr.match(/\((\d+),\s*(\d+)\)/);
  if (decimalMatch) {
    constraints.precision = parseInt(decimalMatch[1], 10);
    constraints.scale = parseInt(decimalMatch[2], 10);
  }
  
  return constraints;
}

export function normalizeTypeString(typeStr: string): string {
  if (!typeStr) return '';
  
  // Clean up common issues
  let cleaned = typeStr.trim();
  
  // Handle multiple type definitions in one string (e.g., "String (1) String (20)")
  // Take the first complete type definition, including Array types like "Array String (10)"
  const typePattern = /^((?:\w+\s+)*\w+(?:\s*\([^)]+\))?)/;
  const match = cleaned.match(typePattern);
  if (match) {
    cleaned = match[1];
  }
  
  return cleaned;
}