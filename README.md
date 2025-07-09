# csv-to-pojo

Converts request specs in CSV tables to JAVA POJOs

This tool converts a nested CSV specification of JSON fields into an OpenAPI 3.0 schema and uses OpenAPI Generator to create Java POJOs.

## Usage

Convert request.csv to Java models in output

```shell
python -m cli ./examples/request.csv ./output
```
