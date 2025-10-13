# Layered Architecture: Best Practices & Patterns

## Introduction

This document explains the layered architecture implementation in detail, with practical examples and best practices for each layer.

## The Three Layers

### Layer 1: Presentation (Components)

**Purpose:** Display UI and handle user interaction

**What belongs here:**
- React components
- JSX/TSX rendering
- Event handlers (onClick, onChange, etc.)
- Local UI state (open/closed, selected tab, etc.)
- Layout and styling

**What does NOT belong here:**
- Business logic
- Validation logic
- Data transformation
- Direct data storage access
- Complex calculations

**Example - Good Component:**
```typescript
import { useRepository } from '@/repositories/base.repository';
import { CatalogStep } from '@/models/catalog.model';
import { Button } from '@/components/ui/button';

export function CatalogList() {
  // ✅ Get data from repository via hook
  const { items: steps, remove } = useRepository<CatalogStep>('catalog-steps');
  
  // ✅ Simple event handler - delegates to repository
  const handleDelete = (id: string) => {
    if (confirm('Are you sure?')) {
      remove(id);
    }
  };
  
  // ✅ Pure presentation logic
  return (
    <div className="space-y-4">
      {steps.map(step => (
        <div key={step.id} className="p-4 border rounded">
          <h3>{step.name}</h3>
          <p>{step.description}</p>
          <Button onClick={() => handleDelete(step.id)}>
            Delete
          </Button>
        </div>
      ))}
    </div>
  );
}
```

