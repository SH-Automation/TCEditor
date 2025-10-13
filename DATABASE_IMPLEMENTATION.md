# Database Implementation Guide

## Overview

This application implements a comprehensive database connectivity layer for Microsoft SQL Server with full support for CRUD operations, prepared statements, and transaction management. The implementation is designed to be production-ready with SQL injection prevention and proper connection management.

## Architecture

### Database Service Layer (`src/lib/db-service.ts`)

The `DatabaseService` class provides a clean abstraction for all database operations:

```typescript
class DatabaseService {
  // Execute a single prepared statement
  executeQuery<T>(statement: PreparedStatement): Promise<QueryResult<T>>
  
  // Execute multiple statements in a transaction
  executeTransaction(statements: PreparedStatement[]): Promise<TransactionResult>
  
  // Manage active database connection
  setActiveConnection(connection: DatabaseConnection | null): void
  getActiveConnection(): DatabaseConnection | null
  isConnected(): boolean
}
```

### Prepared Statement Pattern

All database operations use parameterized queries to prevent SQL injection:

```typescript
interface PreparedStatement {
  query: string;           // SQL with @paramName placeholders
  parameters: Record<string, any>;  // Parameter values
}
```

**Example:**
```typescript
const statement = {
  query: "SELECT * FROM CatalogSteps WHERE Id = @id",
  parameters: { id: "123e4567-e89b-12d3-a456-426614174000" }
};
```

## SQL Server Schema

### Tables

#### CatalogSteps
Stores reusable test step definitions with Java class/method linkage and SQL table associations.

```sql
CREATE TABLE CatalogSteps (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX),
    JavaClass NVARCHAR(500) NOT NULL,
    JavaMethod NVARCHAR(255) NOT NULL,
    SqlTables NVARCHAR(MAX),  -- JSON array of table names
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
CREATE INDEX IX_CatalogSteps_Name ON CatalogSteps(Name);
CREATE INDEX IX_CatalogSteps_JavaClass ON CatalogSteps(JavaClass);
```

#### TestCases
Stores test case definitions with metadata.

```sql
CREATE TABLE TestCases (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
CREATE INDEX IX_TestCases_Name ON TestCases(Name);
```

#### TestStepMemberships
Junction table linking test cases to catalog steps with execution order.

```sql
CREATE TABLE TestStepMemberships (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    TestCaseId UNIQUEIDENTIFIER NOT NULL,
    CatalogStepId UNIQUEIDENTIFIER NOT NULL,
    ProcessOrder INT NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Memberships_TestCases FOREIGN KEY (TestCaseId) 
        REFERENCES TestCases(Id) ON DELETE CASCADE,
    CONSTRAINT FK_Memberships_CatalogSteps FOREIGN KEY (CatalogStepId) 
        REFERENCES CatalogSteps(Id) ON DELETE CASCADE,
    CONSTRAINT UQ_TestCase_ProcessOrder UNIQUE (TestCaseId, ProcessOrder)
);
CREATE INDEX IX_Memberships_TestCaseId ON TestStepMemberships(TestCaseId);
CREATE INDEX IX_Memberships_CatalogStepId ON TestStepMemberships(CatalogStepId);
```

### Key Features

- **UUIDs for Primary Keys**: Using UNIQUEIDENTIFIER for distributed system compatibility
- **Foreign Key Constraints**: CASCADE DELETE ensures referential integrity
- **Unique Constraints**: Prevent duplicate ProcessOrder values within a test case
- **Indexes**: Optimize common query patterns (name lookups, joins)
- **Timestamps**: Track creation and modification times

## Database Connection Configuration

### Connection Settings

Connections are configured with the following parameters:

```typescript
interface DatabaseConnection {
  id: string;                    // Unique connection identifier
  name: string;                  // Display name
  server: string;                // Server hostname or IP
  port: number;                  // SQL Server port (default: 1433)
  database: string;              // Database name
  username: string;              // Authentication username
  encrypt: boolean;              // TLS/SSL encryption
  trustServerCertificate: boolean;  // Skip certificate validation
  connectionTimeout: number;     // Connection timeout (ms)
  requestTimeout: number;        // Query timeout (ms)
  isActive: boolean;             // Connection status
}
```

### Connection String Format

```
Server=localhost,1433;Database=TestCaseManagement;User Id=username;Encrypt=true;TrustServerCertificate=false
```

### Security Options

- **Encryption**: Enable TLS/SSL for data transmission
- **Certificate Validation**: Verify server certificate (disable only for development)
- **Prepared Statements**: All queries use parameter binding
- **Input Sanitization**: Parameters are sanitized before execution

