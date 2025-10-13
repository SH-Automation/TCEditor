import { describe, it, expect } from 'vitest';
import {
  validateStepName,
  validateStepDescription,
  validateJavaClass,
  validateJavaMethod,
  validateSQLTable,
  validateCatalogStep,
  validateBulkCatalogSteps,
} from '@/validators/catalog.validator';
import { CatalogStep } from '@/models/catalog.model';

describe('Catalog Validator', () => {
  const mockExistingSteps: CatalogStep[] = [
    {
      id: 'step-1',
      name: 'Existing Step',
      description: 'An existing step for testing',
      javaClass: 'com.example.ExistingClass',
      javaMethod: 'existingMethod',
      sqlTables: ['table1'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  describe('validateStepName', () => {
    it('should pass validation for valid unique name', () => {
      const result = validateStepName('New Valid Step', mockExistingSteps);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should fail validation for empty name', () => {
      const result = validateStepName('', mockExistingSteps);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should fail validation for name too short', () => {
      const result = validateStepName('AB', mockExistingSteps);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least 3');
    });

    it('should fail validation for name too long', () => {
      const result = validateStepName('A'.repeat(101), mockExistingSteps);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceed 100');
    });

    it('should fail validation for duplicate name', () => {
      const result = validateStepName('Existing Step', mockExistingSteps);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('should allow duplicate name when editing same step', () => {
      const result = validateStepName('Existing Step', mockExistingSteps, 'step-1');
      expect(result.isValid).toBe(true);
    });

    it('should trim whitespace from name', () => {
      const result = validateStepName('  Valid Name  ', mockExistingSteps);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateStepDescription', () => {
    it('should pass validation for valid description', () => {
      const result = validateStepDescription('This is a valid description with enough characters');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should fail validation for empty description', () => {
      const result = validateStepDescription('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should fail validation for description too short', () => {
      const result = validateStepDescription('Too short');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least 10');
    });

    it('should fail validation for description too long', () => {
      const result = validateStepDescription('A'.repeat(501));
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceed 500');
    });

    it('should trim whitespace from description', () => {
      const result = validateStepDescription('  Valid description with sufficient length  ');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateJavaClass', () => {
    it('should pass validation for simple class name', () => {
      const result = validateJavaClass('MyClass');
      expect(result.isValid).toBe(true);
    });

    it('should pass validation for fully qualified class name', () => {
      const result = validateJavaClass('com.example.MyClass');
      expect(result.isValid).toBe(true);
    });

    it('should pass validation for nested packages', () => {
      const result = validateJavaClass('com.example.sub.package.MyClass');
      expect(result.isValid).toBe(true);
    });

    it('should fail validation for empty class name', () => {
      const result = validateJavaClass('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should fail validation for class name starting with lowercase', () => {
      const result = validateJavaClass('myClass');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid Java class');
    });

    it('should fail validation for class name with special characters', () => {
      const result = validateJavaClass('My-Class');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid Java class');
    });

    it('should fail validation for class name with spaces', () => {
      const result = validateJavaClass('My Class');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid Java class');
    });

    it('should fail validation for package starting with lowercase followed by uppercase', () => {
      const result = validateJavaClass('com.Example.MyClass');
      expect(result.isValid).toBe(false);
    });

    it('should pass validation for class name with numbers', () => {
      const result = validateJavaClass('MyClass123');
      expect(result.isValid).toBe(true);
    });

    it('should pass validation for class name with underscores', () => {
      const result = validateJavaClass('My_Class');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateJavaMethod', () => {
    it('should pass validation for camelCase method name', () => {
      const result = validateJavaMethod('myMethod');
      expect(result.isValid).toBe(true);
    });

    it('should pass validation for method name with numbers', () => {
      const result = validateJavaMethod('myMethod123');
      expect(result.isValid).toBe(true);
    });

    it('should pass validation for method name with underscores', () => {
      const result = validateJavaMethod('my_method');
      expect(result.isValid).toBe(true);
    });

    it('should fail validation for empty method name', () => {
      const result = validateJavaMethod('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should fail validation for method name starting with uppercase', () => {
      const result = validateJavaMethod('MyMethod');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid Java method');
    });

    it('should fail validation for method name with special characters', () => {
      const result = validateJavaMethod('my-method');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid Java method');
    });

    it('should fail validation for method name with spaces', () => {
      const result = validateJavaMethod('my method');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid Java method');
    });

    it('should fail validation for method name starting with number', () => {
      const result = validateJavaMethod('123method');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid Java method');
    });
  });

  describe('validateSQLTable', () => {
    it('should pass validation for simple table name', () => {
      const result = validateSQLTable('users');
      expect(result.isValid).toBe(true);
    });

    it('should pass validation for table name with underscores', () => {
      const result = validateSQLTable('user_accounts');
      expect(result.isValid).toBe(true);
    });

    it('should pass validation for schema.table format', () => {
      const result = validateSQLTable('public.users');
      expect(result.isValid).toBe(true);
    });

    it('should pass validation for table name with numbers', () => {
      const result = validateSQLTable('table123');
      expect(result.isValid).toBe(true);
    });

    it('should pass validation for table name starting with underscore', () => {
      const result = validateSQLTable('_users');
      expect(result.isValid).toBe(true);
    });

    it('should fail validation for empty table name', () => {
      const result = validateSQLTable('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should fail validation for table name with spaces', () => {
      const result = validateSQLTable('user accounts');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid SQL table');
    });

    it('should fail validation for table name with hyphens', () => {
      const result = validateSQLTable('user-accounts');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid SQL table');
    });

    it('should fail validation for table name starting with number', () => {
      const result = validateSQLTable('123users');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid SQL table');
    });

    it('should fail validation for table name too long', () => {
      const result = validateSQLTable('a'.repeat(129));
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceed 128');
    });
  });

  describe('validateCatalogStep', () => {
    it('should pass validation for complete valid step', () => {
      const input = {
        name: 'New Test Step',
        description: 'A comprehensive test step description',
        javaClass: 'com.example.TestClass',
        javaMethod: 'testMethod',
        sqlTables: ['users', 'orders'],
      };
      const result = validateCatalogStep(input, mockExistingSteps);
      expect(result.isValid).toBe(true);
    });

    it('should fail validation when name is invalid', () => {
      const input = {
        name: '',
        description: 'A comprehensive test step description',
        javaClass: 'com.example.TestClass',
        javaMethod: 'testMethod',
        sqlTables: [],
      };
      const result = validateCatalogStep(input, mockExistingSteps);
      expect(result.isValid).toBe(false);
    });

    it('should fail validation when description is invalid', () => {
      const input = {
        name: 'Valid Name',
        description: 'Short',
        javaClass: 'com.example.TestClass',
        javaMethod: 'testMethod',
        sqlTables: [],
      };
      const result = validateCatalogStep(input, mockExistingSteps);
      expect(result.isValid).toBe(false);
    });

    it('should fail validation when java class is invalid', () => {
      const input = {
        name: 'Valid Name',
        description: 'A comprehensive test step description',
        javaClass: 'invalid-class',
        javaMethod: 'testMethod',
        sqlTables: [],
      };
      const result = validateCatalogStep(input, mockExistingSteps);
      expect(result.isValid).toBe(false);
    });

    it('should fail validation when java method is invalid', () => {
      const input = {
        name: 'Valid Name',
        description: 'A comprehensive test step description',
        javaClass: 'com.example.TestClass',
        javaMethod: 'InvalidMethod',
        sqlTables: [],
      };
      const result = validateCatalogStep(input, mockExistingSteps);
      expect(result.isValid).toBe(false);
    });

    it('should fail validation when SQL table is invalid', () => {
      const input = {
        name: 'Valid Name',
        description: 'A comprehensive test step description',
        javaClass: 'com.example.TestClass',
        javaMethod: 'testMethod',
        sqlTables: ['123invalid'],
      };
      const result = validateCatalogStep(input, mockExistingSteps);
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateBulkCatalogSteps', () => {
    it('should validate multiple valid steps', () => {
      const inputs = [
        {
          name: 'Step One',
          description: 'First step description',
          javaClass: 'com.example.StepOne',
          javaMethod: 'stepOne',
          sqlTables: ['table1'],
        },
        {
          name: 'Step Two',
          description: 'Second step description',
          javaClass: 'com.example.StepTwo',
          javaMethod: 'stepTwo',
          sqlTables: ['table2'],
        },
      ];
      const results = validateBulkCatalogSteps(inputs, mockExistingSteps);
      expect(results.get(0)?.isValid).toBe(true);
      expect(results.get(1)?.isValid).toBe(true);
    });

    it('should detect duplicate names within import batch', () => {
      const inputs = [
        {
          name: 'Duplicate Name',
          description: 'First step description',
          javaClass: 'com.example.StepOne',
          javaMethod: 'stepOne',
          sqlTables: [],
        },
        {
          name: 'Duplicate Name',
          description: 'Second step description',
          javaClass: 'com.example.StepTwo',
          javaMethod: 'stepTwo',
          sqlTables: [],
        },
      ];
      const results = validateBulkCatalogSteps(inputs, mockExistingSteps);
      expect(results.get(0)?.isValid).toBe(true);
      expect(results.get(1)?.isValid).toBe(false);
      expect(results.get(1)?.error).toContain('Duplicate step name');
    });

    it('should detect conflicts with existing steps', () => {
      const inputs = [
        {
          name: 'Existing Step',
          description: 'This conflicts with existing',
          javaClass: 'com.example.TestClass',
          javaMethod: 'testMethod',
          sqlTables: [],
        },
      ];
      const results = validateBulkCatalogSteps(inputs, mockExistingSteps);
      expect(results.get(0)?.isValid).toBe(false);
      expect(results.get(0)?.error).toContain('already exists');
    });

    it('should validate each step independently', () => {
      const inputs = [
        {
          name: 'Valid Step',
          description: 'This is a valid step',
          javaClass: 'com.example.ValidClass',
          javaMethod: 'validMethod',
          sqlTables: [],
        },
        {
          name: 'Invalid',
          description: 'Short',
          javaClass: 'invalid-class',
          javaMethod: 'InvalidMethod',
          sqlTables: [],
        },
      ];
      const results = validateBulkCatalogSteps(inputs, mockExistingSteps);
      expect(results.get(0)?.isValid).toBe(true);
      expect(results.get(1)?.isValid).toBe(false);
    });
  });
});
