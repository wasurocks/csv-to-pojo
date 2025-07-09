import csv
import json
import re
from typing import Dict, List


def _normalize_header(name: str) -> str:
    """Normalize header column names."""
    return name.strip().lower().replace(" ", "_")


def _parse_type(type_str: str) -> Dict:
    """Map CSV type strings to OpenAPI types with constraints."""
    t = (type_str or "").strip().lower()
    schema: Dict = {}

    if t.startswith("string"):
        schema["type"] = "string"
        m = re.search(r"\((\d+)\)", t)
        if m:
            schema["maxLength"] = int(m.group(1))
    elif t in {"number", "numeric", "decimal"}:
        schema["type"] = "number"
    elif t == "uuid":
        schema["type"] = "string"
        schema["format"] = "uuid"
    elif t == "date":
        schema["type"] = "string"
        schema["format"] = "date"
    elif t == "datetime":
        schema["type"] = "string"
        schema["format"] = "date-time"
    else:
        schema["type"] = "object" if t == "object" else "string"
        if t == "object":
            schema.setdefault("properties", {})
            schema.setdefault("required", [])
    return schema


def _ensure_object(node: Dict, key: str) -> Dict:
    """Ensure an object property exists and return it."""
    if key not in node.get("properties", {}):
        node.setdefault("properties", {})[key] = {
            "type": "object",
            "properties": {},
            "required": [],
        }
    return node["properties"][key]


def _insert(schema: Dict, path: List[str], prop: Dict, required: bool) -> None:
    parent = schema
    for part in path[:-1]:
        parent = _ensure_object(parent, part)

    field = path[-1]
    parent.setdefault("properties", {})[field] = prop
    if required:
        parent.setdefault("required", []).append(field)


def parse_csv_to_schema(path: str) -> Dict:
    """Parse the CSV and return an OpenAPI-like schema dictionary."""
    with open(path, newline="", encoding="utf-8") as f:
        sample = f.read(1024)
        f.seek(0)
        dialect = csv.Sniffer().sniff(sample)
        reader = csv.reader(f, dialect)
        rows = list(reader)

    if not rows:
        return {}

    header_row = rows[0]
    if header_row and header_row[0].strip().isdigit():
        header_row = header_row[1:]
        rows = [r[1:] for r in rows[1:]]
    else:
        rows = rows[1:]

    headers = [_normalize_header(h) for h in header_row]

    schema: Dict = {"type": "object", "properties": {}, "required": []}

    for row in rows:
        if not row or all(not cell.strip() for cell in row):
            continue
        while len(row) < len(headers):
            row.append("")
        record = dict(zip(headers, row))
        field_name = record.get("field_name", "").strip()
        if not field_name or field_name.lower() in {"header", "body"}:
            continue

        type_str = record.get("type", "")
        prop = _parse_type(type_str)
        desc = record.get("description", "").strip()
        if desc:
            prop["description"] = desc
        required = record.get("m/o/c", "").strip().upper() == "M"
        _insert(schema, field_name.split("."), prop, required)

    return schema


if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Usage: python parse_csv.py <csv_file>")
        sys.exit(1)
    parsed = parse_csv_to_schema(sys.argv[1])
    json.dump(parsed, sys.stdout, ensure_ascii=False, indent=2)
    print()
