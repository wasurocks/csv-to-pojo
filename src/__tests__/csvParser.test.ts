import { buildOpenAPIFromCSV } from '../csvParser';

describe('CSV Parser', () => {
  const sampleCSV = `Field name,Type,M/O/C,Description
user,Object,M,User object
user.name,String (50),M,User's full name
user.email,String (100),M,User's email address
user.age,Number,O,User's age
user.profile,Object,O,User profile
user.profile.bio,String (200),O,User biography`;

  describe('buildOpenAPIFromCSV', () => {
    it('should parse CSV and generate OpenAPI spec', () => {
      const result = buildOpenAPIFromCSV(sampleCSV);
      
      expect(result.openapi).toBe('3.0.3');
      expect(result.info.title).toBe('Generated API');
      expect(result.info.version).toBe('1.0.0');
      expect(result.components.schemas).toBeDefined();
    });

    it('should create proper schema hierarchy', () => {
      const result = buildOpenAPIFromCSV(sampleCSV);
      const schemas = result.components.schemas;
      
      // Should have User, UserProfile schemas
      expect(schemas.User).toBeDefined();
      expect(schemas.UserProfile).toBeDefined();
      
      // User should have properties: name, email, age, profile
      expect(schemas.User.properties.name).toBeDefined();
      expect(schemas.User.properties.email).toBeDefined();
      expect(schemas.User.properties.age).toBeDefined();
      expect(schemas.User.properties.profile).toBeDefined();
      
      // Profile should reference UserProfile
      expect(schemas.User.properties.profile.$ref).toBe('#/components/schemas/UserProfile');
    });

    it('should handle required fields correctly', () => {
      const result = buildOpenAPIFromCSV(sampleCSV);
      const userSchema = result.components.schemas.User;
      
      expect(userSchema.required).toContain('name');
      expect(userSchema.required).toContain('email');
      expect(userSchema.required).not.toContain('age');
    });

    it('should convert types correctly', () => {
      const result = buildOpenAPIFromCSV(sampleCSV);
      const userSchema = result.components.schemas.User;
      
      expect(userSchema.properties.name.type).toBe('string');
      expect(userSchema.properties.name.maxLength).toBe(50);
      expect(userSchema.properties.age.type).toBe('number');
    });

    it('should handle custom title and version', () => {
      const result = buildOpenAPIFromCSV(sampleCSV, 'Test API', '2.0.0');
      
      expect(result.info.title).toBe('Test API');
      expect(result.info.version).toBe('2.0.0');
    });

    it('should skip header and body fields', () => {
      const csvWithHeader = `Field name,Type,M/O/C,Description
header,Object,M,Header object
body,Object,M,Body object
user.name,String,M,User name`;
      
      const result = buildOpenAPIFromCSV(csvWithHeader);
      const schemas = result.components.schemas;
      
      expect(schemas.Header).toBeUndefined();
      expect(schemas.Body).toBeUndefined();
      expect(schemas.User).toBeDefined();
    });

    it('should handle descriptions with HTML entities', () => {
      const csvWithEntities = `Field name,Type,M/O/C,Description
user.name,String,M,"User's &quot;display&quot; name"`;
      
      const result = buildOpenAPIFromCSV(csvWithEntities);
      const nameProperty = result.components.schemas.User.properties.name;
      
      // Note: We're not actually unescaping HTML entities in our current implementation
      expect(nameProperty.description).toBe('User\'s &quot;display&quot; name');
    });
  });

  describe('error handling', () => {
    it('should handle malformed CSV gracefully', () => {
      const malformedCSV = 'Field name,Type\nuser.name'; // Missing columns
      
      // Papa Parse will handle this and we'll get an empty result
      const result = buildOpenAPIFromCSV(malformedCSV);
      expect(result.components.schemas).toEqual({});
    });
  });
});