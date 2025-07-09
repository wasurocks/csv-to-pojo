# csv-to-pojo

Converts request specs in CSV tables to JAVA POJOs

This tool converts a nested CSV specification of JSON fields into an OpenAPI 3.0 schema and uses OpenAPI Generator to create Java POJOs.

## Usage

```python
from src.csv_parser import build_openapi_from_csv_dynamic
from src.openapi_codegen import run_openapi_codegen

openapi_dict = build_openapi_from_csv_dynamic(csv_string, title="Bahtnet ISO", version="1.0.0")
run_openapi_codegen(openapi_dict, output_dir="./output", model_package="com.example.model")
```
