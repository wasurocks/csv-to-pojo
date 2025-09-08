import { buildOpenAPIFromCSVWithMapping } from './src/csvParser';

// Test with simple validation example
const csvData = `Field name,Type,M/O/C,Description
validationDetails,Object,O,Validation details
validationDetails.sender,Object,O,Sender validation details`;

const columnMapping = {
  'Field name': 'fieldName',
  'Type': 'type', 
  'M/O/C': 'mandatory',
  'Description': 'description'
};

try {
  const result = buildOpenAPIFromCSVWithMapping(csvData, columnMapping, 'DirectCreditInitiationRequest');
  
  console.log('=== Generated Schema Names ===');
  const schemaNames = Object.keys(result.components.schemas).sort();
  schemaNames.forEach(name => {
    console.log(`📋 ${name}`);
  });
  
  console.log('\n=== Schema References ===');
  const mainSchema = result.components.schemas.DirectCreditInitiationRequest;
  const validationDetailsProperty = mainSchema.properties.validationDetails;
  console.log(`Main schema validationDetails property:`, validationDetailsProperty);
  
  // Check which schemas actually have properties
  console.log('\n=== Schema Property Counts ===');
  schemaNames.forEach(name => {
    const schema = result.components.schemas[name];
    const propCount = Object.keys(schema.properties || {}).length;
    console.log(`${name}: ${propCount} properties`);
  });
  
} catch (error) {
  console.error('Error:', error);
}