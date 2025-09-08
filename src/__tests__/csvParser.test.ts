import { buildOpenAPIFromCSVWithMapping } from '../csvParser';

describe('CSV Parser', () => {
  const sampleCSV = `Field name,Type,M/O/C,Description
user,Object,M,User object
user.name,String (50),M,User's full name
user.email,String (100),M,User's email address
user.age,Number,O,User's age
user.profile,Object,O,User profile
user.profile.bio,String (200),O,User biography`;

  const flexibleCSV = `Field name,Data type,M/O/C,Field description
transactionId,String (25),M,Unique identification
amount,Decimal (15,2),M,Transaction amount
isActive,Boolean,O,Active flag`;


  describe('buildOpenAPIFromCSVWithMapping', () => {
    const sampleCSV = `Field name,Type,M/O/C,Description
user.name,String (50),M,User's full name
user.email,String (100),M,User's email address
amount,Number,M,Transaction amount`;

    const columnMapping = {
      'Field name': 'fieldName',
      'Type': 'type',
      'M/O/C': 'mandatory',
      'Description': 'description'
    };

    it('should use base model name for root class', () => {
      const result = buildOpenAPIFromCSVWithMapping(sampleCSV, columnMapping, 'PaymentRequest');
      
      expect(result.components.schemas.PaymentRequest).toBeDefined();
      expect(result.components.schemas.PaymentRequestUser).toBeDefined();
      
      // Base model should contain amount and user object
      expect(result.components.schemas.PaymentRequest.properties.amount).toBeDefined();
      expect(result.components.schemas.PaymentRequest.properties.user).toBeDefined();
      expect(result.components.schemas.PaymentRequest.properties.user.$ref).toBe('#/components/schemas/PaymentRequestUser');
    });

    it('should create nested classes with base model prefix', () => {
      const nestedCSV = `Field name,Type,M/O/C,Description
user.profile.firstName,String,M,First name
user.profile.address.street,String,M,Street address
amount,Number,M,Amount`;

      const result = buildOpenAPIFromCSVWithMapping(nestedCSV, columnMapping, 'DirectCreditInitiationRequest');
      
      const schemas = result.components.schemas;
      expect(schemas.DirectCreditInitiationRequest).toBeDefined();
      expect(schemas.DirectCreditInitiationRequestUser).toBeDefined();
      expect(schemas.DirectCreditInitiationRequestUserProfile).toBeDefined();
      expect(schemas.DirectCreditInitiationRequestUserProfileAddress).toBeDefined();
      
      // Check relationships
      expect(schemas.DirectCreditInitiationRequest.properties.user.$ref).toBe('#/components/schemas/DirectCreditInitiationRequestUser');
      expect(schemas.DirectCreditInitiationRequestUser.properties.profile.$ref).toBe('#/components/schemas/DirectCreditInitiationRequestUserProfile');
      expect(schemas.DirectCreditInitiationRequestUserProfile.properties.address.$ref).toBe('#/components/schemas/DirectCreditInitiationRequestUserProfileAddress');
      
      // Final properties
      expect(schemas.DirectCreditInitiationRequestUserProfileAddress.properties.street).toBeDefined();
      expect(schemas.DirectCreditInitiationRequest.properties.amount).toBeDefined();
    });

    it('should handle custom column mappings', () => {
      const customCSV = `Name,DataType,Required,Note
user.email,String,Y,Email address
transactionId,String,Y,Transaction ID`;

      const customMapping = {
        'Name': 'fieldName',
        'DataType': 'type',
        'Required': 'mandatory',
        'Note': 'description'
      };

      const result = buildOpenAPIFromCSVWithMapping(customCSV, customMapping, 'CustomRequest');
      
      expect(result.components.schemas.CustomRequest).toBeDefined();
      expect(result.components.schemas.CustomRequestUser).toBeDefined();
      expect(result.components.schemas.CustomRequest.properties.transactionId).toBeDefined();
      expect(result.components.schemas.CustomRequestUser.properties.email).toBeDefined();
    });

    it('should validate required mappings', () => {
      const incompleteMapping = {
        'Field name': 'fieldName'
        // Missing 'type' mapping
      };

      expect(() => {
        buildOpenAPIFromCSVWithMapping(sampleCSV, incompleteMapping, 'TestRequest');
      }).toThrow(); // Should throw because no 'type' mapping is provided
    });

    it('should set API info based on base model name', () => {
      const result = buildOpenAPIFromCSVWithMapping(sampleCSV, columnMapping, 'PaymentRequest');
      
      expect(result.info.title).toBe('PaymentRequest API');
      expect(result.info.version).toBe('1.0.0');
    });

    it('should handle array fields with base model mapping', () => {
      const arrayMappingCSV = `Field name,Type,M/O/C,Description
transferList[ ],Array Object,M,List of transfers
transferList[ ].amount,Number,M,Transfer amount
transferList[ ].currency,String (3),M,Currency code
metadata.tags[ ],Array String (20),O,Metadata tags`;

      const result = buildOpenAPIFromCSVWithMapping(arrayMappingCSV, columnMapping, 'BulkTransfer');
      
      const baseSchema = result.components.schemas.BulkTransfer;
      const transferSchema = result.components.schemas.BulkTransferTransfer;
      const metadataSchema = result.components.schemas.BulkTransferMetadata;
      
      // Base schema should have transferList array and metadata object
      expect(baseSchema.properties.transferList.type).toBe('array');
      expect(baseSchema.properties.transferList.items.$ref).toBe('#/components/schemas/BulkTransferTransfer');
      expect(baseSchema.properties.metadata).toBeDefined();
      
      // Transfer element should have amount and currency
      expect(transferSchema.properties.amount.type).toBe('number');
      expect(transferSchema.properties.currency.type).toBe('string');
      expect(transferSchema.properties.currency.maxLength).toBe(3);
      
      // Metadata should have tags array
      expect(metadataSchema.properties.tags.type).toBe('array');
      expect(metadataSchema.properties.tags.items.type).toBe('string');
      expect(metadataSchema.properties.tags.items.maxLength).toBe(20);
      
      // Required fields
      expect(baseSchema.required).toContain('transferList');
      expect(transferSchema.required).toContain('amount');
      expect(transferSchema.required).toContain('currency');
      expect(metadataSchema.required || []).not.toContain('tags');
    });
  });
});