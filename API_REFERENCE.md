# API Reference

## Overview

This document provides a complete reference for the data access and validation APIs in the Test Case Management System.

---

## Models

### Common Models

#### `Result<T>`
Generic result type for operations that may fail.

```typescript
interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorDetails?: ValidationError[];
}
```

**Usage:**
```typescript
const result: Result<CatalogStep> = await controller.createStep(data);
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

#### `ValidationError`
Structured validation error information.

```typescript
interface ValidationError {
  field: string;
  message: string;
  suggestion?: string;
  warningLevel: 'error' | 'warning' | 'info';
}
```

#### `Entity`
Base type for all entities with ID and timestamps.

```typescript
interface Entity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Catalog Models

#### `CatalogStep`
Represents a reusable test step in the catalog.

```typescript
interface CatalogStep extends Entity {
  name: string;              // Step name (3-100 chars)
  description: string;       // Step description (10-500 chars)
  javaClass: string;         // Java class reference (1-255 chars)
  javaMethod: string;        // Java method name (1-100 chars)
  sqlTables: string[];       // Array of SQL table names
}
```

**Example:**
```typescript
const step: CatalogStep = {
  id: 'step-123',
  name: 'Verify User Login',
  description: 'Verifies that a user can log in with valid credentials',
  javaClass: 'com.example.tests.LoginTest',
  javaMethod: 'verifyUserLogin',
  sqlTables: ['users', 'sessions'],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};
```

#### `CreateCatalogStepInput`
Input data for creating a new catalog step.

```typescript
interface CreateCatalogStepInput {
  name: string;
  description: string;
  javaClass: string;
  javaMethod: string;
  sqlTables: string[];
}
```

### Test Case Models

#### `TestCase`
Represents a test case that uses catalog steps.

```typescript
interface TestCase extends Entity {
  name: string;          // Test case name (3-200 chars)
  description: string;   // Test case description (10-1000 chars)
}
```

**Note:** Test case ID follows TCID format (e.g., TC-001, PROJECT-TC-001)

#### `TestStepMembership`
Links a catalog step to a test case with execution order.

```typescript
interface TestStepMembership {
  id: string;
  testCaseId: string;       // Reference to TestCase
  catalogStepId: string;    // Reference to CatalogStep
  processOrder: number;     // Execution order (1-9999)
  createdAt: Date;
}
```

#### `TestCaseWithSteps`
Complete test case with all assigned steps.

```typescript
interface TestCaseWithSteps {
  testCase: TestCase;
  steps: Array<{
    membership: TestStepMembership;
    catalogStep: CatalogStep;
  }>;
}
```

---

## Repositories

### BaseRepository<T>

Generic repository providing CRUD operations.

#### `findAll(): Promise<T[]>`
Retrieves all entities.

```typescript
const steps = await catalogRepository.findAll();
```

#### `findById(id: string): Promise<T | undefined>`
Retrieves a single entity by ID.

```typescript
const step = await catalogRepository.findById('step-123');
if (step) {
  console.log(step.name);
}
```

#### `create(item: T): Promise<T>`
Creates a new entity.

```typescript
const newStep = await catalogRepository.create({
  id: 'step-456',
  name: 'Test Step',
  // ... other fields
});
```

#### `update(item: T): Promise<T>`
Updates an existing entity.

```typescript
const updated = await catalogRepository.update({
  ...existingStep,
  name: 'Updated Name',
});
```

#### `delete(id: string): Promise<boolean>`
Deletes an entity by ID. Returns true if deleted, false if not found.

```typescript
const deleted = await catalogRepository.delete('step-123');
if (deleted) {
  console.log('Step deleted');
}
```

#### `exists(id: string): Promise<boolean>`
Checks if an entity exists.

```typescript
const exists = await catalogRepository.exists('step-123');
```

#### `count(): Promise<number>`
Returns the total number of entities.

```typescript
const total = await catalogRepository.count();
```

### CatalogRepository

Extends BaseRepository with catalog-specific operations.

#### `findByFilters(filters: CatalogStepFilters): Promise<CatalogStep[]>`
Finds catalog steps matching the given filters.

```typescript
const steps = await catalogRepository.findByFilters({
  javaClass: 'com.example.LoginTest',
  searchTerm: 'login',
});
```

**Filters:**
```typescript
interface CatalogStepFilters {
  javaClass?: string;     // Filter by Java class
  sqlTable?: string;      // Filter by SQL table
  searchTerm?: string;    // Search in name, description, javaClass, javaMethod
}
```

