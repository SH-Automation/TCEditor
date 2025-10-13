# Test Suite

This directory contains comprehensive tests for the Test Case Management System.

## Structure

```
__tests__/
├── validators/          # Input validation tests
│   └── catalog.validator.test.ts
├── repositories/        # Data persistence tests
│   └── base.repository.test.ts
└── lib/                # Business logic tests
    ├── history.test.ts
    └── import-export-service.test.ts
```

## Test Coverage

### Validators (validators/)
Tests for all input validation logic ensuring data integrity:
- Catalog step validation (names, descriptions, Java references, SQL tables)
- Test case validation
- Bulk import validation
- Format validation (Java class names, method names, SQL table names)

### Repositories (repositories/)
Tests for database operations and CRUD functionality:
- Create, Read, Update, Delete operations
- Data persistence
- Query operations
- Error handling

### Business Logic (lib/)
Tests for core application features:
- **History Management**: Undo/redo functionality, change tracking
- **Import/Export**: CSV/JSON parsing, data transformation, file generation

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run specific test file
npm test -- catalog.validator.test
```

## Writing New Tests

1. Create test file matching source file name: `feature.ts` → `feature.test.ts`
2. Place in corresponding directory structure
3. Follow existing patterns and conventions
4. Include unit tests for all public functions
5. Test both success and error paths

Example:
```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '@/lib/my-module';

describe('My Module', () => {
  describe('myFunction', () => {
    it('should handle valid input', () => {
      const result = myFunction('valid');
      expect(result).toBe('expected');
    });

    it('should reject invalid input', () => {
      expect(() => myFunction('invalid')).toThrow();
    });
  });
});
```

## See Also

- [TESTING.md](../../TESTING.md) - Comprehensive testing documentation
- [ARCHITECTURE.md](../../ARCHITECTURE.md) - System architecture overview
