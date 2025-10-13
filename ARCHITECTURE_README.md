# Architecture Documentation Index

## 📚 Welcome to the Architecture Documentation

This Test Case Management System follows a **clean, layered architecture** designed for maintainability, testability, and scalability. This README serves as your entry point to understanding the codebase.

## 🎯 Quick Start

**New Developer?** Start here:

1. **Read This Page First** - Get the overview
2. **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** - Learn by doing (2-hour read)
3. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Deep dive into architecture (1-hour read)
4. **Make your first change** - Learn hands-on

**Experienced Developer?** Start here:

1. **Read This Page** - Get oriented (5 minutes)
2. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Understand the design (20 minutes)
3. **[API_REFERENCE.md](./API_REFERENCE.md)** - Reference as needed
4. **Start coding** - The architecture will guide you

## 📖 Documentation Structure

### Core Documentation

| Document | Purpose | Who Should Read | Time |
|----------|---------|-----------------|------|
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | Complete architecture design, patterns, and principles | Everyone | 60 min |
| **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** | Practical development guide with examples | New developers, Contributors | 120 min |
| **[API_REFERENCE.md](./API_REFERENCE.md)** | Complete API documentation | All developers | Reference |
| **[LAYERED_ARCHITECTURE.md](./LAYERED_ARCHITECTURE.md)** | Deep dive into layered design patterns | Architects, Senior devs | 45 min |
| **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** | Guide for migrating old code | Maintainers | 30 min |

### Feature Documentation

| Document | Purpose |
|----------|---------|
| **[DATABASE_README.md](./DATABASE_README.md)** | Database simulation system |
| **[HISTORY_README.md](./HISTORY_README.md)** | Change tracking and undo/redo |
| **[IMPORT_EXPORT_GUIDE.md](./IMPORT_EXPORT_GUIDE.md)** | CSV import/export functionality |
| **[DATA_ENTRY_GUIDE.md](./DATA_ENTRY_GUIDE.md)** | Bulk data entry interface |

## 🏗️ Architecture At a Glance

### Three-Layer Design

```
┌─────────────────────────────────────────────────┐
│         PRESENTATION LAYER                      │
│  Components, Views, UI Logic                    │
│  📁 src/components/                             │
├─────────────────────────────────────────────────┤
│         BUSINESS LOGIC LAYER                    │
│  Controllers, Services, Validators              │
│  📁 src/controllers/ (future)                   │
│  📁 src/services/                               │
│  📁 src/validators/                             │
├─────────────────────────────────────────────────┤
│         DATA ACCESS LAYER                       │
│  Repositories, Models, Storage                  │
│  📁 src/repositories/                           │
│  📁 src/models/                                 │
└─────────────────────────────────────────────────┘
```

### Key Principles

1. **Separation of Concerns** - Each layer has a single, well-defined responsibility
2. **Dependency Flow** - Layers only depend on layers below them
3. **Abstraction** - Each layer provides a clean API to the layer above
4. **Testability** - Each layer can be tested in isolation
5. **Maintainability** - Changes are localized to specific layers

## 📁 Directory Structure

```
src/
├── models/                 # DATA LAYER - Type definitions
│   ├── common.model.ts    # Shared types (Result, Entity, etc.)
│   ├── catalog.model.ts   # Catalog domain models
│   ├── testcase.model.ts  # Test case domain models
│   └── index.ts           # Barrel export
│
├── validators/            # BUSINESS LAYER - Validation logic
│   ├── common.validator.ts   # Shared validation utilities
│   ├── catalog.validator.ts  # Catalog validation rules
│   ├── testcase.validator.ts # Test case validation rules
│   ├── tcid.validator.ts     # TCID format validation
│   └── index.ts              # Barrel export
│
├── repositories/          # DATA LAYER - Data access
│   ├── base.repository.ts     # Base CRUD operations
│   ├── catalog.repository.ts  # Catalog data access
│   ├── testcase.repository.ts # Test case data access
│   └── index.ts               # Barrel export
│
├── controllers/           # BUSINESS LAYER - Orchestration (future)
│   ├── catalog.controller.ts  # Catalog operations
│   └── testcase.controller.ts # Test case operations
│
├── services/              # BUSINESS LAYER - Domain services
│   ├── validation.service.ts  # Validation orchestration
│   ├── import-export.service.ts # Import/export logic
│   └── history.service.ts     # Change tracking
│
├── components/            # PRESENTATION LAYER - UI
│   ├── ui/               # Base shadcn components (DO NOT EDIT)
│   ├── catalog/          # Catalog UI components
│   ├── testcase/         # Test case UI components
│   ├── database/         # Database UI components
│   └── shared/           # Shared UI components
│
├── hooks/                # PRESENTATION - React hooks
│   ├── use-catalog.ts   # Catalog data hook (future)
│   ├── use-testcase.ts  # Test case data hook (future)
│   └── use-mobile.ts    # Mobile detection
│
└── lib/                  # SHARED - Utilities
    ├── utils.ts         # General utilities
    ├── constants.ts     # App constants
    └── validation.ts    # Legacy validation (being phased out)
```

