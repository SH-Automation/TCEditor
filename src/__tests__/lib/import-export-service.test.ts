import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImportExportService } from '@/lib/import-export-service';
import { CatalogStep, TestCase, TestStepMembership } from '@/lib/types';
import { ColumnMapping } from '@/lib/import-export-types';

vi.mock('papaparse', () => ({
  default: {
    parse: vi.fn(),
    unparse: vi.fn((data: any) => 'mocked,csv,data'),
  },
}));

describe('ImportExportService', () => {
  let service: ImportExportService;

  beforeEach(() => {
    service = new ImportExportService();
    vi.clearAllMocks();
  });

  describe('CSV Parsing', () => {
    it('should parse CSV file preview', async () => {
      const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
      const Papa = (await import('papaparse')).default;

      vi.mocked(Papa.parse).mockImplementation((file: any, config: any) => {
        if (config.preview === 10) {
          config.complete({
            data: [
              { id: '1', name: 'Test 1' },
              { id: '2', name: 'Test 2' },
            ],
            meta: { fields: ['id', 'name'] },
          });
        } else {
          config.complete({
            data: [
              { id: '1', name: 'Test 1' },
              { id: '2', name: 'Test 2' },
              { id: '3', name: 'Test 3' },
            ],
            meta: { fields: ['id', 'name'] },
          });
        }
      });

      const preview = await service.parseCSV(mockFile);
      expect(preview.headers).toEqual(['id', 'name']);
      expect(preview.totalRows).toBe(3);
      expect(preview.sampleData.length).toBeLessThanOrEqual(5);
    });

    it('should handle CSV parse errors', async () => {
      const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
      const Papa = (await import('papaparse')).default;

      vi.mocked(Papa.parse).mockImplementation((file: any, config: any) => {
        config.error(new Error('Parse error'));
      });

      await expect(service.parseCSV(mockFile)).rejects.toThrow('Parse error');
    });
  });

  describe('Data Import', () => {
    it('should import valid catalog steps', async () => {
      const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
      const Papa = (await import('papaparse')).default;

      vi.mocked(Papa.parse).mockImplementation((file: any, config: any) => {
        config.complete({
          data: [
            {
              id: 'step-1',
              name: 'Test Step',
              description: 'Test description',
              javaClass: 'com.example.TestClass',
              javaMethod: 'testMethod',
              sqlTables: 'table1,table2',
            },
          ],
        });
      });

      const existingData = {
        catalogSteps: [] as CatalogStep[],
        testCases: [] as TestCase[],
        memberships: [] as TestStepMembership[],
      };

      const mappings: ColumnMapping[] = [
        { sourceColumn: 'id', targetTable: 'catalog-steps', targetField: 'id' },
        { sourceColumn: 'name', targetTable: 'catalog-steps', targetField: 'name' },
        { sourceColumn: 'description', targetTable: 'catalog-steps', targetField: 'description' },
        { sourceColumn: 'javaClass', targetTable: 'catalog-steps', targetField: 'javaClass' },
        { sourceColumn: 'javaMethod', targetTable: 'catalog-steps', targetField: 'javaMethod' },
        { sourceColumn: 'sqlTables', targetTable: 'catalog-steps', targetField: 'sqlTables' },
      ];

      const result = await service.importData(mockFile, mappings, existingData);
      expect(result.success).toBe(true);
      expect(result.imported).toBe(1);
      expect(result.failed).toBe(0);
      expect(existingData.catalogSteps).toHaveLength(1);
      expect(existingData.catalogSteps[0].name).toBe('Test Step');
    });

    it('should import valid test cases', async () => {
      const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
      const Papa = (await import('papaparse')).default;

      vi.mocked(Papa.parse).mockImplementation((file: any, config: any) => {
        config.complete({
          data: [
            {
              id: 'test-1',
              name: 'Test Case',
              description: 'Test case description',
            },
          ],
        });
      });

      const existingData = {
        catalogSteps: [] as CatalogStep[],
        testCases: [] as TestCase[],
        memberships: [] as TestStepMembership[],
      };

      const mappings: ColumnMapping[] = [
        { sourceColumn: 'id', targetTable: 'test-cases', targetField: 'id' },
        { sourceColumn: 'name', targetTable: 'test-cases', targetField: 'name' },
        { sourceColumn: 'description', targetTable: 'test-cases', targetField: 'description' },
      ];

      const result = await service.importData(mockFile, mappings, existingData);
      expect(result.success).toBe(true);
      expect(result.imported).toBe(1);
      expect(existingData.testCases).toHaveLength(1);
      expect(existingData.testCases[0].name).toBe('Test Case');
    });

    it('should import valid test memberships', async () => {
      const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
      const Papa = (await import('papaparse')).default;

      vi.mocked(Papa.parse).mockImplementation((file: any, config: any) => {
        config.complete({
          data: [
            {
              id: 'mem-1',
              testCaseId: 'test-1',
              catalogStepId: 'step-1',
              processOrder: '1',
            },
          ],
        });
      });

      const existingData = {
        catalogSteps: [] as CatalogStep[],
        testCases: [] as TestCase[],
        memberships: [] as TestStepMembership[],
      };

      const mappings: ColumnMapping[] = [
        { sourceColumn: 'id', targetTable: 'test-memberships', targetField: 'id' },
        { sourceColumn: 'testCaseId', targetTable: 'test-memberships', targetField: 'testCaseId' },
        { sourceColumn: 'catalogStepId', targetTable: 'test-memberships', targetField: 'catalogStepId' },
        { sourceColumn: 'processOrder', targetTable: 'test-memberships', targetField: 'processOrder' },
      ];

      const result = await service.importData(mockFile, mappings, existingData);
      expect(result.success).toBe(true);
      expect(result.imported).toBe(1);
      expect(existingData.memberships).toHaveLength(1);
      expect(existingData.memberships[0].processOrder).toBe(1);
    });

    it('should handle import errors gracefully', async () => {
      const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
      const Papa = (await import('papaparse')).default;

      vi.mocked(Papa.parse).mockImplementation((file: any, config: any) => {
        config.complete({
          data: [
            {
              id: 'step-1',
              name: 'Test Step',
            },
          ],
        });
      });

      const existingData = {
        catalogSteps: [] as CatalogStep[],
        testCases: [] as TestCase[],
        memberships: [] as TestStepMembership[],
      };

      const mappings: ColumnMapping[] = [
        { sourceColumn: 'id', targetTable: 'catalog-steps', targetField: 'id' },
        { sourceColumn: 'name', targetTable: 'catalog-steps', targetField: 'name' },
      ];

      const result = await service.importData(mockFile, mappings, existingData);
      expect(result.success).toBe(false);
      expect(result.failed).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should limit error messages to 10', async () => {
      const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
      const Papa = (await import('papaparse')).default;

      const invalidRows = Array.from({ length: 20 }, (_, i) => ({
        id: `step-${i}`,
        name: 'Invalid',
      }));

      vi.mocked(Papa.parse).mockImplementation((file: any, config: any) => {
        config.complete({ data: invalidRows });
      });

      const existingData = {
        catalogSteps: [] as CatalogStep[],
        testCases: [] as TestCase[],
        memberships: [] as TestStepMembership[],
      };

      const mappings: ColumnMapping[] = [
        { sourceColumn: 'id', targetTable: 'catalog-steps', targetField: 'id' },
      ];

      const result = await service.importData(mockFile, mappings, existingData);
      expect(result.errors.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Data Export', () => {
    it('should export data to CSV', () => {
      const mockData = [
        { id: '1', name: 'Test 1', value: 100 },
        { id: '2', name: 'Test 2', value: 200 },
      ];

      const createElementSpy = vi.spyOn(document, 'createElement');
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);

      service.exportToCSV(mockData, 'test.csv');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('should export data to JSON', () => {
      const mockData = [
        { id: '1', name: 'Test 1', value: 100 },
        { id: '2', name: 'Test 2', value: 200 },
      ];

      const createElementSpy = vi.spyOn(document, 'createElement');
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);

      service.exportToJSON(mockData, 'test.json');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('should export single object to JSON', () => {
      const mockData = { config: 'test', value: 123 };

      const createElementSpy = vi.spyOn(document, 'createElement');
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);

      service.exportToJSON(mockData, 'config.json');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });
  });

  describe('Template Generation', () => {
    it('should generate catalog steps template', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);

      service.generateTemplate('catalog-steps');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('should generate test cases template', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);

      service.generateTemplate('test-cases');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('should generate test memberships template', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);

      service.generateTemplate('test-memberships');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });
  });

  describe('Row Validation', () => {
    it('should validate catalog step row with all required fields', () => {
      const validRow = {
        id: 'step-1',
        name: 'Test',
        description: 'Test description',
        javaClass: 'TestClass',
        javaMethod: 'testMethod',
      };

      const result = (service as any).validateRow(validRow, 'catalog-steps');
      expect(result).toBe(true);
    });

    it('should reject catalog step row with missing fields', () => {
      const invalidRow = {
        id: 'step-1',
        name: 'Test',
      };

      const result = (service as any).validateRow(invalidRow, 'catalog-steps');
      expect(result).toBe(false);
    });

    it('should validate test case row with all required fields', () => {
      const validRow = {
        id: 'test-1',
        name: 'Test',
        description: 'Test description',
      };

      const result = (service as any).validateRow(validRow, 'test-cases');
      expect(result).toBe(true);
    });

    it('should reject test case row with missing fields', () => {
      const invalidRow = {
        id: 'test-1',
      };

      const result = (service as any).validateRow(invalidRow, 'test-cases');
      expect(result).toBe(false);
    });

    it('should validate membership row with all required fields', () => {
      const validRow = {
        id: 'mem-1',
        testCaseId: 'test-1',
        catalogStepId: 'step-1',
        processOrder: 1,
      };

      const result = (service as any).validateRow(validRow, 'test-memberships');
      expect(result).toBe(true);
    });

    it('should reject membership row with missing fields', () => {
      const invalidRow = {
        id: 'mem-1',
        testCaseId: 'test-1',
      };

      const result = (service as any).validateRow(invalidRow, 'test-memberships');
      expect(result).toBe(false);
    });
  });

  describe('Entity Creation', () => {
    it('should create catalog step entity with correct structure', () => {
      const row = {
        id: 'step-1',
        name: 'Test Step',
        description: 'Description',
        javaClass: 'TestClass',
        javaMethod: 'testMethod',
        sqlTables: 'table1, table2',
      };

      const entity = (service as any).createEntity(row, 'catalog-steps') as CatalogStep;
      expect(entity.id).toBe('step-1');
      expect(entity.name).toBe('Test Step');
      expect(entity.sqlTables).toEqual(['table1', 'table2']);
      expect(entity.createdAt).toBeInstanceOf(Date);
      expect(entity.updatedAt).toBeInstanceOf(Date);
    });

    it('should create test case entity with correct structure', () => {
      const row = {
        id: 'test-1',
        name: 'Test Case',
        description: 'Description',
      };

      const entity = (service as any).createEntity(row, 'test-cases') as TestCase;
      expect(entity.id).toBe('test-1');
      expect(entity.name).toBe('Test Case');
      expect(entity.createdAt).toBeInstanceOf(Date);
      expect(entity.updatedAt).toBeInstanceOf(Date);
    });

    it('should create membership entity with correct structure', () => {
      const row = {
        id: 'mem-1',
        testCaseId: 'test-1',
        catalogStepId: 'step-1',
        processOrder: '5',
      };

      const entity = (service as any).createEntity(row, 'test-memberships') as TestStepMembership;
      expect(entity.id).toBe('mem-1');
      expect(entity.testCaseId).toBe('test-1');
      expect(entity.catalogStepId).toBe('step-1');
      expect(entity.processOrder).toBe(5);
      expect(entity.createdAt).toBeInstanceOf(Date);
    });

    it('should handle empty SQL tables', () => {
      const row = {
        id: 'step-1',
        name: 'Test Step',
        description: 'Description',
        javaClass: 'TestClass',
        javaMethod: 'testMethod',
        sqlTables: '',
      };

      const entity = (service as any).createEntity(row, 'catalog-steps') as CatalogStep;
      expect(entity.sqlTables).toEqual([]);
    });
  });

  describe('Mapping Transformations', () => {
    it('should group mappings by target table', () => {
      const mappings = [
        { sourceColumn: 'id', targetTable: 'catalog-steps', targetField: 'id' },
        { sourceColumn: 'name', targetTable: 'catalog-steps', targetField: 'name' },
        { sourceColumn: 'testId', targetTable: 'test-cases', targetField: 'id' },
      ];

      const grouped = (service as any).groupMappingsByTable(mappings);
      expect(grouped['catalog-steps']).toHaveLength(2);
      expect(grouped['test-cases']).toHaveLength(1);
    });

    it('should transform row according to mappings', () => {
      const row = {
        sourceId: '123',
        sourceName: 'Test',
        sourceValue: 'Value',
      };

      const mappings = [
        { sourceColumn: 'sourceId', targetTable: 'table', targetField: 'id' },
        { sourceColumn: 'sourceName', targetTable: 'table', targetField: 'name' },
      ];

      const transformed = (service as any).transformRow(row, mappings);
      expect(transformed.id).toBe('123');
      expect(transformed.name).toBe('Test');
      expect(transformed.sourceValue).toBeUndefined();
    });
  });
});
