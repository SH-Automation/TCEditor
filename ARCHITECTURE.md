# Architecture Documentation

## Overview

This Test Case Management System follows a **layered architecture** with clear separation between presentation, business logic, and data access layers. The architecture is designed to be maintainable, testable, and scalable.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Pages     │  │ Components  │  │   Layouts   │         │
│  │  (App.tsx)  │  │   (Views)   │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                 │                 │                │
└─────────┼─────────────────┼─────────────────┼────────────────┘
          │                 │                 │
          └─────────────────┴─────────────────┘
                            │
┌───────────────────────────┼────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                     │
│                           │                                 │
│  ┌─────────────┐  ┌──────┴──────┐  ┌─────────────┐       │
│  │ Controllers │  │   Services   │  │ Validators  │       │
│  │ (Managers)  │  │  (Business)  │  │             │       │
│  └─────────────┘  └──────┬──────┘  └─────────────┘       │
│         │                 │                 │              │
└─────────┼─────────────────┼─────────────────┼──────────────┘
          │                 │                 │
          └─────────────────┴─────────────────┘
                            │
┌───────────────────────────┼────────────────────────────────┐
│                     DATA ACCESS LAYER                       │
│                           │                                 │
│  ┌─────────────┐  ┌──────┴──────┐  ┌─────────────┐       │
│  │ Repositories│  │  Database   │  │    Models   │       │
│  │             │  │  Services   │  │   (Types)   │       │
│  └─────────────┘  └──────┬──────┘  └─────────────┘       │
│         │                 │                 │              │
└─────────┼─────────────────┼─────────────────┼──────────────┘
          │                 │                 │
          └─────────────────┴─────────────────┘
                            │
                    ┌───────┴────────┐
                    │  Data Storage  │
                    │   (useKV API)  │
                    └────────────────┘
```

## Directory Structure

```
src/
├── components/          # PRESENTATION LAYER - UI Components
│   ├── ui/             # Base shadcn components (DO NOT MODIFY)
│   ├── catalog/        # Catalog-specific view components
│   ├── testcase/       # Test case view components
│   ├── database/       # Database management views
│   ├── shared/         # Shared/reusable view components
│   └── layout/         # Layout components (headers, footers)
│
├── controllers/         # BUSINESS LOGIC - Application Controllers
│   ├── catalog.controller.ts      # Catalog business operations
│   ├── testcase.controller.ts     # Test case business operations
│   ├── membership.controller.ts   # Membership business operations
│   └── database.controller.ts     # Database management operations
│
├── services/            # BUSINESS LOGIC - Domain Services
│   ├── validation.service.ts      # Validation orchestration
│   ├── import-export.service.ts   # Import/Export operations
│   ├── history.service.ts         # Change tracking
│   └── analytics.service.ts       # Data analytics
│
├── repositories/        # DATA ACCESS - Data Repositories
│   ├── catalog.repository.ts      # Catalog data access
│   ├── testcase.repository.ts     # Test case data access
│   ├── membership.repository.ts   # Membership data access
│   └── base.repository.ts         # Base repository functionality
│
├── models/              # DATA ACCESS - Domain Models & Types
│   ├── catalog.model.ts           # Catalog domain model
│   ├── testcase.model.ts          # Test case domain model
│   ├── membership.model.ts        # Membership domain model
│   └── common.model.ts            # Shared types & interfaces
│
├── validators/          # BUSINESS LOGIC - Validation Rules
│   ├── tcid.validator.ts          # TCID validation logic
│   ├── catalog.validator.ts       # Catalog validation
│   ├── testcase.validator.ts      # Test case validation
│   └── common.validator.ts        # Common validation utilities
│
├── hooks/               # PRESENTATION - React Hooks
│   ├── use-catalog.ts             # Catalog data hook
│   ├── use-testcase.ts            # Test case data hook
│   ├── use-mobile.ts              # Mobile detection
│   └── use-history.ts             # History tracking
│
└── lib/                 # SHARED UTILITIES
    ├── utils.ts                   # General utilities
    ├── constants.ts               # Application constants
    └── errors.ts                  # Error definitions
```

## Layer Responsibilities

### 1. Presentation Layer (`components/`)

**Purpose:** Handle user interface rendering and user interaction

**Responsibilities:**
- Render UI components
- Handle user input events
- Display data from controllers
- Manage local UI state (open/closed, selected tabs, etc.)
- NO business logic
- NO direct data access

**Guidelines:**
- Components should be "dumb" - they receive props and render
- Use hooks to connect to controllers
- Keep components focused on a single responsibility
- Avoid complex logic - delegate to controllers

**Example:**
```typescript
// ✅ GOOD: Component delegates to controller
function CatalogList() {
  const { steps, loading, error, deleteStep } = useCatalogController();
  
  return (
    <div>
      {loading && <Spinner />}
      {error && <Alert>{error}</Alert>}
      {steps.map(step => (
        <CatalogStepCard 
          key={step.id} 
          step={step} 
          onDelete={deleteStep} 
        />
      ))}
    </div>
  );
}

