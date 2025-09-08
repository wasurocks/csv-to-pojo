import { buildOpenAPIFromCSVWithMapping } from './src/csvParser';
import { generateJavaCode } from './src/codeGenerator';

// Test CSV with nested arrays to check for excess schemas
const csvData = `Field name,Type,M/O/C,Description
transactionFees[ ],Array Object,O,Transaction fees
transactionFees[ ].feeCode,String (20),M,Fee code
transactionFees[ ].amount,Number,M,Fee amount
transferList[ ],Array Object,M,List of transfers
transferList[ ].amount,Number,M,Transfer amount
transferList[ ].transferFees[ ],Array Object,O,Transfer fees
transferList[ ].transferFees[ ].feeCode,String (20),M,Fee code`;

const columnMapping = {
  'Field name': 'fieldName',
  'Type': 'type', 
  'M/O/C': 'mandatory',
  'Description': 'description'
};

try {
  console.log('=== Testing Schema Generation for Excess Schema Detection ===\n');

  // Test with mapping function (manual column mapping only)
  const resultWithMapping = buildOpenAPIFromCSVWithMapping(csvData, columnMapping, 'PaymentRequest');
  
  console.log('📋 Generated Schemas:');
  const mappingSchemas = Object.keys(resultWithMapping.components.schemas).sort();
  mappingSchemas.forEach(name => console.log(`  - ${name}`));
  
  console.log('\n=== Excess Schema Analysis ===');
  
  // Check for schemas that shouldn't exist (plural forms)
  const problematicSchemas = mappingSchemas.filter(name => {
    // Check for plural forms that indicate excess schemas
    return (name.includes('Fees') && !name.includes('Fee]')) || 
           (name.includes('List') && name !== 'PaymentRequest' && !name.includes('Request'));
  });
  
  if (problematicSchemas.length > 0) {
    console.log('❌ Found potentially excess schemas:');
    problematicSchemas.forEach(name => console.log(`  - ${name} (may be excess)`));
  } else {
    console.log('✅ No obvious excess schemas found');
  }
  
  console.log('\n=== Java Generation Test ===');
  
  // Generate Java files to check final output
  const javaFiles = generateJavaCode(resultWithMapping, 'com.example.model');
  
  console.log(`Generated ${javaFiles.size} Java files:`);
  for (const [filename] of javaFiles) {
    console.log(`  📄 ${filename}`);
    
    // Check for problematic file names
    if (filename.includes('Fees.java') && !filename.includes('Fee.java')) {
      console.log(`    ❌ EXCESS: ${filename} (plural, should be singular)`);
    } else if (filename.includes('TransferList.java')) {
      console.log(`    ❌ EXCESS: ${filename} (contains 'List' in class name)`);
    } else {
      console.log(`    ✅ OK: Proper singular naming`);
    }
  }
  
  console.log('\n=== Final Validation ===');
  
  // Check specific cases
  const hasCorrectTransferFee = mappingSchemas.includes('PaymentRequestTransferTransferFee');
  const hasIncorrectTransferFees = mappingSchemas.includes('PaymentRequestTransferTransferFees');
  
  console.log(`✅ Has PaymentRequestTransferTransferFee: ${hasCorrectTransferFee}`);
  console.log(`❌ Has PaymentRequestTransferTransferFees (excess): ${hasIncorrectTransferFees}`);
  
  if (hasCorrectTransferFee && !hasIncorrectTransferFees) {
    console.log('\n🎉 SUCCESS: Excess schema generation has been eliminated!');
  } else {
    console.log('\n❌ ISSUE: Still generating excess schemas');
  }

} catch (error) {
  console.error('Error:', (error as Error).message);
}