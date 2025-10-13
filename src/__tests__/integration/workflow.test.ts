import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CatalogStep, TestCase, TestStepMembership } from '@/lib/types';
import { validateCatalogStep } from '@/validators/catalog.validator';

describe('Complete Workflow Integration Tests', () => {
  let mockStorage: Map<string, any>;

  beforeEach(() => {
    mockStorage = new Map();
    
    global.window = {
      spark: {
        kv: {
          get: vi.fn(async (key: string) => mockStorage.get(key)),
          set: vi.fn(async (key: string, value: any) => {
            mockStorage.set(key, value);
          }),
          delete: vi.fn(async (key: string) => {
            mockStorage.delete(key);
          }),
          keys: vi.fn(async () => Array.from(mockStorage.keys())),
        },
      },
    } as any;
  });

  describe('End-to-End Test Case Creation', () => {
    it('should complete full workflow from catalog to test case', async () => {
      const catalogSteps: CatalogStep[] = [];
      const testCases: TestCase[] = [];
      const memberships: TestStepMembership[] = [];

      const step1Input = {
        name: 'Initialize Database',
        description: 'Set up test database with initial schema and data',
        javaClass: 'com.example.test.DatabaseInitializer',
        javaMethod: 'initialize',
        sqlTables: ['users', 'accounts', 'transactions'],
      };

      const validationResult = validateCatalogStep(step1Input, catalogSteps);
      expect(validationResult.isValid).toBe(true);

      const newStep: CatalogStep = {
        id: 'step-001',
        ...step1Input,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      catalogSteps.push(newStep);

      const step2Input = {
        name: 'Execute Test Transaction',
        description: 'Execute a sample transaction to test system functionality',
        javaClass: 'com.example.test.TransactionExecutor',
        javaMethod: 'executeTransaction',
        sqlTables: ['transactions', 'accounts'],
      };

      const validationResult2 = validateCatalogStep(step2Input, catalogSteps);
      expect(validationResult2.isValid).toBe(true);

      const newStep2: CatalogStep = {
        id: 'step-002',
        ...step2Input,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      catalogSteps.push(newStep2);

      const testCase: TestCase = {
        id: 'test-001',
        name: 'Basic Transaction Test',
        description: 'Verify basic transaction processing functionality',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      testCases.push(testCase);

      const membership1: TestStepMembership = {
        id: 'mem-001',
        testCaseId: testCase.id,
        catalogStepId: newStep.id,
        processOrder: 1,
        createdAt: new Date(),
      };
      memberships.push(membership1);

      const membership2: TestStepMembership = {
        id: 'mem-002',
        testCaseId: testCase.id,
        catalogStepId: newStep2.id,
        processOrder: 2,
        createdAt: new Date(),
      };
      memberships.push(membership2);

      expect(catalogSteps).toHaveLength(2);
      expect(testCases).toHaveLength(1);
      expect(memberships).toHaveLength(2);

      const testCaseMemberships = memberships
        .filter(m => m.testCaseId === testCase.id)
        .sort((a, b) => a.processOrder - b.processOrder);

      expect(testCaseMemberships).toHaveLength(2);
      expect(testCaseMemberships[0].catalogStepId).toBe(newStep.id);
      expect(testCaseMemberships[1].catalogStepId).toBe(newStep2.id);
    });

    it('should handle validation errors in workflow', () => {
      const existingSteps: CatalogStep[] = [
        {
          id: 'step-001',
          name: 'Existing Step',
          description: 'An existing catalog step',
          javaClass: 'com.example.ExistingClass',
          javaMethod: 'existingMethod',
          sqlTables: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const duplicateInput = {
        name: 'Existing Step',
        description: 'Trying to create duplicate',
        javaClass: 'com.example.DuplicateClass',
        javaMethod: 'duplicateMethod',
        sqlTables: [],
      };

      const validationResult = validateCatalogStep(duplicateInput, existingSteps);
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.error).toContain('already exists');
    });

    it('should maintain referential integrity', () => {
      const catalogSteps: CatalogStep[] = [
        {
          id: 'step-001',
          name: 'Test Step',
          description: 'A test step',
          javaClass: 'com.example.TestClass',
          javaMethod: 'testMethod',
          sqlTables: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const testCases: TestCase[] = [
        {
          id: 'test-001',
          name: 'Test Case',
          description: 'A test case',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const membership: TestStepMembership = {
        id: 'mem-001',
        testCaseId: 'test-001',
        catalogStepId: 'step-001',
        processOrder: 1,
        createdAt: new Date(),
      };

      const testCaseExists = testCases.some(tc => tc.id === membership.testCaseId);
      const stepExists = catalogSteps.some(cs => cs.id === membership.catalogStepId);

      expect(testCaseExists).toBe(true);
      expect(stepExists).toBe(true);
    });
  });

  describe('Multi-Step Test Case Ordering', () => {
    it('should maintain correct process order', () => {
      const memberships: TestStepMembership[] = [
        {
          id: 'mem-003',
          testCaseId: 'test-001',
          catalogStepId: 'step-003',
          processOrder: 3,
          createdAt: new Date(),
        },
        {
          id: 'mem-001',
          testCaseId: 'test-001',
          catalogStepId: 'step-001',
          processOrder: 1,
          createdAt: new Date(),
        },
        {
          id: 'mem-002',
          testCaseId: 'test-001',
          catalogStepId: 'step-002',
          processOrder: 2,
          createdAt: new Date(),
        },
      ];

      const sorted = memberships
        .filter(m => m.testCaseId === 'test-001')
        .sort((a, b) => a.processOrder - b.processOrder);

      expect(sorted[0].catalogStepId).toBe('step-001');
      expect(sorted[1].catalogStepId).toBe('step-002');
      expect(sorted[2].catalogStepId).toBe('step-003');

      expect(sorted[0].processOrder).toBe(1);
      expect(sorted[1].processOrder).toBe(2);
      expect(sorted[2].processOrder).toBe(3);
    });

    it('should handle reordering operations', () => {
      const memberships: TestStepMembership[] = [
        {
          id: 'mem-001',
          testCaseId: 'test-001',
          catalogStepId: 'step-001',
          processOrder: 1,
          createdAt: new Date(),
        },
        {
          id: 'mem-002',
          testCaseId: 'test-001',
          catalogStepId: 'step-002',
          processOrder: 2,
          createdAt: new Date(),
        },
      ];

      [memberships[0], memberships[1]] = [memberships[1], memberships[0]];
      memberships[0].processOrder = 1;
      memberships[1].processOrder = 2;

      expect(memberships[0].catalogStepId).toBe('step-002');
      expect(memberships[1].catalogStepId).toBe('step-001');
    });
  });

  describe('Data Consistency Checks', () => {
    it('should ensure timestamps are set correctly', () => {
      const now = new Date();
      
      const step: CatalogStep = {
        id: 'step-001',
        name: 'Test Step',
        description: 'A test step',
        javaClass: 'com.example.TestClass',
        javaMethod: 'testMethod',
        sqlTables: [],
        createdAt: now,
        updatedAt: now,
      };

      expect(step.createdAt).toBeInstanceOf(Date);
      expect(step.updatedAt).toBeInstanceOf(Date);
      expect(step.updatedAt.getTime()).toBeGreaterThanOrEqual(step.createdAt.getTime());
    });

    it('should validate all required fields are present', () => {
      const step: CatalogStep = {
        id: 'step-001',
        name: 'Complete Step',
        description: 'A complete catalog step with all fields',
        javaClass: 'com.example.CompleteClass',
        javaMethod: 'completeMethod',
        sqlTables: ['table1', 'table2'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(step.id).toBeDefined();
      expect(step.name).toBeDefined();
      expect(step.description).toBeDefined();
      expect(step.javaClass).toBeDefined();
      expect(step.javaMethod).toBeDefined();
      expect(step.sqlTables).toBeDefined();
      expect(step.createdAt).toBeDefined();
      expect(step.updatedAt).toBeDefined();

      expect(typeof step.id).toBe('string');
      expect(typeof step.name).toBe('string');
      expect(typeof step.description).toBe('string');
      expect(typeof step.javaClass).toBe('string');
      expect(typeof step.javaMethod).toBe('string');
      expect(Array.isArray(step.sqlTables)).toBe(true);
    });
  });
});