// ❌ BAD: Component has business logic
function CatalogList() {
  const [steps, setSteps] = useKV("catalog-steps", []);
  
  const deleteStep = (id: string) => {
    // Validation logic in component - WRONG!
    if (steps.length === 1) {
      alert("Cannot delete last step");
      return;
    }
    setSteps(steps.filter(s => s.id !== id));
  };
  // ...
}
```

### 2. Business Logic Layer (`controllers/`, `services/`, `validators/`)

**Purpose:** Implement business rules, orchestrate operations, validate data

#### Controllers (`controllers/`)

**Responsibilities:**
- Orchestrate operations between services and repositories
- Enforce business rules
- Handle error scenarios
- Coordinate validation
- Manage application state flow

**Guidelines:**
- Controllers are the "entry point" for business operations
- They should use services and repositories, not data APIs directly
- Handle all error cases and return meaningful messages
- Keep controllers focused on orchestration, not implementation

#### Services (`services/`)

**Responsibilities:**
- Implement complex business logic
- Perform data transformations
- Coordinate between multiple repositories
- Implement algorithms and calculations

**Guidelines:**
- Services should be reusable across multiple controllers
- Focus on a specific domain (validation, import/export, etc.)
- Should NOT directly call data storage APIs
- Use repositories for data access

#### Validators (`validators/`)

**Responsibilities:**
- Implement validation rules
- Provide user-friendly error messages
- Suggest corrections
- Handle format checking

**Guidelines:**
- Each validator should focus on one type of validation
- Return structured validation results
- Provide actionable suggestions
- Make validators pure functions when possible

**Example:**
```typescript
// ✅ GOOD: Controller orchestrates, delegates to services
class CatalogController {
  constructor(
    private repository: CatalogRepository,
    private validator: CatalogValidator,
    private historyService: HistoryService
  ) {}
  
  async createStep(data: CreateStepInput): Promise<Result<CatalogStep>> {
    // Validate
    const validationResult = this.validator.validateStep(data);
    if (!validationResult.isValid) {
      return { success: false, error: validationResult.error };
    }
    
    // Create
    const step = await this.repository.create(data);
    
    // Track history
    await this.historyService.recordChange({
      type: 'CREATE',
      entity: 'catalog-step',
      data: step
    });
    
    return { success: true, data: step };
  }
}

// ❌ BAD: Mixed concerns, direct data access
class CatalogController {
  async createStep(data: CreateStepInput) {
    // Validation in controller - should be in validator
    if (!data.name || data.name.length < 3) {
      throw new Error("Name too short");
    }
    
    // Direct KV access - should use repository
    const steps = await spark.kv.get("catalog-steps");
    steps.push(data);
    await spark.kv.set("catalog-steps", steps);
    
    // History tracking mixed in - should be separate
    const history = await spark.kv.get("history");
    history.push({ type: "create", data });
    await spark.kv.set("history", history);
  }
}
```

### 3. Data Access Layer (`repositories/`, `models/`)

**Purpose:** Abstract data storage and provide clean data access API

#### Repositories (`repositories/`)

**Responsibilities:**
- Provide CRUD operations
- Abstract storage mechanism (useKV, localStorage, API, etc.)
- Handle data serialization/deserialization
- Implement data queries and filters

**Guidelines:**
- Repositories are the ONLY layer that accesses storage APIs
- Provide a consistent interface regardless of storage mechanism
- Handle all data conversion (e.g., Date objects, JSON parsing)
- Return domain models, not raw data

#### Models (`models/`)

**Responsibilities:**
- Define data structures
- Define type interfaces
- Document data relationships
- Provide type safety

**Guidelines:**
- Models should be pure TypeScript interfaces/types
- Include JSDoc comments for complex fields
- Define relationships between entities
- Use discriminated unions for variants

**Example:**
```typescript
// ✅ GOOD: Repository abstracts storage
class CatalogRepository extends BaseRepository<CatalogStep> {
  constructor() {
    super("catalog-steps");
  }
  
  async findAll(): Promise<CatalogStep[]> {
    const steps = await this.getAll();
    return steps.sort((a, b) => a.name.localeCompare(b.name));
  }
  
  async findByJavaClass(javaClass: string): Promise<CatalogStep[]> {
    const steps = await this.getAll();
    return steps.filter(s => s.javaClass === javaClass);
  }
}

// ❌ BAD: Business logic in repository
class CatalogRepository {
  async createStep(data: any) {
    // Validation in repository - WRONG layer!
    if (!this.validateName(data.name)) {
      throw new Error("Invalid name");
    }
    
    // Business logic - WRONG layer!
    const existing = await this.findAll();
    if (existing.length >= 100) {
      throw new Error("Too many steps");
    }
    
    await spark.kv.set("catalog-steps", data);
  }
}
```

## Key Design Patterns

### 1. Repository Pattern
Repositories abstract data storage. Components never call `useKV` or `spark.kv` directly.

### 2. Controller Pattern
Controllers orchestrate operations and enforce business rules. They are the "public API" for the business layer.

### 3. Service Pattern
Services implement reusable business logic that can be shared across controllers.

### 4. Validator Pattern
Validators are pure functions that check data and return structured results.

### 5. Hook Pattern
Custom React hooks provide clean integration between React components and controllers.

## Data Flow

### Read Flow
```
Component → Hook → Controller → Repository → Storage
                                            ↓
