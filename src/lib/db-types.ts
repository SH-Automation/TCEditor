export interface DatabaseConnection {
  id: string;
  name: string;
  server: string;
  port: number;
  database: string;
  username: string;
  encrypt: boolean;
  trustServerCertificate: boolean;
  connectionTimeout: number;
  requestTimeout: number;
  isActive: boolean;
  createdAt: Date;
  lastConnected?: Date;
}

export interface QueryResult<T = any> {
  success: boolean;
  data?: T;
  rowCount?: number;
  error?: string;
  executionTime: number;
}

export interface PreparedStatement {
  query: string;
  parameters: Record<string, any>;
}

export interface TransactionResult {
  success: boolean;
  affectedRows: number;
  error?: string;
}

export interface TableSchema {
  tableName: string;
  columns: ColumnDefinition[];
}

export interface ColumnDefinition {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  foreignKeyReference?: {
    table: string;
    column: string;
  };
}

export interface DatabaseStats {
  catalogStepCount: number;
  testCaseCount: number;
  membershipCount: number;
  lastBackup?: Date;
  databaseSize?: string;
}
