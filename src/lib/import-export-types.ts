export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  targetTable: 'catalog-steps' | 'test-cases' | 'test-memberships';
}

export interface ImportPreview {
  headers: string[];
  sampleData: Record<string, any>[];
  totalRows: number;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: string[];
}

export interface ExportOptions {
  format: 'csv' | 'json';
  tables: ('catalog-steps' | 'test-cases' | 'test-memberships')[];
}

export const TABLE_FIELD_DEFINITIONS = {
  'catalog-steps': [
    { field: 'id', label: 'ID', required: true, description: 'Unique identifier' },
    { field: 'name', label: 'Name', required: true, description: 'Step name' },
    { field: 'description', label: 'Description', required: true, description: 'Step description' },
    { field: 'javaClass', label: 'Java Class', required: true, description: 'Java class reference' },
    { field: 'javaMethod', label: 'Java Method', required: true, description: 'Java method name' },
    { field: 'sqlTables', label: 'SQL Tables', required: false, description: 'Comma-separated table names' },
  ],
  'test-cases': [
    { field: 'id', label: 'ID', required: true, description: 'Unique identifier' },
    { field: 'name', label: 'Name', required: true, description: 'Test case name' },
    { field: 'description', label: 'Description', required: true, description: 'Test case description' },
  ],
  'test-memberships': [
    { field: 'id', label: 'ID', required: true, description: 'Unique identifier' },
    { field: 'testCaseId', label: 'Test Case ID', required: true, description: 'Reference to test case' },
    { field: 'catalogStepId', label: 'Catalog Step ID', required: true, description: 'Reference to catalog step' },
    { field: 'processOrder', label: 'Process Order', required: true, description: 'Execution order (number)' },
  ],
} as const;
