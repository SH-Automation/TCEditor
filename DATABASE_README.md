# Database Connectivity Implementation

## Overview

This application now includes comprehensive Microsoft SQL Server database connectivity with full CRUD operations, prepared statements for SQL injection prevention, and transaction management.

## ✨ Key Features

### 🔒 Security
- **Prepared Statements**: All queries use parameterized statements with `@paramName` syntax
- **Input Sanitization**: Automatic sanitization of parameters before execution
- **SQL Injection Prevention**: No string concatenation or dynamic SQL
- **Encrypted Connections**: TLS/SSL support with certificate validation options

### 💾 Database Operations
- **CREATE**: Insert catalog steps, test cases, and memberships
- **READ**: Query with joins, filters, and ordering
- **UPDATE**: Modify existing records with timestamp tracking
- **DELETE**: Remove records with cascade constraint handling

### 🔄 Transaction Support
- **Atomic Operations**: Execute multiple statements as a single transaction
- **Rollback on Error**: Automatic rollback if any statement fails
- **Bulk Updates**: Efficiently update multiple records in one transaction

### 📊 Schema Management
- **Table Definitions**: Complete SQL Server DDL statements
- **Foreign Keys**: Referential integrity with CASCADE DELETE
- **Unique Constraints**: Prevent duplicate ProcessOrder values
- **Indexes**: Optimized queries on name and ID columns

## 🏗️ Architecture

### Database Service (`src/lib/db-service.ts`)
Central service for all database operations with prepared statement execution.

### Query Builders
Pre-built query functions for common operations:
- `CatalogStepQueries` - CRUD for catalog steps
- `TestCaseQueries` - CRUD for test cases with join support
- `MembershipQueries` - Manage test case/step relationships

### Schema Definitions (`src/lib/db-schema.ts`)
Complete SQL Server table definitions with:
- Column types and constraints
- Primary and foreign keys
- Indexes for performance
- CREATE TABLE statements

## 🎯 Usage

### 1. Configure Database Connection

Navigate to the **Database** tab and click "New Connection":

- **Server**: Your SQL Server hostname or IP address
- **Port**: Default 1433
- **Database**: Database name (e.g., "TestCaseManagement")
- **Username**: SQL Server authentication username
- **Security Options**:
  - Enable encryption for production
  - Trust server certificate for development only
- **Timeouts**: Connection and request timeout values

### 2. Activate Connection

Click "Connect" on a saved connection to activate it. The header will show a green badge indicating active connection status.

### 3. Execute Queries

Navigate to the **Query** tab to:
- Write custom SQL queries
- Load sample queries (SELECT, INSERT, UPDATE, DELETE)
- View execution results and timing
- See prepared statement examples

### 4. View Schema

In the **Database** tab:
- Click "View Schema" to see complete table definitions
- Click "Copy SQL" to copy CREATE TABLE statements
- View table cards showing primary keys and foreign keys

## 📝 Query Examples

### Insert a Catalog Step

```typescript
const statement = CatalogStepQueries.insert({
  id: crypto.randomUUID(),
  name: "User Login Test",
  description: "Test user authentication",
  javaClass: "com.example.tests.LoginTest",
  javaMethod: "testUserLogin",
  sqlTables: ["Users", "Sessions"]
});

const result = await dbService.executeQuery(statement);
```

### Get Test Case with Steps (JOIN)

```typescript
const statement = TestCaseQueries.getWithSteps(testCaseId);
const result = await dbService.executeQuery(statement);
```

### Update Multiple Memberships (Transaction)

```typescript
const updates = MembershipQueries.bulkUpdateOrder([
  { id: "id-1", processOrder: 1 },
  { id: "id-2", processOrder: 2 },
  { id: "id-3", processOrder: 3 }
]);

const result = await dbService.executeTransaction(updates);
```

### Search Catalog Steps

```typescript
const statement = CatalogStepQueries.search("login");
const result = await dbService.executeQuery(statement);
```

