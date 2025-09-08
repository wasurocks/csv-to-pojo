import Papa from "papaparse";
import { convertType, extractConstraints, normalizeTypeString } from "./types";

export interface CSVRow {
    "Field name": string;
    Type: string;
    "M/O/C": string;
    Description: string;
    Mapping: string;
}

export interface FlexibleCSVRow {
    fieldName?: string;
    type?: string;
    mandatory?: string;
    description?: string;
    mapping?: string;
    [key: string]: any; // Allow additional columns
}

export interface CSVValidationError {
    type:
        | "MISSING_COLUMNS"
        | "INVALID_FIELD_NAME"
        | "UNSUPPORTED_TYPE"
        | "PARSING_ERROR";
    message: string;
    suggestions?: string[];
    rowNumber?: number;
    fieldName?: string;
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

export interface ParseResult {
    spec: OpenAPISpec;
    warnings: string[];
}

function toPascalCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function singularize(word: string): string {
    // Handle "List" suffix pattern - class names should never end with "List"
    // e.g., "TransferFeeList" -> "TransferFee", "TransferList" -> "Transfer"
    if (word.endsWith("List")) {
        return word.slice(0, -4); // Remove "List"
    }

    // Special cases for common array field names
    const specialCases: { [key: string]: string } = {
        transferList: "transfer",
        itemList: "item",
        dataList: "data",
        userList: "user",
    };

    if (specialCases[word]) {
        return specialCases[word];
    }

    // Smart singularization: remove trailing 's' for common plural patterns
    if (word.endsWith("ies")) {
        return word.slice(0, -3) + "y";
    } else if (
        word.endsWith("ses") ||
        word.endsWith("xes") ||
        word.endsWith("zes")
    ) {
        return word.slice(0, -2);
    } else if (word.endsWith("s") && word.length > 3 && !word.endsWith("ss")) {
        return word.slice(0, -1);
    }
    return word;
}

function isArrayFieldName(fieldName: string): boolean {
    // Check if field name represents an array by common patterns
    const lowerName = fieldName.toLowerCase();
    return (
        lowerName.includes("list") ||
        lowerName.includes("fees") ||
        lowerName.includes("items") ||
        lowerName.includes("array") ||
        // Common plurals that indicate arrays
        lowerName.endsWith("s") ||
        // Specific known array field names
        lowerName === "transferlist" ||
        lowerName === "transferfees" ||
        lowerName === "transactionfees"
    );
}



function sanitizeFieldName(fieldName: string): string {
    if (!fieldName) return "";

    // Remove row numbers at the start (e.g., "1,transactionId" -> "transactionId")
    fieldName = fieldName.replace(/^\d+[,\s]*/, "");

    // Remove dates and extra text (e.g., "field Mar 28,2025" -> "field")
    fieldName = fieldName.replace(
        /\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s*\d{4}/gi,
        ""
    );

    // Handle array notation - convert "field[]" or "field[ ]" to "field"
    // We'll track arrays separately
    fieldName = fieldName.replace(/\[\s*\]/g, "");

    // Clean up extra spaces and special characters
    fieldName = fieldName.trim();

    return fieldName;
}

function isArrayField(originalFieldName: string): boolean {
    return /\[\s*\]/.test(originalFieldName);
}


export function buildOpenAPIFromCSVWithMapping(
    csvData: string,
    columnMapping: { [csvColumn: string]: string },
    baseModelName: string = "GeneratedModel"
): OpenAPISpec {
    const parseResult = Papa.parse<any>(csvData, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) =>
            header.trim().replace(/^\uFEFF/, ""),
    });

    const fatalErrors = parseResult.errors.filter(
        (e: any) => e.type === "Quotes"
    );
    if (fatalErrors.length > 0) {
        throw new Error(
            `CSV parsing failed: ${fatalErrors
                .map((e: any) => e.message)
                .join(", ")}`
        );
    }

    // Validate required mappings
    const hasFieldName = Object.values(columnMapping).includes("fieldName");
    const hasType = Object.values(columnMapping).includes("type");

    if (!hasFieldName || !hasType) {
        throw new Error(
            "Required column mappings missing: Field Name and Data Type columns must be mapped"
        );
    }

    const schemas: Record<string, OpenAPISchema> = {};
    const warnings: string[] = [];

    for (let i = 0; i < parseResult.data.length; i++) {
        const row = parseResult.data[i];
        const rowNumber = i + 2;

        const fieldNameColumn = Object.keys(columnMapping).find(
            (col) => columnMapping[col] === "fieldName"
        );
        const typeColumn = Object.keys(columnMapping).find(
            (col) => columnMapping[col] === "type"
        );
        const mandatoryColumn = Object.keys(columnMapping).find(
            (col) => columnMapping[col] === "mandatory"
        );
        const descriptionColumn = Object.keys(columnMapping).find(
            (col) => columnMapping[col] === "description"
        );
        const sampleValueColumn = Object.keys(columnMapping).find(
            (col) => columnMapping[col] === "sampleValue"
        );

        if (!fieldNameColumn || !typeColumn) {
            continue;
        }

        const originalPath = row[fieldNameColumn]?.toString().trim();
        const rawTypeStr = row[typeColumn]?.toString().trim();
        const typeStr = normalizeTypeString(rawTypeStr);
        const requiredness = mandatoryColumn
            ? row[mandatoryColumn]?.toString().trim()
            : "";
        const description = descriptionColumn
            ? row[descriptionColumn]?.toString().trim()
            : "";
        const sampleValue = sampleValueColumn
            ? row[sampleValueColumn]?.toString().trim()
            : "";

        const sanitizedPath = sanitizeFieldName(originalPath || "");

        // Check if this is an array field
        const fieldIsArray = isArrayField(originalPath || "");

        // If field name has [ ], treat the type as array even if it doesn't start with "Array"
        // But only if the [ ] is at the end of the field name (not in the middle of a path)
        let effectiveTypeStr = typeStr;
        if (fieldIsArray && !typeStr.toLowerCase().startsWith("array")) {
            // Only convert to array if the [ ] is at the very end of the original path
            if (originalPath && originalPath.trim().endsWith("[ ]")) {
                effectiveTypeStr = `Array ${typeStr}`;
            }
        }

        if (
            !sanitizedPath ||
            !typeStr ||
            sanitizedPath.toLowerCase() === "header" ||
            sanitizedPath.toLowerCase() === "body"
        ) {
            if (originalPath && !sanitizedPath) {
                warnings.push(
                    `Row ${rowNumber}: Field name "${originalPath}" was invalid and skipped`
                );
            }
            continue;
        }

        const keys = sanitizedPath.split(".");
        const pascalKeys = keys.map(toPascalCase);

        // Ensure base model always exists
        if (!schemas[baseModelName]) {
            schemas[baseModelName] = {
                type: "object",
                properties: {},
                required: [],
            };
        }

        // Create schema names using baseModelName prefix for nested objects
        // For path "user.name", we need PaymentRequestUser schema
        if (keys.length > 1) {
            for (let i = 1; i <= keys.length - 1; i++) {
                const pathSegments = pascalKeys.slice(0, i);
                // Apply singularization to each path segment for consistency with array logic
                const singularizedSegments = pathSegments.map((segment) =>
                    singularize(segment)
                );
                const schemaName =
                    baseModelName + singularizedSegments.join("");

                if (!schemas[schemaName]) {
                    schemas[schemaName] = {
                        type: "object",
                        properties: {},
                        required: [],
                    };
                }
            }
        }

        // Determine parent schema name
        let parentSchemaName: string;
        const fieldName = keys[keys.length - 1];

        if (keys.length === 1) {
            // Top-level field goes in base model
            parentSchemaName = baseModelName;
        } else {
            // Nested field - parent is baseModelName + path (excluding the field itself)
            const pathSegments = pascalKeys.slice(0, -1);

            // For nested array fields, the parent is the schema created by the most immediate array
            // E.g., "transferList[ ].transferFees[ ].feeCode" -> parent should be "PaymentRequestTransferFee"
            // not "PaymentRequestTransferTransferFee"

            let parentSegments: string[] = [];

            // Find the most recent array field in the path
            const originalKeys = originalPath?.split(".") || [];
            let mostRecentArrayIndex = -1;

            for (let i = pathSegments.length - 1; i >= 0; i--) {
                const originalSegment = originalKeys[i];
                if (originalSegment && originalSegment.includes("[ ]")) {
                    mostRecentArrayIndex = i;
                    break;
                }
            }

            if (mostRecentArrayIndex >= 0) {
                // For nested array fields, build full descriptive path with proper singularization
                // E.g., "transferList[ ].transferFees[ ].feeCode" -> parent should be "PaymentRequestTransferTransferFee"
                // E.g., "transferList[ ].withholdingTaxInformationItems[ ].amount" -> parent should be "PaymentRequestTransferWithholdingTaxInformationItem"

                const singularizedSegments = pathSegments.map(
                    (segment, index) => {
                        const originalSegment = originalKeys[index];
                        // Singularize if this segment corresponds to an array field
                        return originalSegment &&
                            originalSegment.includes("[ ]")
                            ? singularize(segment)
                            : segment;
                    }
                );

                parentSegments = singularizedSegments;
            } else {
                // No array in path, use standard logic
                parentSegments = pathSegments.map((segment) => {
                    return isArrayFieldName(segment)
                        ? singularize(segment)
                        : segment;
                });
            }

            parentSchemaName = baseModelName + parentSegments.join("");

            // Ensure parent schema exists before trying to add properties
            if (!schemas[parentSchemaName]) {
                schemas[parentSchemaName] = {
                    type: "object",
                    properties: {},
                    required: [],
                };
            }
        }

        if (schemas[parentSchemaName]) {
            const typeMapping = convertType(effectiveTypeStr);
            const constraints = extractConstraints(effectiveTypeStr);

            let propSchema: any;

            if (typeMapping.isArray) {
                // Handle Array types
                propSchema = {
                    type: "array",
                    items: {},
                };

                // For Array Object types, create a schema reference
                if (typeMapping.elementType === "object") {
                    // Create schema name for the array element type using the same logic as parent schema calculation
                    // This ensures consistency between array references and nested property assignments

                    // Use the same logic as the parent schema name calculation
                    const currentPath = sanitizedPath;
                    const currentKeys = currentPath.split(".");
                    const pascalCurrentKeys = currentKeys.map((k) =>
                        toPascalCase(k)
                    );

                    // For the element schema, we want the full path including this array field
                    const elementPathSegments = pascalCurrentKeys;
                    const originalPathKeys = originalPath?.split(".") || [];

                    const elementSchemaSegments = elementPathSegments.map(
                        (segment, index) => {
                            const originalSegment = originalPathKeys[index];
                            // Singularize if this segment corresponds to an array field
                            return originalSegment &&
                                originalSegment.includes("[ ]")
                                ? singularize(segment)
                                : segment;
                        }
                    );

                    const elementSchemaName =
                        baseModelName + elementSchemaSegments.join("");

                    // Ensure the element schema exists
                    if (!schemas[elementSchemaName]) {
                        schemas[elementSchemaName] = {
                            type: "object",
                            properties: {},
                            required: [],
                        };
                    }

                    propSchema.items = {
                        $ref: `#/components/schemas/${elementSchemaName}`,
                    };
                } else {
                    // For primitive array types (string, number, etc.)
                    propSchema.items = {
                        type: typeMapping.elementType || "string",
                    };

                    if (typeMapping.elementFormat) {
                        propSchema.items.format = typeMapping.elementFormat;
                    }

                    // Apply constraints to array items
                    if (
                        constraints.maxLength &&
                        (typeMapping.elementType === "string" ||
                            !typeMapping.elementType)
                    ) {
                        propSchema.items.maxLength = constraints.maxLength;
                    }

                    if (
                        constraints.precision &&
                        typeMapping.elementType === "number"
                    ) {
                        propSchema.items.precision = constraints.precision;
                    }

                    if (
                        constraints.scale &&
                        typeMapping.elementType === "number"
                    ) {
                        propSchema.items.scale = constraints.scale;
                    }
                }
            } else if (typeMapping.type === "object") {
                // Handle Object types - create schema reference using same logic as path-based creation
                // This ensures consistency with the existing schema naming system
                const currentFullPath = keys.join(".");
                const pathParts = currentFullPath.split(".");
                const pascalPathParts = pathParts.map(toPascalCase);

                // Apply singularization to ensure consistency with path-based schema creation
                const singularizedParts = pascalPathParts.map((segment) =>
                    singularize(segment)
                );
                const objectSchemaName =
                    baseModelName + singularizedParts.join("");

                // The schema should already exist from path-based creation, but ensure it exists
                if (!schemas[objectSchemaName]) {
                    schemas[objectSchemaName] = {
                        type: "object",
                        properties: {},
                        required: [],
                    };
                }

                propSchema = {
                    $ref: `#/components/schemas/${objectSchemaName}`,
                };
            } else {
                // Handle non-array primitive types
                propSchema = { type: typeMapping.type };

                if (typeMapping.format) {
                    propSchema.format = typeMapping.format;
                }

                if (constraints.maxLength && typeMapping.type === "string") {
                    propSchema.maxLength = constraints.maxLength;
                }
            }

            if (description) {
                propSchema.description = description;
            }

            if (sampleValue) {
                propSchema.example = sampleValue;
            }

            schemas[parentSchemaName].properties[fieldName] = propSchema;

            if (requiredness === "M") {
                if (!schemas[parentSchemaName].required) {
                    schemas[parentSchemaName].required = [];
                }
                if (!schemas[parentSchemaName].required!.includes(fieldName)) {
                    schemas[parentSchemaName].required!.push(fieldName);
                }
            }
        }

        // Add object references for nested structures
        for (let i = 0; i < keys.length - 1; i++) {
            let parentSchemaName: string;
            let childSchemaName: string;
            const childFieldName = keys[i];

            if (i === 0) {
                // First level nesting: parent is base model, child is baseModel + firstSegment
                parentSchemaName = baseModelName;
                childSchemaName = baseModelName + pascalKeys[0];
            } else {
                // Deeper nesting: both have baseModel prefix
                parentSchemaName =
                    baseModelName + pascalKeys.slice(0, i).join("");
                childSchemaName =
                    baseModelName + pascalKeys.slice(0, i + 1).join("");
            }

            if (schemas[parentSchemaName] && schemas[childSchemaName]) {
                if (!schemas[parentSchemaName].properties[childFieldName]) {
                    schemas[parentSchemaName].properties[childFieldName] = {
                        $ref: `#/components/schemas/${childSchemaName}`,
                    };
                }

                // Handle requiredness for nested objects
                if (requiredness === "M" && i === keys.length - 2) {
                    if (!schemas[parentSchemaName].required) {
                        schemas[parentSchemaName].required = [];
                    }
                    if (
                        !schemas[parentSchemaName].required!.includes(
                            childFieldName
                        )
                    ) {
                        schemas[parentSchemaName].required!.push(
                            childFieldName
                        );
                    }
                }
            }
        }
    }

    Object.values(schemas).forEach((schema) => {
        if (schema.required && schema.required.length === 0) {
            delete schema.required;
        }
    });

    const spec: OpenAPISpec = {
        openapi: "3.0.3",
        info: { title: `${baseModelName} API`, version: "1.0.0" },
        paths: {},
        components: { schemas },
    };

    return spec;
}