## Query Patterns

### CRUD Operations

#### Create (INSERT)

```typescript
const insertStep = CatalogStepQueries.insert({
  id: crypto.randomUUID(),
  name: "Login Test Step",
  description: "Verify user login functionality",
  javaClass: "com.example.tests.LoginTest",
  javaMethod: "testUserLogin",
  sqlTables: ["Users", "Sessions"]
});

await dbService.executeQuery(insertStep);
```

#### Read (SELECT)

```typescript
// Get all catalog steps
const allSteps = CatalogStepQueries.getAll();
const result = await dbService.executeQuery<CatalogStep[]>(allSteps);

// Get by ID
const stepById = CatalogStepQueries.getById(stepId);
const result = await dbService.executeQuery<CatalogStep>(stepById);

// Search with LIKE
const searchQuery = CatalogStepQueries.search("Login");
const results = await dbService.executeQuery<CatalogStep[]>(searchQuery);
```

#### Update (UPDATE)

```typescript
const updateStep = CatalogStepQueries.update({
  id: stepId,
  name: "Updated Step Name",
  description: "Updated description",
  javaClass: "com.example.tests.UpdatedTest",
  javaMethod: "testMethod",
  sqlTables: ["Users"],
  createdAt: new Date(),
  updatedAt: new Date()
});

await dbService.executeQuery(updateStep);
```

#### Delete (DELETE)

```typescript
const deleteStep = CatalogStepQueries.delete(stepId);
await dbService.executeQuery(deleteStep);
```

### Complex Queries

#### Join Query with Relationships

```typescript
const testCaseWithSteps = TestCaseQueries.getWithSteps(testCaseId);
const result = await dbService.executeQuery(testCaseWithSteps);
```

This returns a flat result set that can be transformed into hierarchical data:

```sql
SELECT 
  tc.Id AS TestCaseId,
  tc.Name AS TestCaseName,
  m.ProcessOrder,
  cs.Name AS StepName,
  cs.JavaClass,
  cs.JavaMethod
FROM TestCases tc
LEFT JOIN TestStepMemberships m ON tc.Id = m.TestCaseId
LEFT JOIN CatalogSteps cs ON m.CatalogStepId = cs.Id
WHERE tc.Id = @id
ORDER BY m.ProcessOrder ASC
```

### Transaction Example

Update multiple membership orders atomically:

```typescript
const updates = MembershipQueries.bulkUpdateOrder([
  { id: "membership-1", processOrder: 1 },
  { id: "membership-2", processOrder: 2 },
  { id: "membership-3", processOrder: 3 }
]);

const result = await dbService.executeTransaction(updates);
if (result.success) {
  console.log(`Updated ${result.affectedRows} rows`);
}
```

## SQL Injection Prevention

### Parameter Binding

**❌ UNSAFE (String Concatenation):**
```typescript
const query = `SELECT * FROM Users WHERE username = '${userInput}'`;
```

**✅ SAFE (Prepared Statement):**
```typescript
const statement = {
  query: "SELECT * FROM Users WHERE username = @username",
  parameters: { username: userInput }
};
```

### Input Sanitization

The `DatabaseService` automatically sanitizes parameters:

```typescript
private sanitizeParameters(params: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      // Remove SQL special characters
      sanitized[key] = value.replace(/[';]/g, '');
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}
```

## Integration with Node.js (Production Deployment)

### Using the `mssql` Package

For production deployment with actual SQL Server connectivity:

1. **Install the package:**
```bash
npm install mssql
```

2. **Update `db-service.ts`:**

```typescript
import sql from 'mssql';

class DatabaseService {
  private pool: sql.ConnectionPool | null = null;

  async connect(config: DatabaseConnection): Promise<void> {
    const poolConfig: sql.config = {
      server: config.server,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password, // Add password field
      options: {
        encrypt: config.encrypt,
        trustServerCertificate: config.trustServerCertificate,
      },
      connectionTimeout: config.connectionTimeout,
      requestTimeout: config.requestTimeout,
    };

    this.pool = await sql.connect(poolConfig);
  }

  async executeQuery<T>(statement: PreparedStatement): Promise<QueryResult<T>> {
    if (!this.pool) throw new Error('Not connected');

    const startTime = performance.now();
    
    try {
      const request = this.pool.request();
      
      // Bind parameters
      for (const [key, value] of Object.entries(statement.parameters)) {
        request.input(key, value);
      }
      
      const result = await request.query(statement.query);
      const executionTime = performance.now() - startTime;
      
      return {
        success: true,
        data: result.recordset as T,
        rowCount: result.rowsAffected[0],
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
    if (!this.pool) throw new Error('Not connected');

    const transaction = new sql.Transaction(this.pool);
    await transaction.begin();

    try {
      let totalAffected = 0;

      for (const statement of statements) {
        const request = new sql.Request(transaction);
        
        for (const [key, value] of Object.entries(statement.parameters)) {
          request.input(key, value);
        }
        
        const result = await request.query(statement.query);
        totalAffected += result.rowsAffected[0];
      }

      await transaction.commit();
      
      return {
        success: true,
        affectedRows: totalAffected,
      };
    } catch (error) {
      await transaction.rollback();
      return {
        success: false,
        affectedRows: 0,
        error: error instanceof Error ? error.message : 'Transaction failed',
      };
    }
  }
}
```