**Example - Bad Component (Don't do this):**
```typescript
export function CatalogList() {
  // ❌ Direct data access
  const [steps, setSteps] = useKV('catalog-steps', []);
  
  // ❌ Validation logic in component
  const handleDelete = (id: string) => {
    const step = steps.find(s => s.id === id);
    
    // ❌ Business logic checking
    const isUsed = checkIfStepIsUsed(step);
    if (isUsed) {
      alert('Cannot delete: step is in use');
      return;
    }
    
    // ❌ Manual data manipulation
    setSteps(current => current.filter(s => s.id !== id));
    
    // ❌ Side effects mixed with presentation
    updateHistory('delete', step);
    recalculateStats();
  };
  
  return <div>...</div>;
}
```

### Layer 2: Business Logic (Controllers & Services)

**Purpose:** Implement business rules and orchestrate operations

#### Controllers (Future Implementation)

Controllers will orchestrate operations and enforce business rules.

**What belongs here:**
- Operation orchestration
- Business rule enforcement
- Validation coordination
- Error handling
- State management logic

**Example - Future Controller:**
```typescript
import { CatalogRepository } from '@/repositories/catalog.repository';
import { validateCatalogStep } from '@/validators/catalog.validator';
import { HistoryService } from '@/services/history.service';
import { Result, CatalogStep, CreateCatalogStepInput } from '@/models';

export class CatalogController {
  constructor(
    private repository: CatalogRepository,
    private historyService: HistoryService
  ) {}
  
  async createStep(input: CreateCatalogStepInput): Promise<Result<CatalogStep>> {
    // 1. Get existing data for validation
    const existingSteps = await this.repository.findAll();
    
    // 2. Validate
    const validation = validateCatalogStep(input, existingSteps);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
      };
    }
    
    // 3. Apply business rules
    if (existingSteps.length >= 1000) {
      return {
        success: false,
        error: 'Maximum number of catalog steps reached (1000)',
      };
    }
    
    // 4. Create the entity
    try {
      const newStep: CatalogStep = {
        id: this.generateStepId(),
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const created = await this.repository.create(newStep);
      
      // 5. Record change in history
      await this.historyService.recordChange({
        type: 'CREATE',
        entityType: 'catalog-step',
        entityId: created.id,
        data: created,
      });
      
      return {
        success: true,
        data: created,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create catalog step',
      };
    }
  }
  
  async deleteStep(id: string): Promise<Result<void>> {
    // 1. Check if step exists
    const step = await this.repository.findById(id);
    if (!step) {
      return {
        success: false,
        error: 'Catalog step not found',
      };
    }
    
    // 2. Check business rules (is it in use?)
    const usages = await this.membershipRepository.findByCatalogStep(id);
    if (usages.length > 0) {
      return {
        success: false,
        error: `Cannot delete: step is used in ${usages.length} test case(s)`,
      };
    }
    
    // 3. Delete
    try {
      await this.repository.delete(id);
      
      // 4. Record change
      await this.historyService.recordChange({
        type: 'DELETE',
        entityType: 'catalog-step',
        entityId: id,
        data: step,
      });
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete catalog step',
      };
    }
  }
  
  private generateStepId(): string {
    return `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

#### Services

Services implement reusable business logic.

**What belongs here:**
- Complex algorithms
- Data transformation
- Cross-cutting concerns
- Domain-specific calculations
- Integration with external systems

**Example - Validation Service:**
```typescript
import { validateCatalogStep } from '@/validators/catalog.validator';
import { validateTestCase } from '@/validators/testcase.validator';
import { CatalogStep, TestCase, Result } from '@/models';

export class ValidationService {
  validateCatalogStep(
    input: any,
    existingSteps: CatalogStep[]
  ): Result<void> {
    const result = validateCatalogStep(input, existingSteps);
    
    if (!result.isValid) {
      return {
        success: false,
        error: result.error,
        errorDetails: [{
          field: 'general',
          message: result.error || 'Validation failed',
          suggestion: result.suggestion,
          warningLevel: result.warningLevel || 'error',
        }],
      };
    }
    
    return { success: true };
  }
  
  validateBulkImport(
    items: any[],
    existingSteps: CatalogStep[]
  ): Map<number, Result<void>> {
    const results = new Map();
    const usedNames = new Set(existingSteps.map(s => s.name.toLowerCase()));
    
    items.forEach((item, index) => {
      const result = this.validateCatalogStep(item, existingSteps);
      
      if (result.success) {
        // Check for duplicates within the import
        const nameLower = item.name.toLowerCase();
        if (usedNames.has(nameLower)) {
          results.set(index, {
            success: false,
            error: `Duplicate name in import: "${item.name}"`,
          });
        } else {
          usedNames.add(nameLower);
          results.set(index, { success: true });
        }
      } else {
        results.set(index, result);
      }
    });
    
    return results;
  }
}
```

### Layer 3: Data Access (Repositories & Models)

**Purpose:** Abstract data storage and provide clean data access

#### Models

**What belongs here:**
- TypeScript interfaces
- Type definitions
- Data structure documentation
- Relationships between entities

**Example - Good Model:**
```typescript
/**
 * Represents a reusable test step in the catalog.
 * Catalog steps can be assigned to multiple test cases.
 */
export interface CatalogStep extends Entity {
  /** Unique, descriptive name for the step (3-100 characters) */
  name: string;
  
  /** Detailed description of what the step does (10-500 characters) */
  description: string;
  
  /** Fully qualified Java class name (e.g., com.example.TestClass) */
  javaClass: string;
  
  /** Java method name in camelCase */
  javaMethod: string;
  
  /** List of SQL tables this step interacts with */
  sqlTables: string[];
}

/**
 * Input required to create a new catalog step.
 * Does not include generated fields (id, timestamps).
 */
export interface CreateCatalogStepInput {
  name: string;
  description: string;
  javaClass: string;
  javaMethod: string;
  sqlTables: string[];
}
```

#### Repositories

**What belongs here:**
- CRUD operations
- Data queries and filters
- Data serialization/deserialization
- Storage abstraction
- Data caching (future)

**What does NOT belong here:**
- Business logic
- Validation
- UI logic
- Complex calculations
- Cross-entity operations (use services)

**Example - Good Repository:**
```typescript
export class CatalogRepository extends BaseRepository<CatalogStep> {
  constructor() {
    super('catalog-steps');
  }
  
  // ✅ Data access - returns sorted results
  async findAll(): Promise<CatalogStep[]> {
    const steps = await this.getFromStorage();
    return steps.sort((a, b) => a.name.localeCompare(b.name));
  }
  
  // ✅ Query method - filters and returns data
  async findByJavaClass(javaClass: string): Promise<CatalogStep[]> {
    const steps = await this.getFromStorage();
    return steps.filter(s => s.javaClass === javaClass);
  }
  
  // ✅ Complex query - combines multiple filters
  async findByFilters(filters: CatalogStepFilters): Promise<CatalogStep[]> {
    let steps = await this.getFromStorage();
    
    if (filters.javaClass) {
      steps = steps.filter(s => s.javaClass === filters.javaClass);
    }
    
    if (filters.sqlTable) {
      steps = steps.filter(s => s.sqlTables.includes(filters.sqlTable!));
    }
    
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      steps = steps.filter(s =>
        s.name.toLowerCase().includes(term) ||
        s.description.toLowerCase().includes(term)
      );
    }
    
    return steps.sort((a, b) => a.name.localeCompare(b.name));
  }
}
```

**Example - Bad Repository (Don't do this):**
```typescript
export class CatalogRepository extends BaseRepository<CatalogStep> {
  // ❌ Validation in repository
  async create(step: CatalogStep): Promise<CatalogStep> {
    if (step.name.length < 3) {
      throw new Error('Name too short');
    }
    
    const existing = await this.findAll();
    if (existing.some(s => s.name === step.name)) {
      throw new Error('Name already exists');
    }
    
    return super.create(step);
  }
  
  // ❌ Business logic in repository
  async deleteIfNotUsed(id: string): Promise<boolean> {
    const usages = await this.checkUsage(id);
    if (usages > 0) {
      throw new Error('Cannot delete: step is in use');
    }
    return this.delete(id);
  }
  
  // ❌ Cross-entity operations in repository
  async getStepsWithTestCases(): Promise<any> {
    const steps = await this.getFromStorage();
    const testCases = await spark.kv.get('test-cases');
    // Complex joining logic...
    return combined;
  }
}
```

## Layer Communication Rules

### Rule 1: One-Way Dependencies

Layers can only depend on layers below them:

```
Presentation → Business Logic → Data Access
     ↓               ↓                ↓
Components → Controllers/Services → Repositories → Storage
```

**✅ ALLOWED:**
- Components use controllers/services
- Controllers use repositories
- Controllers use services
- Services use repositories

**❌ NOT ALLOWED:**
- Repositories using controllers
- Repositories using services
- Components using repositories directly (without going through controllers in the future)
- Any circular dependencies

### Rule 2: Data Flow

Data should flow through the layers:

**Read Flow:**
```
Storage → Repository → Controller → Component
```

**Write Flow:**
```
Component → Controller → Validator → Repository → Storage
                      ↓
                   Service (if needed)
```

### Rule 3: Error Handling

Each layer handles errors appropriately:

**Repository Layer:**
```typescript
async findById(id: string): Promise<CatalogStep | undefined> {
  try {
    const items = await this.getFromStorage();
    return items.find(item => item.id === id);
  } catch (error) {
    console.error('[Repository] Failed to find item:', error);
    throw new Error('Database error');
  }
}
```

**Controller Layer:**
```typescript
async getStep(id: string): Promise<Result<CatalogStep>> {
  try {
    const step = await this.repository.findById(id);
    
    if (!step) {
      return {
        success: false,
        error: 'Catalog step not found',
      };
    }
    
    return {
      success: true,
      data: step,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to retrieve catalog step',
    };
  }
}
```

**Component Layer:**
```typescript
const handleLoad = async () => {
  const result = await controller.getStep(id);
  
  if (!result.success) {
    toast.error(result.error);
    return;
  }
  
  setStep(result.data);
};
```

## Common Patterns

### Pattern 1: Create with Validation

```typescript
// Controller
async createStep(input: CreateCatalogStepInput): Promise<Result<CatalogStep>> {
  // 1. Get context
  const existingSteps = await this.repository.findAll();
  
  // 2. Validate
  const validation = validateCatalogStep(input, existingSteps);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }
  
  // 3. Create entity
  const newStep = {
    id: generateId(),
    ...input,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  // 4. Persist
  try {
    const created = await this.repository.create(newStep);
    return { success: true, data: created };
  } catch (error) {
    return { success: false, error: 'Creation failed' };
  }
}
```

### Pattern 2: Update with Optimistic Locking

```typescript
// Controller
async updateStep(
  id: string,
  updates: Partial<CatalogStep>
): Promise<Result<CatalogStep>> {
  // 1. Get current state
  const current = await this.repository.findById(id);
  if (!current) {
    return { success: false, error: 'Step not found' };
  }
  
  // 2. Merge changes
  const updated = {
    ...current,
    ...updates,
    updatedAt: new Date(),
  };
  
  // 3. Validate
  const existingSteps = await this.repository.findAll();
  const validation = validateCatalogStep(updated, existingSteps, id);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }
  
  // 4. Persist
  try {
    const saved = await this.repository.update(updated);
    return { success: true, data: saved };
  } catch (error) {
    return { success: false, error: 'Update failed' };
  }
}
```

### Pattern 3: Delete with Dependency Check

```typescript
// Controller
async deleteStep(id: string): Promise<Result<void>> {
  // 1. Check existence
  const step = await this.repository.findById(id);
  if (!step) {
    return { success: false, error: 'Step not found' };
  }
  
  // 2. Check dependencies
  const usages = await this.membershipRepository.findByCatalogStep(id);
  if (usages.length > 0) {
    return {
      success: false,
      error: `Cannot delete: used in ${usages.length} test case(s)`,
    };
  }
  
  // 3. Delete
  try {
    await this.repository.delete(id);
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Deletion failed' };
  }
}
```

### Pattern 4: Bulk Operations

```typescript
// Service
async bulkImport(
  items: CreateCatalogStepInput[]
): Promise<Result<{ created: number; failed: number }>> {
  const existingSteps = await this.repository.findAll();
  const validationResults = this.validationService.validateBulkImport(
    items,
    existingSteps
  );
  
  let created = 0;
  let failed = 0;
  
  for (let i = 0; i < items.length; i++) {
    const validation = validationResults.get(i);
    
    if (!validation?.success) {
      failed++;
      continue;
    }
    
    try {
      await this.catalogController.createStep(items[i]);
      created++;
    } catch (error) {
      failed++;
    }
  }
  
  return {
    success: true,
    data: { created, failed },
  };
}
```

## Testing Strategy

### Unit Testing

**Validators:**
```typescript
describe('validateStepName', () => {
  it('should reject names shorter than 3 characters', () => {
    const result = validateStepName('AB', [], undefined);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('at least 3');
  });
  
  it('should reject duplicate names', () => {
    const existing = [{ id: '1', name: 'Test Step' }];
    const result = validateStepName('Test Step', existing);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('already exists');
  });
});
```

**Repositories:**
```typescript
describe('CatalogRepository', () => {
  let repository: CatalogRepository;
  
  beforeEach(() => {
    repository = new CatalogRepository();
    // Mock storage
  });
  
  it('should return sorted steps', async () => {
    const steps = await repository.findAll();
    const names = steps.map(s => s.name);
    const sorted = [...names].sort();
    expect(names).toEqual(sorted);
  });
});
```

### Integration Testing

**Controllers:**
```typescript
describe('CatalogController', () => {
  let controller: CatalogController;
  let repository: CatalogRepository;
  
  beforeEach(() => {
    repository = new CatalogRepository();
    controller = new CatalogController(repository);
  });
  
  it('should create a valid step', async () => {
    const input = {
      name: 'Test Step',
      description: 'A test step',
      javaClass: 'TestClass',
      javaMethod: 'testMethod',
      sqlTables: ['users'],
    };
    
    const result = await controller.createStep(input);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.name).toBe('Test Step');
  });
  
  it('should reject invalid input', async () => {
    const input = { name: 'AB' }; // Too short
    
    const result = await controller.createStep(input as any);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

## Future Enhancements

### 1. Dependency Injection

```typescript
// Container
class Container {
  private instances = new Map();
  
  register<T>(key: string, factory: () => T) {
    this.instances.set(key, factory);
  }
  
  resolve<T>(key: string): T {
    const factory = this.instances.get(key);
    return factory();
  }
}

// Usage
container.register('catalogRepository', () => new CatalogRepository());
container.register('catalogController', () => 
  new CatalogController(
    container.resolve('catalogRepository'),
    container.resolve('historyService')
  )
);
```

### 2. Event-Driven Architecture

```typescript
// Event bus
class EventBus {
  private handlers = new Map<string, Function[]>();
  
  on(event: string, handler: Function) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);
  }
  
  emit(event: string, data: any) {
    const handlers = this.handlers.get(event) || [];
    handlers.forEach(handler => handler(data));
  }
}

// Usage
eventBus.on('step.created', async (step) => {
  await historyService.recordChange({ type: 'CREATE', data: step });
  await analyticsService.trackEvent('step_created');
});

// In controller
const created = await repository.create(step);
eventBus.emit('step.created', created);
```

### 3. Caching Layer

```typescript
class CachedRepository<T> extends BaseRepository<T> {
  private cache = new Map<string, T>();
  private cacheTimeout = 5000; // 5 seconds
  
  async findById(id: string): Promise<T | undefined> {
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }
    
    const item = await super.findById(id);
    if (item) {
      this.cache.set(id, item);
      setTimeout(() => this.cache.delete(id), this.cacheTimeout);
    }
    
    return item;
  }
}
```

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Next Review:** After controller implementation
