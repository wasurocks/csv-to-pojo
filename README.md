# csv-to-pojo
Converts request specs in CSV tables to JAVA POJOs

## CSV to OpenAPI schema

The `parse_csv.py` script can read a specification table and produce a nested
OpenAPI-like dictionary. It expects a CSV file where the columns include
`Field name`, `Type`, `M/O/C`, and `Description`. The script automatically
creates nested objects for dotted field paths and marks properties as required
when the `M/O/C` column contains `M`.

Example:

```bash
python parse_csv.py example.csv > schema.json
```
