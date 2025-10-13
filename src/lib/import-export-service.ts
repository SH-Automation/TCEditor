import Papa from 'papaparse';
import { CatalogStep, TestCase, TestStepMembership } from './types';
import { ColumnMapping, ImportPreview, ImportResult } from './import-export-types';

export class ImportExportService {
  parseCSV(file: File): Promise<ImportPreview> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        preview: 10,
        skipEmptyLines: true,
        complete: (results) => {
          const headers = results.meta.fields || [];
          const sampleData = results.data as Record<string, any>[];
          
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (fullResults) => {
              resolve({
                headers,
                sampleData: sampleData.slice(0, 5),
                totalRows: (fullResults.data as any[]).length,
              });
            },
            error: reject,
          });
        },
        error: reject,
      });
    });
  }

  async importData(
    file: File,
    mappings: ColumnMapping[],
    existingData: {
      catalogSteps: CatalogStep[];
      testCases: TestCase[];
      memberships: TestStepMembership[];
    }
  ): Promise<ImportResult> {
    return new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rows = results.data as Record<string, any>[];
          const errors: string[] = [];
          let imported = 0;
          let failed = 0;

          const groupedMappings = this.groupMappingsByTable(mappings);

          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            
            try {
              for (const [table, tableMappings] of Object.entries(groupedMappings)) {
                const transformedRow = this.transformRow(row, tableMappings);
                
                if (this.validateRow(transformedRow, table as any)) {
                  const entity = this.createEntity(transformedRow, table as any);
                  
                  switch (table) {
                    case 'catalog-steps':
                      existingData.catalogSteps.push(entity as CatalogStep);
                      break;
                    case 'test-cases':
                      existingData.testCases.push(entity as TestCase);
                      break;
                    case 'test-memberships':
                      existingData.memberships.push(entity as TestStepMembership);
                      break;
                  }
                  
                  imported++;
                }
              }
            } catch (error) {
              failed++;
              errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }

          resolve({
            success: errors.length === 0,
            imported,
            failed,
            errors: errors.slice(0, 10),
          });
        },
        error: (error) => {
          resolve({
            success: false,
            imported: 0,
            failed: 0,
            errors: [error.message],
          });
        },
      });
    });
  }

  private groupMappingsByTable(mappings: ColumnMapping[]): Record<string, ColumnMapping[]> {
    const grouped: Record<string, ColumnMapping[]> = {};
    
    for (const mapping of mappings) {
      if (!grouped[mapping.targetTable]) {
        grouped[mapping.targetTable] = [];
      }
      grouped[mapping.targetTable].push(mapping);
    }
    
    return grouped;
  }

  private transformRow(row: Record<string, any>, mappings: ColumnMapping[]): Record<string, any> {
    const transformed: Record<string, any> = {};
    
    for (const mapping of mappings) {
      const value = row[mapping.sourceColumn];
      transformed[mapping.targetField] = value;
    }
    
    return transformed;
  }

  private validateRow(row: Record<string, any>, table: 'catalog-steps' | 'test-cases' | 'test-memberships'): boolean {
    switch (table) {
      case 'catalog-steps':
        return !!(row.id && row.name && row.description && row.javaClass && row.javaMethod);
      case 'test-cases':
        return !!(row.id && row.name && row.description);
      case 'test-memberships':
        return !!(row.id && row.testCaseId && row.catalogStepId && row.processOrder);
      default:
        return false;
    }
  }

  private createEntity(
    row: Record<string, any>,
    table: 'catalog-steps' | 'test-cases' | 'test-memberships'
  ): CatalogStep | TestCase | TestStepMembership {
    const now = new Date();
    
    switch (table) {
      case 'catalog-steps':
        return {
          id: row.id,
          name: row.name,
          description: row.description,
          javaClass: row.javaClass,
          javaMethod: row.javaMethod,
          sqlTables: row.sqlTables ? row.sqlTables.split(',').map((s: string) => s.trim()) : [],
          createdAt: now,
          updatedAt: now,
        } as CatalogStep;
      
      case 'test-cases':
        return {
          id: row.id,
          name: row.name,
          description: row.description,
          createdAt: now,
          updatedAt: now,
        } as TestCase;
      
      case 'test-memberships':
        return {
          id: row.id,
          testCaseId: row.testCaseId,
          catalogStepId: row.catalogStepId,
          processOrder: parseInt(row.processOrder, 10),
          createdAt: now,
        } as TestStepMembership;
      
      default:
        throw new Error('Unknown table type');
    }
  }

  exportToCSV(data: Record<string, any>[], filename: string): void {
    const csv = Papa.unparse(data);
    this.downloadFile(csv, filename, 'text/csv');
  }

  exportToJSON(data: Record<string, any>[] | Record<string, any>, filename: string): void {
    const json = JSON.stringify(data, null, 2);
    this.downloadFile(json, filename, 'application/json');
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  generateTemplate(table: 'catalog-steps' | 'test-cases' | 'test-memberships'): void {
    let headers: string[] = [];
    let sampleRow: Record<string, string> = {};
    
    switch (table) {
      case 'catalog-steps':
        headers = ['id', 'name', 'description', 'javaClass', 'javaMethod', 'sqlTables'];
        sampleRow = {
          id: 'step-001',
          name: 'Sample Step',
          description: 'This is a sample catalog step',
          javaClass: 'com.example.TestClass',
          javaMethod: 'testMethod',
          sqlTables: 'table1, table2',
        };
        break;
      
      case 'test-cases':
        headers = ['id', 'name', 'description'];
        sampleRow = {
          id: 'test-001',
          name: 'Sample Test Case',
          description: 'This is a sample test case',
        };
        break;
      
      case 'test-memberships':
        headers = ['id', 'testCaseId', 'catalogStepId', 'processOrder'];
        sampleRow = {
          id: 'mem-001',
          testCaseId: 'test-001',
          catalogStepId: 'step-001',
          processOrder: '1',
        };
        break;
    }
    
    const csv = Papa.unparse([sampleRow], { columns: headers });
    this.downloadFile(csv, `${table}-template.csv`, 'text/csv');
  }
}

export const importExportService = new ImportExportService();