#### `findByJavaClass(javaClass: string): Promise<CatalogStep[]>`
Finds all steps using a specific Java class.

```typescript
const steps = await catalogRepository.findByJavaClass('com.example.LoginTest');
```

#### `findBySqlTable(sqlTable: string): Promise<CatalogStep[]>`
Finds all steps that reference a specific SQL table.

```typescript
const steps = await catalogRepository.findBySqlTable('users');
```

#### `search(searchTerm: string): Promise<CatalogStep[]>`
Searches across name, description, javaClass, and javaMethod fields.

```typescript
const results = await catalogRepository.search('login');
```

### TestCaseRepository

Extends BaseRepository with test case-specific operations.

#### `findWithSteps(id: string): Promise<TestCaseWithSteps | undefined>`
Retrieves a test case with all its assigned steps.

```typescript
const testCaseWithSteps = await testCaseRepository.findWithSteps('TC-001');
if (testCaseWithSteps) {
  console.log(testCaseWithSteps.testCase.name);
  testCaseWithSteps.steps.forEach(s => {
    console.log(`${s.membership.processOrder}: ${s.catalogStep.name}`);
  });
}
```

#### `search(searchTerm: string): Promise<TestCase[]>`
Searches across ID, name, and description fields.

```typescript
const results = await testCaseRepository.search('login');
```

### MembershipRepository

Manages test step memberships.

#### `findAll(): Promise<TestStepMembership[]>`
Retrieves all memberships.

```typescript
const memberships = await membershipRepository.findAll();
```

#### `findByTestCase(testCaseId: string): Promise<TestStepMembership[]>`
Retrieves all steps for a test case, sorted by process order.

```typescript
const steps = await membershipRepository.findByTestCase('TC-001');
```

#### `findByCatalogStep(catalogStepId: string): Promise<TestStepMembership[]>`
Finds all test cases using a specific catalog step.

```typescript
const usages = await membershipRepository.findByCatalogStep('step-123');
console.log(`Step used in ${usages.length} test cases`);
```

#### `create(membership: Omit<TestStepMembership, 'createdAt'>): Promise<TestStepMembership>`
Creates a new membership.

```typescript
const membership = await membershipRepository.create({
  id: 'mem-123',
  testCaseId: 'TC-001',
  catalogStepId: 'step-456',
  processOrder: 1,
});
```

#### `bulkUpdateOrders(updates: Array<{ id: string; processOrder: number }>): Promise<void>`
Updates process orders for multiple memberships.

```typescript
await membershipRepository.bulkUpdateOrders([
  { id: 'mem-1', processOrder: 1 },
  { id: 'mem-2', processOrder: 2 },
  { id: 'mem-3', processOrder: 3 },
]);
```

#### `deleteByTestCase(testCaseId: string): Promise<number>`
Deletes all memberships for a test case. Returns number of deleted items.

```typescript
const deleted = await membershipRepository.deleteByTestCase('TC-001');
console.log(`Deleted ${deleted} memberships`);
```

#### `deleteByCatalogStep(catalogStepId: string): Promise<number>`
Deletes all memberships using a catalog step. Returns number of deleted items.

```typescript
const deleted = await membershipRepository.deleteByCatalogStep('step-123');
```

---

## React Hooks

### `useRepository<T>(storageKey: string)`

React hook for reactive data access.

```typescript
function MyComponent() {
  const {
    items,
    loading,
    findById,
    create,
    update,
    remove,
    clear,
  } = useRepository<CatalogStep>('catalog-steps');
  
  // items automatically updates when data changes
  return <div>{items.length} steps</div>;
}
```

**Returns:**
- `items: T[]` - Array of entities (reactive)
- `loading: boolean` - Loading state
- `findById: (id: string) => T | undefined` - Find by ID
- `create: (item: T) => void` - Create new entity
- `update: (item: T) => void` - Update entity
- `remove: (id: string) => void` - Delete entity
- `clear: () => void` - Delete all entities

---

## Validators

### Common Validators

#### `validateRequired(value: any, fieldName: string): ValidationResult`
Validates that a value is not empty.

```typescript
const result = validateRequired(name, 'Name');
if (!result.isValid) {
  console.error(result.error); // "Name is required"
}
```

#### `validateLength(value: string, fieldName: string, min?: number, max?: number): ValidationResult`
Validates string length.

