import { CatalogStep, TestCase, TestStepMembership } from './types';
import { DatabaseConnection, QueryResult, PreparedStatement, TransactionResult } from './db-types';

class DatabaseService {
  private activeConnection: DatabaseConnection | null = null;

  async executeQuery<T>(statement: PreparedStatement): Promise<QueryResult<T>> {
    const startTime = performance.now();
    
    try {
      const sanitizedParams = this.sanitizeParameters(statement.parameters);
      const result = await this.simulateQuery<T>(statement.query, sanitizedParams);
      
      const executionTime = performance.now() - startTime;
      
      return {
        success: true,
        data: result.data,
        rowCount: result.rowCount,
        executionTime,
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
      };
    }
  }

  async executeTransaction(statements: PreparedStatement[]): Promise<TransactionResult> {
    try {
      let totalAffected = 0;
      
      for (const statement of statements) {
        const result = await this.executeQuery(statement);
        if (!result.success) {
          throw new Error(result.error);
        }
        totalAffected += result.rowCount || 0;
      }
      
      return {
        success: true,
        affectedRows: totalAffected,
      };
    } catch (error) {
      return {
        success: false,
        affectedRows: 0,
        error: error instanceof Error ? error.message : 'Transaction failed',
      };
    }
  }

  setActiveConnection(connection: DatabaseConnection | null): void {
    this.activeConnection = connection;
  }

  getActiveConnection(): DatabaseConnection | null {
    return this.activeConnection;
  }

  isConnected(): boolean {
    return this.activeConnection !== null && this.activeConnection.isActive;
  }

