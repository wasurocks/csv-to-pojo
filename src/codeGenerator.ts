import Mustache from 'mustache';
import { OpenAPISpec, OpenAPISchema } from './csvParser';

export interface JavaProperty {
  name: string;
  baseName: string;
  datatype: string;
  description?: string;
  required: boolean;
  isString: boolean;
  isNumeric: boolean;
  isDate: boolean;
  isModel: boolean;
  maxLength?: number;
  example?: string;
  pattern?: string;
  patternMessage?: string;
}

export interface JavaModel {
  classname: string;
  packageName: string;
  vars: JavaProperty[];
}

export interface GenerationContext {
  models: JavaModel[];
}

function convertOpenAPITypeToJava(type: string, format?: string): string {
  if (type === 'number') {
    return 'BigDecimal';
  }
  
  if (type === 'string') {
    if (format === 'date' || format === 'date-time') {
      return 'String';
    }
    return 'String';
  }
  
  if (type === 'boolean') {
    return 'Boolean';
  }
  
  return 'String';
}

function isOpenAPITypeNumeric(type: string): boolean {
  return type === 'number' || type === 'integer';
}

function isOpenAPITypeString(type: string): boolean {
  return type === 'string';
}

function isOpenAPITypeDate(type: string, format?: string): boolean {
  return type === 'string' && (format === 'date' || format === 'date-time');
}

function convertSchemaToJavaModel(
  schemaName: string,
  schema: OpenAPISchema,
  packageName: string
): JavaModel {
  const vars: JavaProperty[] = [];
  
  for (const [propName, propSchema] of Object.entries(schema.properties)) {
    if (propSchema.$ref) {
      // This is a reference to another model
      const refSchemaName = propSchema.$ref.split('/').pop() || propName;
      vars.push({
        name: propName,
        baseName: propName,
        datatype: refSchemaName,
        required: schema.required?.includes(propName) || false,
        isString: false,
        isNumeric: false,
        isDate: false,
        isModel: true,
        description: propSchema.description,
      });
    } else {
      // This is a primitive property
      const javaType = convertOpenAPITypeToJava(propSchema.type, propSchema.format);
      vars.push({
        name: propName,
        baseName: propName,
        datatype: javaType,
        required: schema.required?.includes(propName) || false,
        isString: isOpenAPITypeString(propSchema.type),
        isNumeric: isOpenAPITypeNumeric(propSchema.type),
        isDate: isOpenAPITypeDate(propSchema.type, propSchema.format),
        isModel: false,
        description: propSchema.description,
        maxLength: propSchema.maxLength,
      });
    }
  }
  
  return {
    classname: schemaName,
    packageName,
    vars,
  };
}

export function generateJavaCode(
  openApiSpec: OpenAPISpec,
  packageName: string = 'com.example.model'
): Map<string, string> {
  const models: JavaModel[] = [];
  
  // Convert all schemas to Java models
  for (const [schemaName, schema] of Object.entries(openApiSpec.components.schemas)) {
    const javaModel = convertSchemaToJavaModel(
      schemaName,
      schema,
      packageName
    );
    models.push(javaModel);
  }
  
  // Get the Mustache template
  const template = getJavaTemplate();
  
  // Generate code for each model
  const generatedFiles = new Map<string, string>();
  
  for (const model of models) {
    const modelContext = {
      models: [{ model }],
      packageName,
    };
    
    const javaCode = Mustache.render(template, modelContext);
    generatedFiles.set(`${model.classname}.java`, javaCode);
  }
  
  return generatedFiles;
}

function getJavaTemplate(): string {
  return `{{#models}}
{{#model}}
package {{packageName}};

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
@Schema(name = "{{classname}}")
public class {{classname}} {

{{#vars}}
    @Schema(
        description = "{{#required}}Mandatory. {{/required}}{{^required}}Optional. {{/required}}{{{description}}}"{{#example}},
        example = "{{example}}"{{/example}},
        requiredMode = Schema.RequiredMode.{{#required}}REQUIRED{{/required}}{{^required}}NOT_REQUIRED{{/required}}
    )
    @JsonProperty("{{baseName}}")
    {{#required}}
        {{#isNumeric}}
    @NotNull(message = "must not be null")
    @Positive(message = "must be greater than 0")
        {{/isNumeric}}
        {{#isString}}
    @NotBlank(message = "must not be null or empty")
        {{/isString}}
    {{/required}}
    {{#isString}}
        {{#maxLength}}
    @Size(max = {{maxLength}}, message = "length must not exceed {{maxLength}} characters")
        {{/maxLength}}
        {{#pattern}}
    @Pattern(regexp = "{{pattern}}", message = "{{patternMessage}}")
        {{/pattern}}
    {{/isString}}
    {{#isDate}}
    @Pattern(regexp = "^\\\\d{4}-\\\\d{2}-\\\\d{2}$", message = "Date must be in the format yyyy-MM-dd")
    {{/isDate}}
    {{#isModel}}
    @Valid
    {{#required}}
    @NotNull(message = "must not be null")
    {{/required}}
    {{/isModel}}
    private {{#isNumeric}}BigDecimal{{/isNumeric}}{{^isNumeric}}{{datatype}}{{/isNumeric}} {{name}};

{{/vars}}
}
{{/model}}
{{/models}}`;
}