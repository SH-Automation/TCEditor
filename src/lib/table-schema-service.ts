import { PreparedStatement, QueryResult } from './db-types';
import { dbService } from './db-service';

export interface TableColumn {
  columnName: string;
  dataType: string;
  maxLength?: number;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isIdentity: boolean;
  defaultValue?: string;
  foreignKeyReference?: {
    table: string;
    column: string;
  };
}

export interface TableSchemaInfo {
  tableName: string;
  columns: TableColumn[];
  lastUpdated: Date;
}

export interface TableRow {
  [columnName: string]: any;
}

export interface TableDataFilter {
  testCaseId?: string;
  catalogStepId?: string;
  customWhere?: string;
}

class TableSchemaService {
  private schemaCache: Map<string, TableSchemaInfo> = new Map();

  async introspectTable(tableName: string): Promise<TableSchemaInfo> {
    const cached = this.schemaCache.get(tableName);
    if (cached && this.isCacheValid(cached)) {
      return cached;
    }

    const columnsQuery: PreparedStatement = {
      query: `
        SELECT 
          c.COLUMN_NAME as columnName,
          c.DATA_TYPE as dataType,
          c.CHARACTER_MAXIMUM_LENGTH as maxLength,
          c.IS_NULLABLE as isNullable,
          c.COLUMN_DEFAULT as defaultValue,
          CASE WHEN pk.COLUMN_NAME IS NOT NULL THEN 1 ELSE 0 END as isPrimaryKey,
          CASE WHEN fk.COLUMN_NAME IS NOT NULL THEN 1 ELSE 0 END as isForeignKey,
          CASE WHEN c.COLUMN_NAME LIKE '%Id' AND pk.COLUMN_NAME IS NOT NULL THEN 1 ELSE 0 END as isIdentity,
          fk.REFERENCED_TABLE_NAME as fkTable,
          fk.REFERENCED_COLUMN_NAME as fkColumn
        FROM INFORMATION_SCHEMA.COLUMNS c
        LEFT JOIN (
          SELECT ku.TABLE_NAME, ku.COLUMN_NAME
          FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
          INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku
            ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
          WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
        ) pk ON c.TABLE_NAME = pk.TABLE_NAME AND c.COLUMN_NAME = pk.COLUMN_NAME
        LEFT JOIN (
          SELECT 
            ku.TABLE_NAME,
            ku.COLUMN_NAME,
            ku2.TABLE_NAME as REFERENCED_TABLE_NAME,
            ku2.COLUMN_NAME as REFERENCED_COLUMN_NAME
          FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
          INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku
            ON rc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
          INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku2
            ON rc.UNIQUE_CONSTRAINT_NAME = ku2.CONSTRAINT_NAME
        ) fk ON c.TABLE_NAME = fk.TABLE_NAME AND c.COLUMN_NAME = fk.COLUMN_NAME
        WHERE c.TABLE_NAME = @tableName
        ORDER BY c.ORDINAL_POSITION
      `,
      parameters: { tableName },
    };

    const result = await dbService.executeQuery<TableColumn[]>(columnsQuery);

    if (!result.success || !result.data) {
      const mockColumns = this.generateMockSchema(tableName);
      const schema: TableSchemaInfo = {
        tableName,
        columns: mockColumns,
        lastUpdated: new Date(),
      };
      this.schemaCache.set(tableName, schema);
      return schema;
    }

    const columns = Array.isArray(result.data) ? result.data : [];
    const formattedColumns: TableColumn[] = columns.map((col: any) => ({
      columnName: col.columnName,
      dataType: col.dataType,
      maxLength: col.maxLength,
      isNullable: col.isNullable === 'YES' || col.isNullable === true || col.isNullable === 1,
      isPrimaryKey: col.isPrimaryKey === 1 || col.isPrimaryKey === true,
      isForeignKey: col.isForeignKey === 1 || col.isForeignKey === true,
      isIdentity: col.isIdentity === 1 || col.isIdentity === true,
      defaultValue: col.defaultValue,
      foreignKeyReference: (col.isForeignKey === 1 || col.isForeignKey === true) && col.fkTable
        ? { table: col.fkTable, column: col.fkColumn }
        : undefined,
    }));

    const schema: TableSchemaInfo = {
      tableName,
      columns: formattedColumns,
      lastUpdated: new Date(),
    };

    this.schemaCache.set(tableName, schema);
    return schema;
  }

  async getTableData(
    tableName: string,
    filter?: TableDataFilter,
    limit: number = 100
  ): Promise<QueryResult<TableRow[]>> {
    let whereClause = '';
    const params: Record<string, any> = { limit };

    if (filter?.testCaseId) {
      whereClause = 'WHERE TestCaseId = @testCaseId';
      params.testCaseId = filter.testCaseId;
    } else if (filter?.catalogStepId) {
      whereClause = 'WHERE CatalogStepId = @catalogStepId';
      params.catalogStepId = filter.catalogStepId;
    } else if (filter?.customWhere) {
      whereClause = `WHERE ${filter.customWhere}`;
    }

    const query: PreparedStatement = {
      query: `
        SELECT TOP (@limit) *
        FROM ${tableName}
        ${whereClause}
        ORDER BY (SELECT NULL)
      `,
      parameters: params,
    };

    return await dbService.executeQuery<TableRow[]>(query);
  }