  private sanitizeParameters(params: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string') {
        sanitized[key] = value.replace(/[';]/g, '');
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  private async simulateQuery<T>(query: string, params: Record<string, any>): Promise<{ data: T; rowCount: number }> {
    await new Promise(resolve => setTimeout(resolve, 10));
    
    return {
      data: {} as T,
      rowCount: 1,
    };
  }

  buildPreparedStatement(query: string, params: Record<string, any>): PreparedStatement {
    return {
      query,
      parameters: params,
    };
  }
}

export const dbService = new DatabaseService();

export const CatalogStepQueries = {
  getAll: (): PreparedStatement => ({
    query: `
      SELECT Id, Name, Description, JavaClass, JavaMethod, SqlTables, CreatedAt, UpdatedAt
      FROM CatalogSteps
      ORDER BY Name ASC
    `,
    parameters: {},
  }),

  getById: (id: string): PreparedStatement => ({
    query: `
      SELECT Id, Name, Description, JavaClass, JavaMethod, SqlTables, CreatedAt, UpdatedAt
      FROM CatalogSteps
      WHERE Id = @id
    `,
    parameters: { id },
  }),

  insert: (step: Omit<CatalogStep, 'createdAt' | 'updatedAt'>): PreparedStatement => ({
    query: `
      INSERT INTO CatalogSteps (Id, Name, Description, JavaClass, JavaMethod, SqlTables, CreatedAt, UpdatedAt)
      VALUES (@id, @name, @description, @javaClass, @javaMethod, @sqlTables, GETUTCDATE(), GETUTCDATE())
    `,
    parameters: {
      id: step.id,
      name: step.name,
      description: step.description,
      javaClass: step.javaClass,
      javaMethod: step.javaMethod,
      sqlTables: JSON.stringify(step.sqlTables),
    },
  }),

  update: (step: CatalogStep): PreparedStatement => ({
    query: `
      UPDATE CatalogSteps
      SET Name = @name,
          Description = @description,
          JavaClass = @javaClass,
          JavaMethod = @javaMethod,
          SqlTables = @sqlTables,
          UpdatedAt = GETUTCDATE()
      WHERE Id = @id
    `,
    parameters: {
      id: step.id,
      name: step.name,
      description: step.description,
      javaClass: step.javaClass,
      javaMethod: step.javaMethod,
      sqlTables: JSON.stringify(step.sqlTables),
    },
  }),

  delete: (id: string): PreparedStatement => ({
    query: `
      DELETE FROM CatalogSteps WHERE Id = @id
    `,
    parameters: { id },
  }),

  search: (searchTerm: string): PreparedStatement => ({
    query: `
      SELECT Id, Name, Description, JavaClass, JavaMethod, SqlTables, CreatedAt, UpdatedAt
      FROM CatalogSteps
      WHERE Name LIKE @searchTerm
         OR Description LIKE @searchTerm
         OR JavaClass LIKE @searchTerm
      ORDER BY Name ASC
    `,
    parameters: { searchTerm: `%${searchTerm}%` },
  }),
};

export const TestCaseQueries = {
  getAll: (): PreparedStatement => ({
    query: `
      SELECT Id, Name, Description, CreatedAt, UpdatedAt
      FROM TestCases
      ORDER BY Name ASC
    `,
    parameters: {},
  }),

  getById: (id: string): PreparedStatement => ({
    query: `
      SELECT Id, Name, Description, CreatedAt, UpdatedAt
      FROM TestCases
      WHERE Id = @id
    `,
    parameters: { id },
  }),

  insert: (testCase: Omit<TestCase, 'createdAt' | 'updatedAt'>): PreparedStatement => ({
    query: `
      INSERT INTO TestCases (Id, Name, Description, CreatedAt, UpdatedAt)
      VALUES (@id, @name, @description, GETUTCDATE(), GETUTCDATE())
    `,
    parameters: {
      id: testCase.id,
      name: testCase.name,
      description: testCase.description,
    },
  }),

  update: (testCase: TestCase): PreparedStatement => ({
    query: `
      UPDATE TestCases
      SET Name = @name,
          Description = @description,
          UpdatedAt = GETUTCDATE()
      WHERE Id = @id
    `,
    parameters: {
      id: testCase.id,
      name: testCase.name,
      description: testCase.description,
    },
  }),

  delete: (id: string): PreparedStatement => ({
    query: `
      DELETE FROM TestCases WHERE Id = @id
    `,
    parameters: { id },
  }),

  getWithSteps: (id: string): PreparedStatement => ({
    query: `
      SELECT 
        tc.Id AS TestCaseId,
        tc.Name AS TestCaseName,
        tc.Description AS TestCaseDescription,
        tc.CreatedAt AS TestCaseCreatedAt,
        tc.UpdatedAt AS TestCaseUpdatedAt,
        m.Id AS MembershipId,
        m.ProcessOrder,
        m.CreatedAt AS MembershipCreatedAt,
        cs.Id AS StepId,
        cs.Name AS StepName,
        cs.Description AS StepDescription,
        cs.JavaClass,
        cs.JavaMethod,
        cs.SqlTables,
        cs.CreatedAt AS StepCreatedAt,
        cs.UpdatedAt AS StepUpdatedAt
      FROM TestCases tc
      LEFT JOIN TestStepMemberships m ON tc.Id = m.TestCaseId
      LEFT JOIN CatalogSteps cs ON m.CatalogStepId = cs.Id
      WHERE tc.Id = @id
      ORDER BY m.ProcessOrder ASC
    `,
    parameters: { id },
  }),
};

export const MembershipQueries = {
  getAll: (): PreparedStatement => ({
    query: `
      SELECT Id, TestCaseId, CatalogStepId, ProcessOrder, CreatedAt
      FROM TestStepMemberships
      ORDER BY TestCaseId, ProcessOrder ASC
    `,
    parameters: {},
  }),

  getByTestCase: (testCaseId: string): PreparedStatement => ({
    query: `
      SELECT Id, TestCaseId, CatalogStepId, ProcessOrder, CreatedAt
      FROM TestStepMemberships
      WHERE TestCaseId = @testCaseId
      ORDER BY ProcessOrder ASC
    `,
    parameters: { testCaseId },
  }),

  insert: (membership: Omit<TestStepMembership, 'createdAt'>): PreparedStatement => ({
    query: `
      INSERT INTO TestStepMemberships (Id, TestCaseId, CatalogStepId, ProcessOrder, CreatedAt)
      VALUES (@id, @testCaseId, @catalogStepId, @processOrder, GETUTCDATE())
    `,
    parameters: {
      id: membership.id,
      testCaseId: membership.testCaseId,
      catalogStepId: membership.catalogStepId,
      processOrder: membership.processOrder,
    },
  }),

  update: (membership: TestStepMembership): PreparedStatement => ({
    query: `
      UPDATE TestStepMemberships
      SET ProcessOrder = @processOrder
      WHERE Id = @id
    `,
    parameters: {
      id: membership.id,
      processOrder: membership.processOrder,
    },
  }),

  delete: (id: string): PreparedStatement => ({
    query: `
      DELETE FROM TestStepMemberships WHERE Id = @id
    `,
    parameters: { id },
  }),

  deleteByTestCase: (testCaseId: string): PreparedStatement => ({
    query: `
      DELETE FROM TestStepMemberships WHERE TestCaseId = @testCaseId
    `,
    parameters: { testCaseId },
  }),

  bulkUpdateOrder: (memberships: Array<{ id: string; processOrder: number }>): PreparedStatement[] => {
    return memberships.map(m => ({
      query: `
        UPDATE TestStepMemberships
        SET ProcessOrder = @processOrder
        WHERE Id = @id
      `,
      parameters: {
        id: m.id,
        processOrder: m.processOrder,
      },
    }));
  },
};