## 🚀 Common Tasks Quick Reference

### Task: Add New Validation Rule

**Files to modify:**
1. `src/validators/[domain].validator.ts` - Add validation function
2. Component - Use the validator

**Example:**
```typescript
// 1. Add to validators/catalog.validator.ts
export function validateStepPriority(value: number): ValidationResult {
  return validateRange(value, 'Priority', 1, 5);
}

// 2. Use in component
const result = validateStepPriority(priority);
if (!result.isValid) {
  toast.error(result.error);
}
```

### Task: Add New Model Field

**Files to modify:**
1. `src/models/[domain].model.ts` - Update interface
2. `src/validators/[domain].validator.ts` - Add validation (if needed)
3. Components - Update usage

### Task: Add New Query Method

**Files to modify:**
1. `src/repositories/[domain].repository.ts` - Add method
2. Component - Use the method

**Example:**
```typescript
// 1. Add to repository
async findByPriority(priority: number): Promise<CatalogStep[]> {
  const steps = await this.getFromStorage();
  return steps.filter(s => s.priority === priority);
}

// 2. Use in component
const highPrioritySteps = await catalogRepository.findByPriority(5);
```

### Task: Add New Component

**Files to create:**
1. `src/components/[domain]/ComponentName.tsx` - New component

**Guidelines:**
- Use `useRepository` hook for data access
- Delegate validation to validator functions
- Keep business logic minimal
- Focus on presentation

## 🛡️ Architectural Rules (The "Don'ts")

### ❌ DON'T: Access Storage Directly in Components

```typescript
// ❌ WRONG
function MyComponent() {
  const [items, setItems] = useKV('catalog-steps', []);
}

// ✅ CORRECT
function MyComponent() {
  const { items } = useRepository<CatalogStep>('catalog-steps');
}
```

### ❌ DON'T: Put Business Logic in Components

```typescript
// ❌ WRONG
const handleCreate = () => {
  if (name.length < 3) {
    toast.error("Name too short");
    return;
  }
  // ...
};

// ✅ CORRECT
const handleCreate = () => {
  const result = validateStepName(name, existingSteps);
  if (!result.isValid) {
    toast.error(result.error);
    return;
  }
  // ...
};
```

### ❌ DON'T: Put Validation in Repositories

```typescript
// ❌ WRONG
class CatalogRepository {
  async create(step: CatalogStep) {
    if (step.name.length < 3) throw new Error("Invalid");
    // ...
  }
}

// ✅ CORRECT - Validation in validator, repository just stores
export function validateStepName(name: string): ValidationResult {
  if (name.length < 3) {
    return { isValid: false, error: "Name too short" };
  }
  return { isValid: true };
}
```

## 📊 Current Migration Status

### ✅ Completed

- [x] Model layer created (`src/models/`)
- [x] Validator layer created (`src/validators/`)
- [x] Repository layer created (`src/repositories/`)
- [x] Base repository infrastructure
- [x] TCID validation with enhanced features
- [x] Comprehensive documentation

### 🚧 In Progress

- [ ] Migrate components to use repositories
- [ ] Remove direct `useKV` usage from components
- [ ] Implement controller layer

### 📋 Planned

- [ ] Add unit tests for validators
- [ ] Add integration tests for repositories
- [ ] Implement dependency injection container
- [ ] Add caching layer to repositories
- [ ] Implement event-driven architecture

## 🧪 Testing

### Current State

Manual testing only. See test checklists in [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md).

