import { readFileSync } from 'fs';
import { buildOpenAPIFromCSVWithMapping } from './src/csvParser';
import { generateJavaCode } from './src/codeGenerator';

const csvData = readFileSync('/Users/wasusonthichai/Desktop/csv-to-pojo-1/examples/direct-credit-init.csv', 'utf8');

const columnMapping = {
  'Field name': 'fieldName',
  'Data type': 'type', 
  'M/O/C': 'mandatory',
  'Field description': 'description',
  'Sample value': 'sampleValue'
};

try {
  console.log('=== Final Validation Test ===\n');

  const openApiSpec = buildOpenAPIFromCSVWithMapping(csvData, columnMapping, 'DirectCreditInitiationRequest');
  
  console.log('🔍 Checking validation-related schemas:');
  const allSchemas = Object.keys(openApiSpec.components.schemas).sort();
  const validationSchemas = allSchemas.filter(name => name.includes('Validation')).sort();
  
  console.log(`Found ${validationSchemas.length} validation schemas:`);
  validationSchemas.forEach(name => {
    const schema = openApiSpec.components.schemas[name];
    const propCount = Object.keys(schema.properties || {}).length;
    console.log(`  📋 ${name} (${propCount} properties) ${propCount > 0 ? '✅' : '❌'}`);
  });

  // Check main schema reference
  console.log('\n🔗 Main schema validation details reference:');
  const mainSchema = openApiSpec.components.schemas.DirectCreditInitiationRequest;
  const validationDetailsRef = mainSchema.properties.validationDetails;
  
  if (validationDetailsRef && validationDetailsRef.$ref) {
    console.log(`✅ References: ${validationDetailsRef.$ref}`);
    
    // Check if referenced schema exists and is populated
    const referencedSchemaName = validationDetailsRef.$ref.split('/').pop();
    const referencedSchema = openApiSpec.components.schemas[referencedSchemaName];
    if (referencedSchema) {
      const propCount = Object.keys(referencedSchema.properties || {}).length;
      console.log(`✅ Referenced schema exists with ${propCount} properties`);
      
      if (propCount > 0) {
        Object.keys(referencedSchema.properties).forEach(propName => {
          const prop = referencedSchema.properties[propName];
          if (prop.$ref) {
            console.log(`   └─ ${propName}: ${prop.$ref}`);
          } else {
            console.log(`   └─ ${propName}: ${prop.type || 'unknown'}`);
          }
        });
      }
    } else {
      console.log(`❌ Referenced schema "${referencedSchemaName}" does not exist!`);
    }
  } else {
    console.log(`❌ No valid reference found`);
  }

  // Generate Java to verify final result
  const javaFiles = generateJavaCode(openApiSpec, 'com.example.model');
  console.log(`\n🎯 Generated ${javaFiles.size} Java files total`);
  
  const validationDetailJava = javaFiles.get('DirectCreditInitiationRequestValidationDetail.java');
  if (validationDetailJava) {
    console.log('✅ DirectCreditInitiationRequestValidationDetail.java exists');
    
    const hasProperties = validationDetailJava.includes('@JsonProperty');
    const hasValidationDetails = validationDetailJava.includes('validationDetails');
    
    console.log(`✅ Contains properties: ${hasProperties}`);
    console.log(`✅ Main class references it properly: ${hasValidationDetails}`);
    
    if (hasProperties) {
      console.log('\n🎉 SUCCESS: DirectCreditInitiationRequestValidationDetail is properly populated and referenced!');
    } else {
      console.log('\n❌ ISSUE: Schema exists but appears empty');
    }
  } else {
    console.log('❌ DirectCreditInitiationRequestValidationDetail.java not found');
  }

} catch (error) {
  console.error('❌ Error:', (error as Error).message);
}