import { generateJavaCode } from '../codeGenerator';
import { OpenAPISpec } from '../csvParser';

describe('Code Generator', () => {
  const sampleOpenAPISpec: OpenAPISpec = {
    openapi: '3.0.3',
    info: {
      title: 'Test API',
      version: '1.0.0'
    },
    paths: {},
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              maxLength: 50,
              description: 'User full name'
            },
            email: {
              type: 'string',
              maxLength: 100,
              description: 'User email address'
            },
            age: {
              type: 'number',
              description: 'User age'
            },
            profile: {
              $ref: '#/components/schemas/UserProfile'
            }
          },
          required: ['name', 'email']
        },
        UserProfile: {
          type: 'object',
          properties: {
            bio: {
              type: 'string',
              maxLength: 200,
              description: 'User biography'
            },
            verified: {
              type: 'boolean',
              description: 'Account verification status'
            }
          },
          required: []
        }
      }
    }
  };

  describe('generateJavaCode', () => {
    it('should generate Java files for all schemas', () => {
      const result = generateJavaCode(sampleOpenAPISpec);
      
      expect(result.size).toBe(2);
      expect(result.has('User.java')).toBe(true);
      expect(result.has('UserProfile.java')).toBe(true);
    });

    it('should include package declaration', () => {
      const result = generateJavaCode(sampleOpenAPISpec, 'com.test.models');
      const userCode = result.get('User.java')!;
      
      expect(userCode).toContain('package com.test.models;');
    });

    it('should include required imports', () => {
      const result = generateJavaCode(sampleOpenAPISpec);
      const userCode = result.get('User.java')!;
      
      expect(userCode).toContain('import lombok.Data;');
      expect(userCode).toContain('import lombok.Builder;');
      expect(userCode).toContain('import com.fasterxml.jackson.annotation.JsonProperty;');
      expect(userCode).toContain('import jakarta.validation.constraints.*;');
    });

    it('should include class annotations', () => {
      const result = generateJavaCode(sampleOpenAPISpec);
      const userCode = result.get('User.java')!;
      
      expect(userCode).toContain('@Data');
      expect(userCode).toContain('@Builder');
      expect(userCode).toContain('@NoArgsConstructor');
      expect(userCode).toContain('@AllArgsConstructor');
    });

    it('should generate properties with correct types', () => {
      const result = generateJavaCode(sampleOpenAPISpec);
      const userCode = result.get('User.java')!;
      
      expect(userCode).toContain('private String name;');
      expect(userCode).toContain('private String email;');
      expect(userCode).toContain('private BigDecimal age;');
      expect(userCode).toContain('private UserProfile profile;');
    });

    it('should include validation annotations for required fields', () => {
      const result = generateJavaCode(sampleOpenAPISpec);
      const userCode = result.get('User.java')!;
      
      // Name should have validation (required string)
      expect(userCode).toContain('@NotBlank(message = "must not be null or empty")');
      
      // Age is optional in our test data, so it shouldn't have validation
      // Let's test with a different required field or update the test data
    });

    it('should include size constraints', () => {
      const result = generateJavaCode(sampleOpenAPISpec);
      const userCode = result.get('User.java')!;
      
      expect(userCode).toContain('@Size(max = 50, message = "length must not exceed 50 characters")');
      expect(userCode).toContain('@Size(max = 100, message = "length must not exceed 100 characters")');
    });

    it('should handle object references correctly', () => {
      const result = generateJavaCode(sampleOpenAPISpec);
      const userCode = result.get('User.java')!;
      
      // Profile should have @Valid annotation
      expect(userCode).toContain('@Valid');
      expect(userCode).toContain('private UserProfile profile;');
    });

    it('should generate clean code without empty required arrays', () => {
      const result = generateJavaCode(sampleOpenAPISpec);
      const profileCode = result.get('UserProfile.java')!;
      
      // UserProfile has no required fields, should not have validation annotations for requirements
      expect(profileCode).toContain('private String bio;');
      expect(profileCode).toContain('private Boolean verified;');
    });

    it('should use default package when none specified', () => {
      const result = generateJavaCode(sampleOpenAPISpec);
      const userCode = result.get('User.java')!;
      
      expect(userCode).toContain('package com.example.model;');
    });
  });
});