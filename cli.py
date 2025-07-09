import typer
from pathlib import Path

from src.csv_parser import build_openapi_from_csv_dynamic
from src.openapi_codegen import run_openapi_codegen

app = typer.Typer(help="CSV ➜ OpenAPI ➜ Java POJO Generator")


@app.command()
def generate(
    csv_path: Path = typer.Argument(..., help="Path to the input CSV file."),
    output_dir: Path = typer.Argument(..., help="Directory to write Java output."),
    title: str = typer.Option(
        "Generated API", "--title", "-t", help="API title in OpenAPI spec."
    ),
    version: str = typer.Option("1.0.0", "--version", "-v", help="API version."),
    model_package: str = typer.Option(
        "com.example.model", "--package", "-p", help="Java model package name."
    ),
):
    """
    Convert a CSV spec into Java POJOs using OpenAPI Generator.
    """
    if not csv_path.exists():
        typer.echo(f"❌ File not found: {csv_path}")
        raise typer.Exit(code=1)

    with open(csv_path, "r", encoding="utf-8") as f:
        csv_string = f.read()

    typer.echo("📦 Generating OpenAPI schema from CSV...")
    openapi_dict = build_openapi_from_csv_dynamic(
        csv_string, title=title, version=version
    )

    typer.echo("⚙️ Running OpenAPI codegen...")
    run_openapi_codegen(
        openapi_dict, output_dir=str(output_dir), model_package=model_package
    )

    typer.echo(f"✅ POJOs generated at: {output_dir}")


if __name__ == "__main__":
    app()