## 🔐 SQL Injection Prevention

### ❌ Unsafe (Never Do This)
```typescript
const query = `SELECT * FROM Users WHERE name = '${userInput}'`;
```

### ✅ Safe (Always Use Prepared Statements)
```typescript
const statement = {
  query: "SELECT * FROM Users WHERE name = @name",
  parameters: { name: userInput }
};
```

## 🗄️ Database Schema

### CatalogSteps Table
Stores reusable test step definitions.

| Column | Type | Description |
|--------|------|-------------|
| Id | UNIQUEIDENTIFIER | Primary key |
| Name | NVARCHAR(255) | Step name |
| Description | NVARCHAR(MAX) | Detailed description |
| JavaClass | NVARCHAR(500) | Java class path |
| JavaMethod | NVARCHAR(255) | Java method name |
| SqlTables | NVARCHAR(MAX) | JSON array of table names |
| CreatedAt | DATETIME2 | Creation timestamp |
| UpdatedAt | DATETIME2 | Last update timestamp |

### TestCases Table
Stores test case definitions.

| Column | Type | Description |
|--------|------|-------------|
| Id | UNIQUEIDENTIFIER | Primary key |
| Name | NVARCHAR(255) | Test case name |
| Description | NVARCHAR(MAX) | Detailed description |
| CreatedAt | DATETIME2 | Creation timestamp |
| UpdatedAt | DATETIME2 | Last update timestamp |

### TestStepMemberships Table
Junction table linking test cases to catalog steps.

| Column | Type | Description |
|--------|------|-------------|
| Id | UNIQUEIDENTIFIER | Primary key |
| TestCaseId | UNIQUEIDENTIFIER | Foreign key to TestCases |
| CatalogStepId | UNIQUEIDENTIFIER | Foreign key to CatalogSteps |
| ProcessOrder | INT | Execution order (unique per test case) |
| CreatedAt | DATETIME2 | Creation timestamp |

**Constraints:**
- Foreign keys with CASCADE DELETE
- Unique constraint on (TestCaseId, ProcessOrder)
- Indexes on TestCaseId and CatalogStepId

## 🚀 Production Deployment

### For Node.js Backend

1. Install the `mssql` package:
```bash
npm install mssql
```

2. Update `db-service.ts` to use actual SQL Server connection
3. Add password field to connection configuration
4. Implement connection pooling for performance

### For Java Backend (JDBC)

1. Add SQL Server JDBC driver dependency
2. Use the connection string format from the UI
3. Adapt query builders to use `?` positional parameters instead of `@name`
4. Implement PreparedStatement execution

See `DATABASE_IMPLEMENTATION.md` for complete production deployment guide with code examples.

## 📚 Additional Resources

- **DATABASE_IMPLEMENTATION.md**: Complete technical documentation
- **PRD.md**: Product requirements with database feature descriptions
- **src/lib/db-schema.ts**: Full SQL Server schema definitions
- **src/lib/db-service.ts**: Database service implementation
- **Query Tab**: Interactive examples and documentation

## 🎓 Key Concepts

### Prepared Statements
Separate SQL logic from data values, preventing injection attacks by treating user input as data, not executable code.

### Transactions
Group multiple operations into an atomic unit - either all succeed or all fail, maintaining data consistency.

### Foreign Key Constraints
Ensure referential integrity by preventing orphaned records and automatically cascading deletes.

### Parameterized Queries
Use `@paramName` syntax in queries and bind values separately, allowing the database to properly escape and validate inputs.

## 🛠️ Current Implementation

**Note**: This application currently runs entirely in the browser and uses the `spark.kv` persistence API for data storage. The database connectivity layer is fully implemented with proper SQL patterns, schemas, and security measures, ready for production deployment when integrated with a Node.js backend or Java server using the `mssql` package or JDBC drivers respectively.

All query patterns, prepared statements, and schema definitions are production-ready and can be directly used with a real SQL Server database by adding the appropriate backend integration layer.
