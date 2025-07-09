import csv
import json
import html
from io import StringIO
from .types import convert_type, extract_constraints


def to_pascal_case(s: str) -> str:
    # Capitalize first letter, keep rest as is (for e.g. isoRequest -> IsoRequest)
    return s[:1].upper() + s[1:] if s else s


def build_openapi_from_csv_dynamic(
    csv_data: str, title: str = "Generated API", version: str = "1.0.0"
) -> dict:
    reader = csv.DictReader(StringIO(csv_data))
    reader.fieldnames = [fn.strip().lstrip("\ufeff") for fn in reader.fieldnames]

    schemas = {}

    for row in reader:
        row = {k.strip(): v for k, v in row.items()}
        path = row.get("Field name", "").strip()
        type_str = row.get("Type", "").strip()
        requiredness = row.get("M/O/C", "").strip()
        description = html.unescape(row.get("Description", "").strip())

        if not path or path.lower() in {"header", "body"}:
            continue

        keys = path.split(".")
        pascal_keys = [to_pascal_case(k) for k in keys]

        # Always create schema for each object in the path
        for i in range(len(keys)):
            schema_name = "".join(pascal_keys[: i + 1])
            if schema_name not in schemas:
                schemas[schema_name] = {
                    "type": "object",
                    "properties": {},
                    "required": [],
                }

        # If this is an object field, skip (already handled above)
        if type_str.lower() == "object":
            continue

        # The parent is always the second last in the path
        parent_schema_name = "".join(pascal_keys[:-1])
        field_name = keys[-1]
        # If this is a leaf property (not an object), add to the correct schema
        openapi_type, fmt = convert_type(type_str)
        max_length = extract_constraints(type_str)
        prop_schema = {"type": openapi_type}
        if description:
            prop_schema["description"] = description
        if fmt:
            prop_schema["format"] = fmt
        if max_length and openapi_type == "string":
            prop_schema["maxLength"] = max_length
        schemas[parent_schema_name]["properties"][field_name] = prop_schema
        if requiredness == "M":
            schemas[parent_schema_name].setdefault("required", [])
            if field_name not in schemas[parent_schema_name]["required"]:
                schemas[parent_schema_name]["required"].append(field_name)

        # For each parent-child object relationship, add $ref at the parent
        for i in range(1, len(keys)):
            parent_schema = "".join(pascal_keys[:i])
            child_schema = "".join(pascal_keys[: i + 1])
            parent_field = keys[i]
            # Only add $ref if not already present and not a leaf property
            if i < len(keys) - 1:
                if parent_field not in schemas[parent_schema]["properties"]:
                    schemas[parent_schema]["properties"][parent_field] = {
                        "$ref": f"#/components/schemas/{child_schema}"
                    }
                # Handle requiredness for object fields
                if requiredness == "M" and i == len(keys) - 2:
                    schemas[parent_schema].setdefault("required", [])
                    if parent_field not in schemas[parent_schema]["required"]:
                        schemas[parent_schema]["required"].append(parent_field)

    # Remove empty required lists for cleaner OpenAPI
    for schema in schemas.values():
        if "required" in schema and not schema["required"]:
            del schema["required"]
        if "description" in schema and not schema["description"]:
            del schema["description"]

    openapi_dict = {
        "openapi": "3.0.3",
        "info": {"title": title, "version": version},
        "paths": {},
        "components": {"schemas": schemas},
    }

    with open("openapi_debug.json", "w", encoding="utf-8") as debug_file:
        json.dump(openapi_dict, debug_file, ensure_ascii=False, indent=2)

    return openapi_dict
