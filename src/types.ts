export interface TypeMapping {
  type: string;
  format?: string;
}

export interface ConstraintInfo {
  maxLength?: number;
}

export function convertType(typeStr: string): TypeMapping {
  const normalizedType = typeStr.toLowerCase();
  
  if (normalizedType.includes('uuid')) {
    return { type: 'string', format: 'uuid' };
  }
  
  if (normalizedType.includes('date') && normalizedType.includes('time')) {
    return { type: 'string', format: 'date-time' };
  }
  
  if (normalizedType.includes('date')) {
    return { type: 'string', format: 'date' };
  }
  
  if (normalizedType.includes('number')) {
    return { type: 'number', format: 'double' };
  }
  
  if (normalizedType.includes('string')) {
    return { type: 'string' };
  }
  
  return { type: 'string' };
}

export function extractConstraints(typeStr: string): ConstraintInfo {
  const match = typeStr.match(/\((\d+)\)/);
  return match ? { maxLength: parseInt(match[1], 10) } : {};
}