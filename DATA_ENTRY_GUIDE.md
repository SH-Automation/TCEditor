# Dynamic Data Entry Guide

## Overview

The Dynamic Data Entry feature provides an automatically-generated grid interface for managing test data in SQL Server tables. The system introspects table schemas using `INFORMATION_SCHEMA.COLUMNS` and dynamically builds data entry forms with proper validation and type checking.

## Key Features

### 1. Automatic Schema Introspection

The system queries SQL Server's information schema to retrieve:
- Column names and data types
- Nullable constraints (IS_NULLABLE)
- Primary key identification
- Foreign key relationships
- Default values
- Identity columns
- Maximum length constraints

**SQL Query Used:**
```sql
SELECT 
  c.COLUMN_NAME,
  c.DATA_TYPE,
  c.CHARACTER_MAXIMUM_LENGTH,
  c.IS_NULLABLE,
  c.COLUMN_DEFAULT,
  CASE WHEN pk.COLUMN_NAME IS NOT NULL THEN 1 ELSE 0 END as isPrimaryKey,
  CASE WHEN fk.COLUMN_NAME IS NOT NULL THEN 1 ELSE 0 END as isForeignKey,
  fk.REFERENCED_TABLE_NAME,
  fk.REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS c
LEFT JOIN (primary key subquery) pk ...
LEFT JOIN (foreign key subquery) fk ...
WHERE c.TABLE_NAME = @tableName
ORDER BY c.ORDINAL_POSITION
```

### 2. Dynamic Grid Generation

The data grid automatically adapts to the table schema:
- **Column Headers**: Display column names with badges for PK, FK, and required fields
- **Data Types**: Render appropriate input controls (text, number, checkbox, date)
- **Validation**: Enforce data type constraints and nullable rules
- **Visual Indicators**: 
  - 🔑 for Primary Keys
  - 🔗 for Foreign Keys
  - * for Required (NOT NULL) fields

### 3. CRUD Operations

All operations use prepared statements for SQL injection prevention:

#### Insert Row
```typescript
INSERT INTO {tableName} (column1, column2, ...)
VALUES (@param0, @param1, ...)
```

#### Update Row
```typescript
UPDATE {tableName}
SET column1 = @param0, column2 = @param1, ...
WHERE {primaryKeyColumn} = @primaryKey
```

#### Delete Row
```typescript
DELETE FROM {tableName}
WHERE {primaryKeyColumn} = @primaryKey
```

#### Query Data
```typescript
SELECT TOP (@limit) *
FROM {tableName}
WHERE TestCaseId = @testCaseId  -- Optional filter
ORDER BY (SELECT NULL)
```

## Using the Data Entry Screen

### Step 1: Connect to Database

1. Navigate to the **Database** tab
2. Create a new SQL Server connection
3. Activate the connection

### Step 2: Create Catalog Steps with Table Associations

1. Navigate to the **Catalog** tab
2. Create or edit a catalog step
3. In the "SQL Tables" field, add one or more table names (comma-separated)
4. Save the catalog step

### Step 3: Access Data Entry

1. Navigate to the **Data Entry** tab
2. Select a catalog step from the dropdown
3. Choose which associated SQL table to manage
4. The system will automatically introspect the schema and display the data grid

### Step 4: Manage Data

#### Adding a Row
1. Click **Add Row** button
2. Fill in the form with values for each column
3. Required fields are marked with *
4. Primary key fields (if identity) are auto-generated
5. Click **Save** to insert the row

#### Editing a Row
1. Click the **Edit** icon (pencil) on any row
2. Modify values in the form
3. Read-only fields (identity columns) cannot be changed
4. Click **Save** to update the row

#### Deleting a Row
1. Click the **Delete** icon (trash) on any row
2. Confirm the deletion
3. The row is removed using a DELETE statement

#### Refreshing Schema
1. Click **Refresh** to clear the cache
2. System re-introspects the table schema
3. Useful after schema changes in SQL Server

### Step 5: Filter by Test Case (Optional)

1. Switch to the **Filter by Test Case** tab
2. Select a test case from the dropdown
3. The grid shows only rows related to that test case
4. Useful for managing test-specific data

## Data Type Handling

The system maps SQL Server data types to appropriate UI controls:

| SQL Server Type | UI Control | Validation |
|----------------|------------|------------|
| INT, BIGINT, SMALLINT | Number input | Must be valid integer |
| DECIMAL, NUMERIC, FLOAT | Number input | Must be valid decimal |
| VARCHAR, NVARCHAR, CHAR | Text input | Respects max length |
| TEXT, NTEXT | Textarea | Large text entry |
| BIT | Checkbox | True/false values |
| DATETIME, DATETIME2 | Date input | Must be valid date |
| DATE | Date input | Date only |
| UNIQUEIDENTIFIER | Text input | Auto-generated for PKs |

## Validation Rules

### Client-Side Validation

- **Required Fields**: NOT NULL columns must have a value
- **Data Types**: Values must match the column's SQL type
- **Max Length**: String values cannot exceed CHARACTER_MAXIMUM_LENGTH
- **Numeric Ranges**: Integers and decimals must be valid numbers
- **Date Format**: Date/time values must parse correctly

### Server-Side Protection

- **Prepared Statements**: All queries use parameterized inputs
- **SQL Injection Prevention**: Parameters are sanitized before binding
- **Type Coercion**: Values are coerced to match SQL types
- **Transaction Support**: Multiple operations can be wrapped in transactions

