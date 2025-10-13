# Migration Guide: Moving to Layered Architecture

## Overview

This guide explains how to migrate existing components from direct `useKV` usage to the new layered architecture with models, validators, repositories, and controllers.

## Migration Process

### Phase 1: Already Complete ✅

- ✅ Created model definitions (`src/models/`)
- ✅ Extracted validation logic (`src/validators/`)
- ✅ Built repository layer (`src/repositories/`)
- ✅ Maintained backward compatibility

### Phase 2: Component Migration (In Progress)

Components currently use `useKV` directly. They need to be updated to use repositories.

### Phase 3: Controller Layer (Future)

Once components are migrated, we'll add a controller layer for business logic orchestration.

## Step-by-Step Migration

### Step 1: Identify Direct useKV Usage

**Before:**
```typescript
// src/components/CatalogManager.tsx
import { useKV } from '@github/spark/hooks';
import { CatalogStep } from '@/lib/types';

function CatalogManager() {
  const [steps, setSteps] = useKV<CatalogStep[]>("catalog-steps", []);
  
  const deleteStep = (id: string) => {
    setSteps(current => (current || []).filter(s => s.id !== id));
  };
  
  // ...
}
```

### Step 2: Use Repository Hook

**After:**
```typescript
// src/components/CatalogManager.tsx
import { useRepository } from '@/repositories/base.repository';
import { CatalogStep } from '@/models/catalog.model';

function CatalogManager() {
  const { items: steps, remove: deleteStep } = useRepository<CatalogStep>('catalog-steps');
  
  // Usage is now simpler
  // deleteStep(id) instead of setSteps(...)
  
  // ...
}
```

### Step 3: Use New Validators

**Before:**
```typescript
// Validation inline in component
const handleCreate = () => {
  if (!name || name.length < 3) {
    toast.error("Name too short");
    return;
  }
  if (steps.some(s => s.name === name)) {
    toast.error("Name already exists");
    return;
  }
  // ...
};
```

**After:**
```typescript
// Use validator functions
import { validateStepName } from '@/validators/catalog.validator';

const handleCreate = () => {
  const validation = validateStepName(name, steps);
  if (!validation.isValid) {
    toast.error(validation.error);
    if (validation.suggestion) {
      toast.info(validation.suggestion);
    }
    return;
  }
  // ...
};
```

### Step 4: Update Model Imports

**Before:**
```typescript
import { CatalogStep, TestCase } from '@/lib/types';
```

**After:**
```typescript
import { CatalogStep } from '@/models/catalog.model';
import { TestCase } from '@/models/testcase.model';
// Or use the barrel export:
import { CatalogStep, TestCase } from '@/models';
```

## Component-by-Component Migration

### CatalogManager Component

**Current State:** Uses `useKV` directly  
**Migration Priority:** High  
**Estimated Effort:** 2 hours

**Changes Needed:**
1. Replace `useKV` with `useRepository`
2. Use `validateCatalogStep` for validation
3. Import from `@/models` instead of `@/lib/types`

**Migration Code:**
```typescript
// Before
const [steps, setSteps] = useKV<CatalogStep[]>("catalog-steps", []);
const [editingStep, setEditingStep] = useState<CatalogStep | null>(null);

const handleCreate = () => {
  if (!name || name.length < 3) {
    toast.error("Invalid name");
    return;
  }
  
  const newStep: CatalogStep = {
    id: generateId(),
    name,
    description,
    javaClass,
    javaMethod,
    sqlTables,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  setSteps(current => [...(current || []), newStep]);
  toast.success("Created!");
};

// After
const { items: steps, create, update, remove } = useRepository<CatalogStep>('catalog-steps');
const [editingStep, setEditingStep] = useState<CatalogStep | null>(null);

const handleCreate = () => {
  const validation = validateCatalogStep(
    { name, description, javaClass, javaMethod, sqlTables },
    steps
  );
  
  if (!validation.isValid) {
    toast.error(validation.error);
    if (validation.suggestion) {
      toast.info(validation.suggestion);
    }
    return;
  }
  
  const newStep: CatalogStep = {
    id: generateId(),
    name,
    description,
    javaClass,
    javaMethod,
    sqlTables,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  create(newStep);
  toast.success("Created!");
};
```

### TestCaseManager Component

**Current State:** Uses `useKV` directly  
**Migration Priority:** High  
**Estimated Effort:** 3 hours

**Changes Needed:**
1. Replace `useKV` with `useRepository` for test cases
2. Replace `useKV` with membership repository for memberships
3. Use `validateTestCase` for validation
4. Use `validateTCID` for ID validation

