# Testing Documentation

## Overview

This document provides comprehensive guidance for testing the Test Case Management System. The test suite covers critical functionalities including database operations, validation, undo/redo logic, and import/export routines.

## Test Structure

### Directory Organization

```
src/
└── __tests__/
    ├── validators/
    │   └── catalog.validator.test.ts
    ├── repositories/
    │   └── base.repository.test.ts
    └── lib/
        ├── history.test.ts
        └── import-export-service.test.ts
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm test -- catalog.validator.test
```

## Test Categories

### 1. Validation Tests (`validators/catalog.validator.test.ts`)

Tests comprehensive input validation for catalog steps including:

#### Step Name Validation
- ✓ Valid unique names
- ✓ Empty name rejection
- ✓ Minimum length enforcement (3 characters)
- ✓ Maximum length enforcement (100 characters)
- ✓ Duplicate name detection
- ✓ Allow same name when editing
- ✓ Whitespace trimming

#### Step Description Validation
- ✓ Valid descriptions
- ✓ Empty description rejection
- ✓ Minimum length enforcement (10 characters)
- ✓ Maximum length enforcement (500 characters)
- ✓ Whitespace handling

#### Java Class Validation
- ✓ Simple class names (MyClass)
- ✓ Fully qualified names (com.example.MyClass)
- ✓ Nested packages support
- ✓ PascalCase requirement
- ✓ Special character rejection
- ✓ Numbers and underscores support

#### Java Method Validation
- ✓ camelCase requirement
- ✓ Lowercase first letter
- ✓ Numbers and underscores support
- ✓ Special character rejection
- ✓ Uppercase first letter rejection

#### SQL Table Validation
- ✓ Simple table names
- ✓ Underscores support
- ✓ Schema.table format
- ✓ Numbers support
- ✓ Leading underscore support
- ✓ Special character rejection
- ✓ Maximum length enforcement (128 characters)

#### Bulk Validation
- ✓ Multiple valid steps
- ✓ Duplicate detection within batch
- ✓ Conflict detection with existing steps
- ✓ Independent validation per step

### 2. Repository Tests (`repositories/base.repository.test.ts`)

Tests CRUD operations and data persistence:

#### Find Operations
- ✓ Find all items (empty and populated)
- ✓ Find by ID (existing and non-existing)
- ✓ Find correct item from multiple

#### Create Operations
- ✓ Add to empty storage
- ✓ Add to existing items
- ✓ Automatic timestamp generation
- ✓ Data preservation

#### Update Operations
- ✓ Update existing items
- ✓ Error on non-existing item
- ✓ Preserve other items
- ✓ Update timestamps
- ✓ Data integrity

#### Delete Operations
- ✓ Delete existing items
- ✓ Return false for non-existing
- ✓ Remove only specified item
- ✓ Preserve other items

#### Utility Operations
- ✓ Check existence
- ✓ Count items
- ✓ Clear all items

### 3. History Tests (`lib/history.test.ts`)

Tests undo/redo functionality and change tracking:

#### History State Management
- ✓ Initialize empty
- ✓ Add entries
- ✓ Multiple entries
- ✓ Clear redo stack on new action
- ✓ Respect max history size (100)

#### Undo Functionality
- ✓ Undo last action
- ✓ Return null when nothing to undo
- ✓ Undo multiple in sequence
- ✓ Return correct entry data

#### Redo Functionality
- ✓ Redo previously undone
- ✓ Return null when nothing to redo
- ✓ Redo multiple in sequence
- ✓ Restore correct state

#### History Navigation
- ✓ Jump to specific entry
- ✓ Handle invalid jump index
- ✓ Update undo/redo availability

#### History Management
- ✓ Clear all history
- ✓ Add comments to entries
- ✓ Keyboard shortcuts (Ctrl+Z, Ctrl+Y)

#### Entry Structure
- ✓ All required fields present
- ✓ Support multiple action types (create, update, delete, reorder)
- ✓ Support multiple entity types (catalog-step, test-case, test-membership)
- ✓ Timestamps and metadata

### 4. Import/Export Tests (`lib/import-export-service.test.ts`)

Tests CSV/JSON import and export functionality:

#### CSV Parsing
- ✓ Parse file preview
- ✓ Sample data extraction
- ✓ Header detection
- ✓ Error handling

#### Data Import
- ✓ Import catalog steps
- ✓ Import test cases
- ✓ Import test memberships
- ✓ Error handling
- ✓ Error message limiting (10 max)
- ✓ Field mapping
- ✓ Type conversion