## Schema Caching

To optimize performance, table schemas are cached:

- **Cache Duration**: 5 minutes
- **Auto-Refresh**: Click "Refresh" button to clear cache
- **Cache Key**: Table name
- **When to Refresh**: After DDL changes (ALTER TABLE, etc.)

## Security Features

### SQL Injection Prevention

All database operations use prepared statements:

```typescript
const query: PreparedStatement = {
  query: "SELECT * FROM Users WHERE Id = @userId",
  parameters: { userId: userInput }
};
```

The `@` syntax indicates a parameter placeholder that is safely bound.

### Input Sanitization

The `sanitizeParameters` function removes potentially dangerous characters:

```typescript
private sanitizeParameters(params: Record<string, any>) {
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      sanitized[key] = value.replace(/[';]/g, '');
    }
  }
}
```

### Connection Security

- Supports SQL Server encryption (TLS)
- Configurable server certificate trust
- Connection timeout enforcement
- Request timeout limits

## Error Handling

The system provides clear feedback for common errors:

| Error | Message | Resolution |
|-------|---------|------------|
| No connection | "No Database Connection" | Connect to database in Database tab |
| No catalog steps | "No Catalog Steps" | Create catalog steps with table associations |
| Schema introspection fails | "Failed to load table schema" | Check connection and table name |
| Validation error | Specific field errors | Fix invalid data and resubmit |
| Primary key missing | "Cannot delete: No primary key defined" | Ensure table has a primary key |
| Foreign key violation | "Save failed: {error}" | Check referenced table values |

## Best Practices

### 1. Table Design

- Always define a primary key (preferably UNIQUEIDENTIFIER or INT IDENTITY)
- Use meaningful column names
- Set appropriate NULL/NOT NULL constraints
- Define foreign key relationships for data integrity

### 2. Catalog Step Setup

- Associate catalog steps with relevant tables
- Use consistent table naming conventions
- Document table relationships in step descriptions
- Keep SQL table lists updated as schema evolves

### 3. Data Entry Workflow

- Use filtered views for test-case-specific data
- Verify foreign key references before inserting
- Refresh schema cache after DDL changes
- Review validation errors before debugging

### 4. Performance

- Limit result sets (default: 100 rows)
- Use filters to narrow data scope
- Index foreign key columns
- Monitor query execution times

## Troubleshooting

### Schema Not Loading

**Problem**: Grid shows loading spinner indefinitely

**Solutions**:
- Verify database connection is active
- Check table name is spelled correctly
- Ensure user has SELECT permission on INFORMATION_SCHEMA views
- Look for JavaScript console errors

### Cannot Edit Rows

**Problem**: Save button doesn't work or shows errors

**Solutions**:
- Ensure table has a primary key defined
- Check that primary key value exists in the row data
- Verify user has UPDATE permission on the table
- Review validation errors for each field

### Foreign Key Errors

**Problem**: "Foreign key violation" on save

**Solutions**:
- Check that referenced table has the ID you're referencing
- Insert parent records before child records
- Use the foreign key dropdown if available
- Verify cascading delete rules

### Schema Out of Sync

**Problem**: Grid doesn't reflect recent schema changes

**Solutions**:
- Click the **Refresh** button to clear cache
- Wait 5 minutes for automatic cache expiration
- Check that ALTER TABLE statements completed successfully
- Reconnect to the database

## API Reference

### TableSchemaService

**`introspectTable(tableName: string): Promise<TableSchemaInfo>`**
- Queries INFORMATION_SCHEMA for table metadata
- Returns column definitions with data types and constraints
- Caches results for 5 minutes

**`getTableData(tableName: string, filter?: TableDataFilter, limit?: number): Promise<QueryResult<TableRow[]>>`**
- Retrieves rows from the specified table
- Supports filtering by test case or custom WHERE clause
- Default limit: 100 rows

**`insertRow(tableName: string, row: TableRow): Promise<QueryResult>`**
- Inserts a new row using prepared statement
- Auto-generates primary keys if needed
- Validates against schema constraints

**`updateRow(tableName: string, row: TableRow, pkColumn: string, pkValue: any): Promise<QueryResult>`**
- Updates an existing row by primary key
- Uses prepared statement with parameterized SET clause
- Validates modified values

**`deleteRow(tableName: string, pkColumn: string, pkValue: any): Promise<QueryResult>`**
- Deletes a row by primary key
- Uses prepared statement for safety
- May fail if foreign key constraints exist

**`validateValue(column: TableColumn, value: any): { valid: boolean; error?: string }`**
- Validates a value against column constraints
- Checks data type, nullability, and length
- Returns validation error messages

**`clearCache(tableName?: string): void`**
- Clears schema cache for one or all tables
- Call after DDL schema changes
- Triggers re-introspection on next access

## Future Enhancements

Potential improvements for the data entry system:

- **Pagination**: Navigate through large result sets
- **Sorting**: Click column headers to sort data
- **Advanced Filtering**: Build complex WHERE clauses with UI
- **Bulk Import**: Upload CSV files to populate tables
- **Export**: Download grid data as CSV or Excel
- **Audit Logging**: Track who modified which rows and when
- **Inline Editing**: Edit cells directly in the grid
- **Relationship Navigation**: Click foreign keys to jump to referenced records
- **Computed Columns**: Display calculated or derived values
- **Custom Validators**: Define business rule validations beyond schema
- **Templates**: Save common row templates for quick insertion
- **Rollback**: Undo recent changes with transaction history