**Migration Code:**
```typescript
// Before
const [testCases, setTestCases] = useKV<TestCase[]>("test-cases", []);
const [memberships, setMemberships] = useKV<TestStepMembership[]>("test-memberships", []);

// After
const { items: testCases, create: createTestCase, update: updateTestCase, remove: removeTestCase } = 
  useRepository<TestCase>('test-cases');
const { items: memberships, create: createMembership, update: updateMembership, remove: removeMembership } = 
  useRepository<TestStepMembership>('test-memberships');
```

### DatabaseManager Component

**Current State:** Uses custom database service  
**Migration Priority:** Low  
**Estimated Effort:** 1 hour

**Changes Needed:**
1. Update imports to use new models
2. No major structural changes needed

### Other Components

Similar migration pattern applies to:
- `DataEntryManager`
- `ImportExportManager`
- `QueryExecutor`
- All dialog components

## Validation Migration

### Old Validation (lib/validation.ts)

**Status:** Keep for backward compatibility during migration  
**Future:** Will be deprecated once all components migrate

### New Validation (validators/)

**Structure:**
```
validators/
├── common.validator.ts     # Shared validation utilities
├── catalog.validator.ts    # Catalog-specific validation
├── testcase.validator.ts   # Test case validation
├── tcid.validator.ts       # TCID format validation
└── index.ts                # Barrel export
```

**Migration Pattern:**
```typescript
// OLD
import { validateTCID, validateCatalogStepName } from '@/lib/validation';

// NEW
import { validateTCID } from '@/validators/tcid.validator';
import { validateStepName } from '@/validators/catalog.validator';
// Or use barrel export:
import { validateTCID, validateStepName } from '@/validators';
```

## Type Migration

### Old Types (lib/types.ts)

**Status:** Keep for backward compatibility  
**Future:** Will be deprecated

### New Models (models/)

**Structure:**
```
models/
├── common.model.ts      # Shared types (Result, ValidationError, etc.)
├── catalog.model.ts     # Catalog domain models
├── testcase.model.ts    # Test case domain models
└── index.ts             # Barrel export
```

**Migration Pattern:**
```typescript
// OLD
import { CatalogStep, TestCase, TestStepMembership } from '@/lib/types';

// NEW
import { CatalogStep, TestCase, TestStepMembership } from '@/models';
```

## Testing the Migration

### Manual Testing Checklist

For each migrated component:

- [ ] Component renders without errors
- [ ] Data loads correctly
- [ ] Create operation works
- [ ] Update operation works
- [ ] Delete operation works
- [ ] Validation works correctly
- [ ] Error messages are user-friendly
- [ ] Suggestions appear when appropriate
- [ ] Data persists after refresh
- [ ] No console errors
- [ ] TypeScript compiles without errors

### Rollback Plan

If issues arise:

1. **Revert the component file** - Use git to restore previous version
2. **Check imports** - Ensure old imports still work
3. **Verify data integrity** - Check that data wasn't corrupted
4. **Report issues** - Document what went wrong

## Common Migration Issues

### Issue 1: Type Errors

**Problem:**
```typescript
Property 'suggestion' does not exist on type 'ValidationResult'
```

**Solution:**
Update to new validation result type from `validators/common.validator.ts`

### Issue 2: Undefined Items

**Problem:**
```typescript
Cannot read property 'length' of undefined
```

**Solution:**
Use optional chaining and nullish coalescing:
```typescript
const count = items?.length || 0;
items?.map(...) || [];
```

### Issue 3: Stale Closures

**Problem:**
Updates don't reflect in UI

**Solution:**
Use functional updates with repositories:
```typescript
// The repository hook handles this internally
update(item); // Just call update
```

## Timeline

### Week 1-2: Core Components
- Migrate CatalogManager
- Migrate TestCaseManager
- Update related dialogs

### Week 3: Secondary Components
- Migrate DataEntryManager
- Migrate ImportExportManager
- Update validation showcase

### Week 4: Final Cleanup
- Remove old validation imports
- Add deprecation notices to old code
- Update documentation
- Final testing

## Benefits After Migration

1. **Better Separation of Concerns** - Each layer has a clear purpose
2. **Easier Testing** - Validators and repositories can be unit tested
3. **Improved Type Safety** - Better TypeScript support
4. **Better Validation** - Consistent validation with helpful messages
5. **Easier Maintenance** - Changes are localized to specific layers
6. **Better Documentation** - Clear architecture guides development

## Next Steps After Migration

Once component migration is complete:

1. **Add Controller Layer** - Orchestrate business logic
2. **Add Unit Tests** - Test validators and repositories
3. **Add Integration Tests** - Test complete workflows
4. **Optimize Performance** - Add caching where needed
5. **Add More Features** - Easier to extend with clean architecture

---

## Questions?

Refer to:
- **ARCHITECTURE.md** - Complete architecture documentation
- **DEVELOPER_GUIDE.md** - Practical development guide
- **Existing migrated code** - Look for patterns in new files

---

**Migration Status:** In Progress  
**Last Updated:** 2024  
**Next Review:** After core component migration
