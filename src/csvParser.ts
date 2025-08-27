import Papa from 'papaparse';
import { convertType, extractConstraints } from './types';

export interface CSVRow {
  'Field name': string;
  'Type': string;
  'M/O/C': string;
  'Description': string;
  'Mapping': string;
}

export interface OpenAPISchema {
  type: string;
  properties: Record<string, any>;
  required?: string[];
}

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
  };
  paths: Record<string, any>;
  components: {
    schemas: Record<string, OpenAPISchema>;
  };
}

function toPascalCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function buildOpenAPIFromCSV(
  csvData: string,
  title: string = 'Generated API',
  version: string = '1.0.0'
): OpenAPISpec {
  const parseResult = Papa.parse<CSVRow>(csvData, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim().replace(/^\uFEFF/, ''),
  });

  // Only throw on fatal errors, not warnings
  const fatalErrors = parseResult.errors.filter((e: any) => e.type === 'Quotes');
  if (fatalErrors.length > 0) {
    throw new Error(`CSV parsing failed: ${fatalErrors.map((e: any) => e.message).join(', ')}`);
  }

  const schemas: Record<string, OpenAPISchema> = {};

  for (const row of parseResult.data) {
    const path = row['Field name']?.trim();
    const typeStr = row['Type']?.trim();
    const requiredness = row['M/O/C']?.trim();
    const description = row['Description']?.trim();

    if (!path || !typeStr || path.toLowerCase() === 'header' || path.toLowerCase() === 'body') {
      continue;
    }

    const keys = path.split('.');
    const pascalKeys = keys.map(toPascalCase);

    // Create schema for each object in the path
    for (let i = 0; i < keys.length; i++) {
      const schemaName = pascalKeys.slice(0, i + 1).join('');
      if (!schemas[schemaName]) {
        schemas[schemaName] = {
          type: 'object',
          properties: {},
          required: [],
        };
      }
    }

    // Skip if this is an object field
    if (typeStr?.toLowerCase() === 'object') {
      continue;
    }

    // Add property to the parent schema
    const parentSchemaName = pascalKeys.slice(0, -1).join('');
    const fieldName = keys[keys.length - 1];
    
    if (parentSchemaName && schemas[parentSchemaName]) {
      const typeMapping = convertType(typeStr);
      const constraints = extractConstraints(typeStr);
      
      const propSchema: any = { type: typeMapping.type };
      
      if (description) {
        propSchema.description = description;
      }
      
      if (typeMapping.format) {
        propSchema.format = typeMapping.format;
      }
      
      if (constraints.maxLength && typeMapping.type === 'string') {
        propSchema.maxLength = constraints.maxLength;
      }
      
      schemas[parentSchemaName].properties[fieldName] = propSchema;
      
      if (requiredness === 'M') {
        if (!schemas[parentSchemaName].required) {
          schemas[parentSchemaName].required = [];
        }
        if (!schemas[parentSchemaName].required!.includes(fieldName)) {
          schemas[parentSchemaName].required!.push(fieldName);
        }
      }
    }

    // Add $ref properties for parent-child relationships
    for (let i = 1; i < keys.length; i++) {
      const parentSchema = pascalKeys.slice(0, i).join('');
      const childSchema = pascalKeys.slice(0, i + 1).join('');
      const parentField = keys[i];
      
      if (i < keys.length - 1 && schemas[parentSchema]) {
        if (!schemas[parentSchema].properties[parentField]) {
          schemas[parentSchema].properties[parentField] = {
            $ref: `#/components/schemas/${childSchema}`
          };
        }
        
        // Handle requiredness for object fields
        if (requiredness === 'M' && i === keys.length - 2) {
          if (!schemas[parentSchema].required) {
            schemas[parentSchema].required = [];
          }
          if (!schemas[parentSchema].required!.includes(parentField)) {
            schemas[parentSchema].required!.push(parentField);
          }
        }
      }
    }
  }

  // Clean up empty required arrays
  Object.values(schemas).forEach(schema => {
    if (schema.required && schema.required.length === 0) {
      delete schema.required;
    }
  });

  return {
    openapi: '3.0.3',
    info: { title, version },
    paths: {},
    components: { schemas },
  };
}