### Future Plans

1. **Unit Tests** - Validators and services (Jest/Vitest)
2. **Integration Tests** - Repositories and controllers
3. **Component Tests** - React Testing Library
4. **E2E Tests** - Playwright (future)

## 🤝 Contributing

### Before Making Changes

1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) - Understand the design
2. Read [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) - Learn the patterns
3. Check [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - If working on old code

### Code Review Checklist

- [ ] Changes follow layered architecture
- [ ] No direct `useKV` usage in new components
- [ ] Validation uses validator functions
- [ ] Data access uses repositories
- [ ] Models are updated if data structure changed
- [ ] Documentation updated if public API changed
- [ ] Manual testing completed

### Getting Help

1. **Check Documentation** - Start with this page
2. **Look at Examples** - Study existing code in new structure
3. **Ask Questions** - Better to ask than to break architecture

## 📈 Benefits of This Architecture

### For Developers

- **Clear Structure** - Easy to find where code belongs
- **Type Safety** - TypeScript throughout
- **Consistent Patterns** - Same approach everywhere
- **Easy Testing** - Each layer can be tested independently
- **Great Documentation** - Comprehensive guides

### For the Project

- **Maintainability** - Easy to modify and extend
- **Scalability** - Can grow without becoming messy
- **Quality** - Architectural rules enforce best practices
- **Onboarding** - New developers get up to speed quickly
- **Reliability** - Clear error handling and validation

## 🎓 Learning Path

### Week 1: Understanding

- [ ] Read ARCHITECTURE_README.md (this file)
- [ ] Read ARCHITECTURE.md
- [ ] Study models in `src/models/`
- [ ] Understand the three layers

### Week 2: Exploration

- [ ] Read DEVELOPER_GUIDE.md
- [ ] Study validators in `src/validators/`
- [ ] Study repositories in `src/repositories/`
- [ ] Try querying data in browser console

### Week 3: Practice

- [ ] Make a small change following the guide
- [ ] Add a new validation rule
- [ ] Add a new repository method
- [ ] Update documentation

### Week 4: Mastery

- [ ] Migrate a component to new architecture
- [ ] Review pull requests
- [ ] Help other developers
- [ ] Improve the documentation

## 🔗 Quick Links

### For Daily Development

- [API Reference](./API_REFERENCE.md) - Look up method signatures
- [Developer Guide](./DEVELOPER_GUIDE.md) - How-to examples
- [Common Patterns](./LAYERED_ARCHITECTURE.md) - Best practices

### For Architecture Decisions

- [Architecture Doc](./ARCHITECTURE.md) - Design principles
- [Layered Architecture](./LAYERED_ARCHITECTURE.md) - Layer details
- [Migration Guide](./MIGRATION_GUIDE.md) - Migration patterns

### For Specific Features

- [Database System](./DATABASE_README.md)
- [History System](./HISTORY_README.md)
- [Import/Export](./IMPORT_EXPORT_GUIDE.md)

## 💡 Design Philosophy

> "The best architecture is one that makes the right thing easy and the wrong thing hard."

This architecture makes it:

- **Easy to add features** - Clear place for new code
- **Easy to test** - Layers are independent
- **Easy to understand** - Consistent structure
- **Hard to violate principles** - Type system enforces rules
- **Hard to create bugs** - Validation everywhere

## 🎯 Goals

### Achieved ✅

- Clean separation of concerns
- Type-safe API throughout
- Comprehensive validation
- Well-documented architecture
- Migration path from old code

### In Progress 🚧

- Full component migration
- Controller layer implementation
- Automated testing

### Future 📋

- Dependency injection
- Event-driven architecture
- Performance optimization
- Advanced caching
- Real database support

---

## 📞 Questions?

- **Not sure where code belongs?** → Check [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Need to implement something?** → Check [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)
- **Looking for an API?** → Check [API_REFERENCE.md](./API_REFERENCE.md)
- **Working on old code?** → Check [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
- **Learning the patterns?** → Check [LAYERED_ARCHITECTURE.md](./LAYERED_ARCHITECTURE.md)

---

**Architecture Version:** 1.0  
**Last Updated:** 2024  
**Status:** Initial implementation complete, migration in progress  
**Maintainer:** Development Team

**Happy Coding! 🚀**