```typescript
const result = validateLength(name, 'Name', 3, 100);
```

#### `validatePattern(value: string, pattern: RegExp, fieldName: string, errorMessage: string, suggestion?: string): ValidationResult`
Validates against a regex pattern.

```typescript
const result = validatePattern(
  email,
  /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
  'Email',
  'Invalid email format',
  'Try: user@example.com'
);
```

#### `validateUnique<T>(value: string, items: T[], selector: (item: T) => string, currentId: string | undefined, fieldName: string): ValidationResult`
Validates uniqueness within a collection.

```typescript
const result = validateUnique(
  newName,
  existingSteps,
  step => step.name,
  editingStepId,
  'Step name'
);
```

#### `validateRange(value: number, fieldName: string, min?: number, max?: number): ValidationResult`
Validates numeric range.

```typescript
const result = validateRange(order, 'Process order', 1, 9999);
```

#### `validateInteger(value: number, fieldName: string): ValidationResult`
Validates that a number is an integer.

```typescript
const result = validateInteger(order, 'Process order');
```

### Catalog Validators

#### `validateCatalogStep(input: Partial<CreateCatalogStepInput>, existingSteps: CatalogStep[], currentId?: string): ValidationResult`
Validates complete catalog step data.

```typescript
const result = validateCatalogStep(
  { name, description, javaClass, javaMethod, sqlTables },
  existingSteps,
  editingStepId
);

if (!result.isValid) {
  toast.error(result.error);
  if (result.suggestion) {
    toast.info(result.suggestion);
  }
}
```

#### `validateStepName(value: string, existingSteps: CatalogStep[], currentId?: string): ValidationResult`
Validates step name (3-100 chars, unique).

```typescript
const result = validateStepName(name, existingSteps, editingId);
```

#### `validateJavaClass(value: string): ValidationResult`
Validates Java class name format.

```typescript
const result = validateJavaClass('com.example.MyClass');
```

**Valid formats:**
- `ClassName`
- `com.example.ClassName`
- `com.example.package.ClassName`

#### `validateJavaMethod(value: string): ValidationResult`
Validates Java method name format (camelCase).

```typescript
const result = validateJavaMethod('myTestMethod');
```

#### `validateSQLTable(value: string): ValidationResult`
Validates SQL table name format.

```typescript
const result = validateSQLTable('schema.table_name');
```

**Valid formats:**
- `table_name`
- `schema.table_name`

### Test Case Validators

#### `validateTestCase(input: Partial<CreateTestCaseInput>, existingTestCases: TestCase[], currentId?: string): ValidationResult`
Validates complete test case data.

```typescript
const result = validateTestCase(
  { id: 'TC-001', name, description },
  existingTestCases,
  editingId
);
```

#### `validateTestCaseName(value: string, existingTestCases: TestCase[], currentId?: string): ValidationResult`
Validates test case name (3-200 chars, preferably unique).

```typescript
const result = validateTestCaseName(name, existingTestCases);
```

**Note:** Name uniqueness is a warning, not an error.

#### `validateTestCaseDescription(value: string): ValidationResult`
Validates test case description (10-1000 chars).

```typescript
const result = validateTestCaseDescription(description);
```

#### `validateProcessOrder(value: number, existingMemberships: TestStepMembership[], testCaseId: string, currentMembershipId?: string): ValidationResult`
Validates process order (1-9999, unique within test case).

```typescript
const result = validateProcessOrder(order, allMemberships, testCaseId, editingId);
```

#### `suggestProcessOrders(currentMemberships: TestStepMembership[], testCaseId: string): number[]`
Suggests available process order values.

```typescript
const suggestions = suggestProcessOrders(memberships, 'TC-001');
// Returns: [1, 2, 3, 4, 5] or next available values
```

### TCID Validators

#### `validateTCID(value: string, existingTestCases: TestCase[], currentId?: string): TCIDValidationResult`
Validates Test Case ID format and uniqueness.

```typescript
const result = validateTCID('TC-001', existingTestCases);
if (!result.isValid) {
  console.error(result.error);
  if (result.formattedValue) {
    console.log('Suggested:', result.formattedValue);
  }
}
```

**Valid formats:**
- `TC-001` to `TC-999999` (standard)
- `PRJ-TC-001` (with prefix)
- `TC-001-V1` (with suffix)
- `PRJ-TC-001-V1` (full format)