Component ← Hook ← Controller ← Repository ← Storage
```

### Write Flow
```
Component → Hook → Controller → Validator
                     ↓              ↓
                     ↓          (validation)
                     ↓              ↓
                  Service ← ← ← (if valid)
                     ↓
                 Repository → Storage
                     ↓
                 History Service
```

## Error Handling

### Error Flow
```
Storage Error → Repository → Controller → Hook → Component
     ↓              ↓            ↓          ↓         ↓
  (Catch)      (Transform)   (Handle)   (Pass)   (Display)
```

### Guidelines
- Repositories catch storage errors and return `Result<T>` types
- Controllers handle business errors and provide user-friendly messages
- Services throw domain-specific exceptions
- Components display errors via UI components (Alert, Toast)

## Testing Strategy

### Unit Tests
- **Validators:** Test all validation rules with edge cases
- **Services:** Test business logic in isolation
- **Repositories:** Test with mock storage

### Integration Tests
- **Controllers:** Test with real services and mock repositories
- **Hooks:** Test with React Testing Library

### Component Tests
- **Views:** Test rendering and user interaction
- **Use mock controllers**

## Migration Guide

### Converting Existing Code

#### Step 1: Extract Data Access
```typescript
// BEFORE: Direct useKV in component
function CatalogManager() {
  const [steps, setSteps] = useKV("catalog-steps", []);
  // ...
}

// AFTER: Use repository via hook
function CatalogManager() {
  const { steps, createStep, updateStep, deleteStep } = useCatalog();
  // ...
}
```

#### Step 2: Extract Business Logic
```typescript
// BEFORE: Validation in component
const handleCreate = () => {
  if (!name || name.length < 3) {
    toast.error("Name too short");
    return;
  }
  // ...
};

// AFTER: Validation in validator via controller
const handleCreate = async () => {
  const result = await catalogController.createStep({ name, ... });
  if (!result.success) {
    toast.error(result.error);
    return;
  }
  toast.success("Created!");
};
```

#### Step 3: Create Proper Models
```typescript
// BEFORE: Inline types
const [steps, setSteps] = useKV<Array<{id: string; name: string}>>();

// AFTER: Proper models
import { CatalogStep } from '@/models/catalog.model';
const [steps, setSteps] = useKV<CatalogStep[]>();
```

## Best Practices

### DO ✅
- Keep layers separated - no cross-layer violations
- Use dependency injection in controllers and services
- Return `Result<T>` types from controllers for error handling
- Make validators pure functions
- Use repositories for ALL data access
- Document complex business logic
- Write unit tests for validators and services

### DON'T ❌
- Don't use `useKV` or `spark.kv` in components
- Don't put business logic in components
- Don't put validation in repositories
- Don't put UI logic in controllers
- Don't create circular dependencies between layers
- Don't skip error handling
- Don't duplicate validation logic

## Performance Considerations

### Data Access
- Repositories should cache frequently accessed data
- Use React Query or similar for request deduplication
- Batch updates when possible

### Component Rendering
- Use React.memo for expensive view components
- Keep derived state in useMemo
- Avoid prop drilling - use composition

### Validation
- Debounce real-time validation
- Cache validation results for unchanged data
- Run async validations (uniqueness checks) in the background

## Security Considerations

### Input Validation
- Always validate on the controller layer
- Sanitize user input in validators
- Never trust client-side validation alone

### Data Access
- Repositories should check permissions (when implemented)
- Use the `spark.user()` API for user context
- Log sensitive operations via history service

## Future Enhancements

### Planned Improvements
1. **Dependency Injection Container:** Implement IoC container for better testability
2. **Event Bus:** Add event-driven architecture for loose coupling
3. **Caching Layer:** Implement smart caching between repository and storage
4. **API Layer:** Abstract storage to support both local and remote APIs
5. **Permissions System:** Add role-based access control
6. **Offline Support:** Implement sync strategy for offline usage

### Extension Points
- **Custom Validators:** Add validator registration system
- **Repository Adapters:** Support multiple storage backends
- **Service Plugins:** Allow service extension via plugins
- **Middleware:** Add controller middleware for cross-cutting concerns

---

## Quick Reference

### Creating a New Feature

1. **Define Models** (`models/`) - Define data structures
2. **Create Repository** (`repositories/`) - Implement data access
3. **Write Validators** (`validators/`) - Add validation rules
4. **Build Controller** (`controllers/`) - Orchestrate business logic
5. **Create Service** (`services/`) - If complex logic needed
6. **Build Hook** (`hooks/`) - Connect React to controller
7. **Create Components** (`components/`) - Build UI

### Code Review Checklist

- [ ] No `useKV` or `spark.kv` in components
- [ ] No business logic in components
- [ ] Controllers use services and repositories
- [ ] Validators are pure functions
- [ ] Models are properly typed
- [ ] Errors are properly handled
- [ ] Changes are tracked via history service
- [ ] Tests are written for new logic

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Maintainer:** Development Team  