#### Data Export
- ✓ Export to CSV
- ✓ Export to JSON
- ✓ Export arrays
- ✓ Export single objects
- ✓ File download trigger

#### Template Generation
- ✓ Catalog steps template
- ✓ Test cases template
- ✓ Test memberships template
- ✓ Sample data inclusion

#### Row Validation
- ✓ Validate required fields per entity type
- ✓ Reject incomplete data
- ✓ Type-specific validation

#### Entity Creation
- ✓ Correct structure per entity type
- ✓ Timestamp generation
- ✓ Type conversion
- ✓ Array field handling

#### Mapping Transformations
- ✓ Group by target table
- ✓ Transform according to mappings
- ✓ Field mapping accuracy

## Test Utilities and Mocks

### Spark KV Mock
Tests use a mock implementation of the Spark KV storage:
```typescript
global.window = {
  spark: {
    kv: {
      get: vi.fn(async (key: string) => mockStorage.get(key)),
      set: vi.fn(async (key: string, value: any) => {
        mockStorage.set(key, value);
      }),
      delete: vi.fn(async (key: string) => {
        mockStorage.delete(key);
      }),
      keys: vi.fn(async () => Array.from(mockStorage.keys())),
    },
  },
} as any;
```

### PapaParse Mock
CSV parsing is mocked for controlled testing:
```typescript
vi.mock('papaparse', () => ({
  default: {
    parse: vi.fn(),
    unparse: vi.fn((data: any) => 'mocked,csv,data'),
  },
}));
```

### Toast Notifications Mock
Toast notifications are mocked to avoid UI dependencies:
```typescript
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));
```

## Writing New Tests

### Test File Template

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup code
    vi.clearAllMocks();
  });

  describe('Sub-feature', () => {
    it('should do something specific', () => {
      // Arrange
      const input = /* test data */;
      
      // Act
      const result = /* function call */;
      
      // Assert
      expect(result).toBe(/* expected value */);
    });
  });
});
```

### Best Practices

1. **Arrange-Act-Assert Pattern**: Structure tests clearly with setup, execution, and verification phases

2. **Descriptive Test Names**: Use clear, behavior-focused names
   - ✓ `should validate unique step name`
   - ✗ `test name validation`

3. **Test Isolation**: Each test should be independent
   - Use `beforeEach` for setup
   - Don't rely on test execution order
   - Clear mocks between tests

4. **Comprehensive Coverage**: Test both happy paths and edge cases
   - Valid inputs
   - Invalid inputs
   - Boundary conditions
   - Empty/null states
   - Error conditions

5. **Meaningful Assertions**: Test behavior, not implementation
   - ✓ `expect(result.isValid).toBe(true)`
   - ✗ `expect(result).toMatchSnapshot()`

## Coverage Goals

| Category | Target Coverage |
|----------|----------------|
| Validators | 100% |
| Repositories | 95%+ |
| Services | 90%+ |
| Utils | 90%+ |

## Continuous Integration

Tests should run automatically on:
- Every pull request
- Before merges to main
- Scheduled nightly builds

## Troubleshooting

### Common Issues

#### Mock Not Working
```typescript
// Ensure mock is at top of file, before imports
vi.mock('module-name');

// Use vi.clearAllMocks() in beforeEach
beforeEach(() => {
  vi.clearAllMocks();
});
```

#### Async Test Timeout
```typescript
// Increase timeout for slow tests
it('slow test', async () => {
  // ...
}, 10000); // 10 second timeout
```

#### KV Storage Not Persisting
```typescript
// Use Map for in-memory storage
const mockStorage = new Map();

// Ensure set implementation updates the map
set: vi.fn(async (key, value) => {
  mockStorage.set(key, value);
}),
```

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Project Architecture Documentation](./ARCHITECTURE.md)
- [Validation Rules](./src/validators/README.md)

## Maintenance

### Updating Tests

When modifying business logic:
1. Update related tests first (TDD approach)
2. Run tests to verify failures
3. Implement changes
4. Verify tests pass
5. Add new tests for new functionality

### Test Review Checklist

- [ ] Tests are independent and isolated
- [ ] Tests have clear, descriptive names
- [ ] All edge cases are covered
- [ ] Mocks are properly configured
- [ ] Assertions are meaningful
- [ ] Tests run quickly (< 100ms each)
- [ ] No console errors or warnings
- [ ] Coverage meets targets