  async insertRow(tableName: string, row: TableRow): Promise<QueryResult<any>> {
    const columns = Object.keys(row);
    const values = Object.values(row);
    const paramNames = columns.map((_, i) => `@param${i}`);

    const params: Record<string, any> = {};
    columns.forEach((col, i) => {
      params[`param${i}`] = values[i];
    });

    const query: PreparedStatement = {
      query: `
        INSERT INTO ${tableName} (${columns.join(', ')})
        VALUES (${paramNames.join(', ')})
      `,
      parameters: params,
    };

    return await dbService.executeQuery(query);
  }

  async updateRow(
    tableName: string,
    row: TableRow,
    primaryKeyColumn: string,
    primaryKeyValue: any
  ): Promise<QueryResult<any>> {
    const columns = Object.keys(row).filter(col => col !== primaryKeyColumn);
    const setClauses = columns.map((col, i) => `${col} = @param${i}`);

    const params: Record<string, any> = { primaryKey: primaryKeyValue };
    columns.forEach((col, i) => {
      params[`param${i}`] = row[col];
    });

    const query: PreparedStatement = {
      query: `
        UPDATE ${tableName}
        SET ${setClauses.join(', ')}
        WHERE ${primaryKeyColumn} = @primaryKey
      `,
      parameters: params,
    };

    return await dbService.executeQuery(query);
  }

  async deleteRow(
    tableName: string,
    primaryKeyColumn: string,
    primaryKeyValue: any
  ): Promise<QueryResult<any>> {
    const query: PreparedStatement = {
      query: `
        DELETE FROM ${tableName}
        WHERE ${primaryKeyColumn} = @primaryKey
      `,
      parameters: { primaryKey: primaryKeyValue },
    };

    return await dbService.executeQuery(query);
  }

  clearCache(tableName?: string): void {
    if (tableName) {
      this.schemaCache.delete(tableName);
    } else {
      this.schemaCache.clear();
    }
  }

  private isCacheValid(schema: TableSchemaInfo): boolean {
    const cacheMaxAge = 5 * 60 * 1000;
    return Date.now() - schema.lastUpdated.getTime() < cacheMaxAge;
  }

  private generateMockSchema(tableName: string): TableColumn[] {
    const baseColumns: TableColumn[] = [
      {
        columnName: 'Id',
        dataType: 'uniqueidentifier',
        isNullable: false,
        isPrimaryKey: true,
        isForeignKey: false,
        isIdentity: true,
      },
      {
        columnName: 'Name',
        dataType: 'nvarchar',
        maxLength: 255,
        isNullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        isIdentity: false,
      },
      {
        columnName: 'Description',
        dataType: 'nvarchar',
        maxLength: 1000,
        isNullable: true,
        isPrimaryKey: false,
        isForeignKey: false,
        isIdentity: false,
      },
      {
        columnName: 'CreatedAt',
        dataType: 'datetime2',
        isNullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        isIdentity: false,
        defaultValue: 'GETUTCDATE()',
      },
    ];

    if (tableName.includes('Membership') || tableName.includes('Step')) {
      baseColumns.splice(1, 0, {
        columnName: 'TestCaseId',
        dataType: 'uniqueidentifier',
        isNullable: false,
        isPrimaryKey: false,
        isForeignKey: true,
        isIdentity: false,
        foreignKeyReference: { table: 'TestCases', column: 'Id' },
      });
    }

    return baseColumns;
  }

  validateValue(column: TableColumn, value: any): { valid: boolean; error?: string } {
    if (value === null || value === undefined || value === '') {
      if (!column.isNullable) {
        return { valid: false, error: `${column.columnName} is required` };
      }
      return { valid: true };
    }

    switch (column.dataType.toLowerCase()) {
      case 'int':
      case 'bigint':
      case 'smallint':
      case 'tinyint':
        if (isNaN(Number(value))) {
          return { valid: false, error: 'Must be a valid number' };
        }
        break;

      case 'decimal':
      case 'numeric':
      case 'float':
      case 'real':
        if (isNaN(Number(value))) {
          return { valid: false, error: 'Must be a valid decimal number' };
        }
        break;

      case 'varchar':
      case 'nvarchar':
      case 'char':
      case 'nchar':
        if (column.maxLength && String(value).length > column.maxLength) {
          return { valid: false, error: `Maximum length is ${column.maxLength}` };
        }
        break;

      case 'datetime':
      case 'datetime2':
      case 'date':
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return { valid: false, error: 'Must be a valid date' };
        }
        break;

      case 'bit':
        if (value !== true && value !== false && value !== 0 && value !== 1) {
          return { valid: false, error: 'Must be true or false' };
        }
        break;
    }

    return { valid: true };
  }
}

export const tableSchemaService = new TableSchemaService();
