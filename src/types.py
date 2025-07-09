import re


def convert_type(type_str: str):
    type_str = type_str.lower()
    if "uuid" in type_str:
        return "string", "uuid"
    elif "date" in type_str and "time" in type_str:
        return "string", "date-time"
    elif "date" in type_str:
        return "string", "date"
    elif "number" in type_str:
        return "number", "double"
    elif "string" in type_str:
        return "string", None
    else:
        return "string", None


def extract_constraints(type_str: str):
    match = re.search(r"\((\d+)\)", type_str)
    return int(match.group(1)) if match else None
