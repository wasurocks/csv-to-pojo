# csv-to-pojo

Converts request specs in CSV tables to JAVA POJOs

This tool converts a nested CSV specification of JSON fields into an OpenAPI 3.0 schema and uses OpenAPI Generator to create Java POJOs.

## Usage

Convert request.csv to Java models in output

```shell
python -m cli ./examples/request.csv ./output
```

The CSV should include the columns **Field name**, **Type**, **M/O/C**, and **Description**. If an **Example** column is present, its values will be added to the generated OpenAPI schema and the resulting Java POJOs.
