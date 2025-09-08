import { buildOpenAPIFromCSVWithMapping } from './src/csvParser';
import { generateJavaCode } from './src/codeGenerator';

// Test with deeper nested arrays and the examples from user
const csvData = `Field name,Type,M/O/C,Description
transferList[ ],Array Object,M,List of transfers
transferList[ ].amount,Number,M,Transfer amount
transferList[ ].transferFees[ ],Array Object,O,Transfer fees
transferList[ ].transferFees[ ].feeCode,String (20),M,Fee code
transferList[ ].transferFees[ ].amount,Number,M,Fee amount
transferList[ ].withholdingTaxInformationItems[ ],Array Object,O,Withholding tax information
transferList[ ].withholdingTaxInformationItems[ ].taxCode,String (10),M,Tax code
transferList[ ].withholdingTaxInformationItems[ ].taxAmount,Number,M,Tax amount`;

const columnMapping = {
  'Field name': 'fieldName',
  'Type': 'type', 
  'M/O/C': 'mandatory',
  'Description': 'description'
};

try {
  const openApiSpec = buildOpenAPIFromCSVWithMapping(csvData, columnMapping, 'DirectCreditInitiationRequest');
  
  console.log('=== FINAL RESULT ANALYSIS ===');
  const schemas = openApiSpec.components.schemas;
  
  console.log('\nGenerated Schemas:');
  Object.keys(schemas).forEach(name => {
    const schema = schemas[name];
    const propCount = Object.keys(schema.properties || {}).length;
    console.log(`📋 ${name} (${propCount} properties)`);
    
    if (propCount > 0) {
      Object.keys(schema.properties).forEach(propName => {
        const prop = schema.properties[propName];
        if (prop.type === 'array' && prop.items?.$ref) {
          console.log(`   └─ ${propName}: ${prop.items.$ref}`);
        } else if (prop.$ref) {
          console.log(`   └─ ${propName}: ${prop.$ref}`);
        } else {
          console.log(`   └─ ${propName}: ${prop.type}${prop.maxLength ? ` (${prop.maxLength})` : ''}`);
        }
      });
    }
  });

  console.log('\n=== VALIDATION ===');
  
  // Test 1: transferList array
  const mainSchema = schemas.DirectCreditInitiationRequest;
  const transferListRef = mainSchema.properties.transferList?.items?.$ref;
  console.log(`✓ transferList references: ${transferListRef}`);
  
  // Test 2: transferFees array
  const transferSchema = schemas.DirectCreditInitiationRequestTransfer;
  const transferFeesRef = transferSchema?.properties.transferFees?.items?.$ref;  
  console.log(`✓ transferFees references: ${transferFeesRef}`);
  
  // Test 3: withholdingTaxInformationItems array
  const withholdingRef = transferSchema?.properties.withholdingTaxInformationItems?.items?.$ref;
  console.log(`✓ withholdingTaxInformationItems references: ${withholdingRef}`);
  
  // Test 4: Properties in nested schemas
  const transferFeeSchema = schemas.DirectCreditInitiationRequestTransferTransferFee;
  const withholdingSchema = schemas.DirectCreditInitiationRequestTransferWithholdingTaxInformationItem;
  
  console.log(`✓ TransferFee properties: ${Object.keys(transferFeeSchema?.properties || {}).join(', ')}`);
  console.log(`✓ WithholdingTaxInformationItem properties: ${Object.keys(withholdingSchema?.properties || {}).join(', ')}`);
  
  // Generate Java to verify final output
  const javaFiles = generateJavaCode(openApiSpec, 'com.example.model');
  console.log(`\n🎯 Generated ${javaFiles.size} Java files`);
  
  // Check one Java file for correct typing
  const mainJava = javaFiles.get('DirectCreditInitiationRequest.java');
  if (mainJava && mainJava.includes('List<DirectCreditInitiationRequestTransfer>')) {
    console.log('✅ Java: transferList correctly typed as List<DirectCreditInitiationRequestTransfer>');
  }

} catch (error) {
  console.error('❌ Error:', (error as Error).message);
}