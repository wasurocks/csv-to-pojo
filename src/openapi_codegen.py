import os
import tempfile
import yaml
from openapi_generator_cli import run


def run_openapi_codegen(
    openapi_dict: dict,
    output_dir: str,
    language: str = "java",
    model_package: str = None,
    template_dir: str = "./templates/Java/lombok",
):
    # Write OpenAPI dict to a temporary YAML file
    with tempfile.NamedTemporaryFile(
        delete=False, suffix=".yaml", mode="w"
    ) as tmp_file:
        yaml.dump(openapi_dict, tmp_file, sort_keys=False)
        tmp_file_path = tmp_file.name

    additional_properties = [
        "useLombokAnnotations=true",
        "modelPropertyNaming=original",
        "dateLibrary=java8",
        "serializableModel=false",
        "annotationLibrary=swagger2",
        "jackson=true",
        "hideGenerationTimestamp=true",
        "useBeanValidation=true",
    ]
    if model_package:
        additional_properties.append(f"modelPackage={model_package}")

    args = [
        "generate",
        "-i",
        tmp_file_path,
        "-g",
        language,
        "-o",
        output_dir,
        "-t",
        template_dir,
        "--additional-properties=" + ",".join(additional_properties),
        "--global-property=models",
        "--global-property=modelDocs=false",
        "--global-property=modelTests=false",
        "--global-property=debugModels=true",
    ]

    print("Running OpenAPI Generator with arguments:", args)

    result = run(args)

    print("STDOUT:\n", result.stdout)
    print("STDERR:\n", result.stderr)

    os.remove(tmp_file_path)

    if result.returncode != 0:
        raise RuntimeError(f"OpenAPI Generator failed:\n{result.stderr}")