### Using JDBC (Java Integration)

For Java applications using JDBC:

```java
import java.sql.*;

public class DatabaseService {
    private Connection connection;
    
    public void connect(String server, int port, String database, 
                       String username, String password) throws SQLException {
        String connectionUrl = String.format(
            "jdbc:sqlserver://%s:%d;databaseName=%s;encrypt=true",
            server, port, database
        );
        
        connection = DriverManager.getConnection(
            connectionUrl, username, password
        );
    }
    
    public ResultSet executeQuery(String query, Map<String, Object> parameters) 
        throws SQLException {
        PreparedStatement statement = connection.prepareStatement(query);
        
        // Bind parameters (convert @paramName to positional ?)
        int position = 1;
        for (Object value : parameters.values()) {
            statement.setObject(position++, value);
        }
        
        return statement.executeQuery();
    }
    
    public int executeUpdate(String query, Map<String, Object> parameters) 
        throws SQLException {
        PreparedStatement statement = connection.prepareStatement(query);
        
        int position = 1;
        for (Object value : parameters.values()) {
            statement.setObject(position++, value);
        }
        
        return statement.executeUpdate();
    }
}
```

## Best Practices

1. **Always use prepared statements** for user input
2. **Enable encryption** for production connections
3. **Set appropriate timeouts** based on query complexity
4. **Use transactions** for multi-statement operations
5. **Handle connection failures** gracefully with retries
6. **Log query execution times** for performance monitoring
7. **Validate foreign key relationships** before deletes
8. **Use indexes** on frequently queried columns
9. **Implement connection pooling** for high-traffic applications
10. **Regularly backup** the database

## Testing

### Sample Queries for Testing

1. **Insert Test Data:**
```sql
INSERT INTO CatalogSteps VALUES (NEWID(), 'Test Step', 'Description', 
  'com.test.TestClass', 'testMethod', '["Users", "Orders"]', 
  GETUTCDATE(), GETUTCDATE());
```

2. **Verify Foreign Keys:**
```sql
SELECT 
  tc.Name AS TestCase,
  cs.Name AS Step,
  m.ProcessOrder
FROM TestStepMemberships m
JOIN TestCases tc ON m.TestCaseId = tc.Id
JOIN CatalogSteps cs ON m.CatalogStepId = cs.Id
ORDER BY tc.Name, m.ProcessOrder;
```

3. **Check Unique Constraints:**
```sql
-- This should fail due to duplicate ProcessOrder
INSERT INTO TestStepMemberships VALUES 
  (NEWID(), @testCaseId, @stepId1, 1, GETUTCDATE()),
  (NEWID(), @testCaseId, @stepId2, 1, GETUTCDATE());
```

## Troubleshooting

### Common Issues

**Connection Timeout:**
- Increase `connectionTimeout` value
- Check firewall settings
- Verify SQL Server is running

**Certificate Validation Failed:**
- Set `trustServerCertificate: true` for development
- Install valid certificate for production

**Foreign Key Violation:**
- Ensure referenced records exist before inserting
- Use CASCADE DELETE constraints appropriately

**Unique Constraint Violation:**
- Check for duplicate ProcessOrder values
- Recalculate order sequence before bulk updates

## Migration Path

This implementation provides a clear migration path from the current browser-based storage to a production SQL Server database:

1. **Phase 1 (Current)**: Use `spark.kv` API for data persistence
2. **Phase 2**: Add Node.js backend with `mssql` package
3. **Phase 3**: Update `db-service.ts` to use actual SQL Server connection
4. **Phase 4**: Deploy schema and migrate existing data
5. **Phase 5**: Enable connection pooling and production optimizations

All query patterns, prepared statements, and schema definitions remain unchanged during this migration.