**TCIDValidationResult:**
```typescript
interface TCIDValidationResult extends ValidationResult {
  formattedValue?: string;  // Suggested formatted value
}
```

#### `generateNextTCID(baseTCID: string, existingTestCases: TestCase[]): string`
Generates the next available TCID based on an existing one.

```typescript
const next = generateNextTCID('TC-001', existingTestCases);
// Returns: 'TC-002' (or next available)
```

#### `parseTCIDComponents(tcid: string): { prefix?: string; number: string; suffix?: string; } | null`
Parses a TCID into its components.

```typescript
const parts = parseTCIDComponents('PRJ-TC-001-V1');
// Returns: { prefix: 'PRJ', number: '001', suffix: 'V1' }
```

#### `formatTCID(number: number, options?: { prefix?: string; suffix?: string; padding?: number }): string`
Formats a number into a TCID.

```typescript
const tcid = formatTCID(42, { prefix: 'PRJ', suffix: 'V1', padding: 3 });
// Returns: 'PRJ-TC-042-V1'
```

---

## Validation Result Structure

All validators return a `ValidationResult`:

```typescript
interface ValidationResult {
  isValid: boolean;          // Whether validation passed
  error?: string;            // Error message if validation failed
  suggestion?: string;       // Helpful suggestion for fixing
  warningLevel?: 'error' | 'warning' | 'info';  // Severity level
}
```

**Handling validation results:**

```typescript
const result = validateStepName(name, existingSteps);

if (!result.isValid) {
  // Show error
  toast.error(result.error);
  
  // Show suggestion if available
  if (result.suggestion) {
    if (result.warningLevel === 'warning') {
      toast.warning(result.suggestion);
    } else {
      toast.info(result.suggestion);
    }
  }
  
  return; // Stop processing
}

// Validation passed, continue...
```

---

## Usage Examples

### Creating a Catalog Step

```typescript
import { catalogRepository } from '@/repositories/catalog.repository';
import { validateCatalogStep } from '@/validators/catalog.validator';
import { CatalogStep } from '@/models/catalog.model';

async function createCatalogStep(input: CreateCatalogStepInput) {
  // 1. Validate
  const existingSteps = await catalogRepository.findAll();
  const validation = validateCatalogStep(input, existingSteps);
  
  if (!validation.isValid) {
    return {
      success: false,
      error: validation.error,
    };
  }
  
  // 2. Create
  const newStep: CatalogStep = {
    id: generateId(),
    ...input,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  try {
    const created = await catalogRepository.create(newStep);
    return {
      success: true,
      data: created,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to create step',
    };
  }
}
```

### Creating a Test Case with Steps

```typescript
async function createTestCaseWithSteps(
  testCaseInput: CreateTestCaseInput,
  stepIds: string[],
  processOrders: number[]
) {
  // 1. Validate test case
  const existingTestCases = await testCaseRepository.findAll();
  const validation = validateTestCase(testCaseInput, existingTestCases);
  
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }
  
  // 2. Create test case
  const testCase = await testCaseRepository.create({
    ...testCaseInput,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  // 3. Create memberships
  for (let i = 0; i < stepIds.length; i++) {
    await membershipRepository.create({
      id: generateId(),
      testCaseId: testCase.id,
      catalogStepId: stepIds[i],
      processOrder: processOrders[i],
    });
  }
  
  return { success: true, data: testCase };
}
```

### Searching Catalog Steps

```typescript
async function searchSteps(query: string) {
  if (!query) {
    return await catalogRepository.findAll();
  }
  
  return await catalogRepository.search(query);
}
```

### Reordering Test Steps

```typescript
async function reorderSteps(
  testCaseId: string,
  newOrder: Array<{ stepId: string; order: number }>
) {
  const memberships = await membershipRepository.findByTestCase(testCaseId);
  
  const updates = newOrder.map(({ stepId, order }) => {
    const membership = memberships.find(m => m.catalogStepId === stepId);
    return {
      id: membership!.id,
      processOrder: order,
    };
  });
  
  await membershipRepository.bulkUpdateOrders(updates);
}
```

---

## Error Handling

All repository methods may throw errors. Always use try-catch:

```typescript
try {
  const step = await catalogRepository.create(newStep);
  toast.success('Step created!');
} catch (error) {
  console.error('Failed to create step:', error);
  toast.error('Failed to create step. Please try again.');
}
```

---

**API Version:** 1.0  
**Last Updated:** 2024  
**Maintainer:** Development Team
