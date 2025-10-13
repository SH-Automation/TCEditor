# Developer Guide

## Welcome!

This guide will help you understand and work with the Test Case Management System codebase. Whether you're fixing a bug, adding a feature, or refactoring code, this document provides the essential information you need.

## 🏗️ Architecture Overview

This application follows a **three-tier layered architecture**:

```
┌─────────────────────────────────┐
│   Presentation Layer (Views)    │  ← React Components
├─────────────────────────────────┤
│   Business Logic (Controllers)  │  ← Validation & Logic
├─────────────────────────────────┤
│   Data Access (Repositories)    │  ← Data Storage
└─────────────────────────────────┘
```

**Golden Rule:** Components should NEVER directly access data storage. Always go through repositories and controllers.

## 📁 Project Structure

```
src/
├── models/              # Data models & TypeScript interfaces
├── validators/          # Validation logic (pure functions)
├── repositories/        # Data access layer (CRUD operations)
├── controllers/         # Business logic orchestration (FUTURE)
├── services/            # Domain services (import/export, history)
├── components/          # React UI components
│   ├── ui/             # Base shadcn components (DO NOT EDIT)
│   └── [domain]/       # Domain-specific components
├── hooks/              # Custom React hooks
└── lib/                # Shared utilities

```

## 🚀 Quick Start Guide

### Prerequisites

```bash
# Check Node.js version (should be 18+)
node --version

# Install dependencies
npm install

# Start development server
npm run dev
```

### Making Your First Change

1. **Understand the layer** - Determine which layer your change affects
2. **Find the right file** - Use the structure above to locate code
3. **Make the change** - Follow the patterns you see
4. **Test manually** - Verify in the browser
5. **Check the architecture** - Ensure you haven't violated layer boundaries

## 🎯 Common Tasks

### Task 1: Add a New Validation Rule

**Example:** Add validation for step duration

```typescript
// 1. Add to validators/catalog.validator.ts
export function validateStepDuration(value: number): ValidationResult {
  if (value < 0) {
    return {
      isValid: false,
      error: 'Duration cannot be negative',
      warningLevel: 'error',
    };
  }
  
  if (value > 3600) {
    return {
      isValid: false,
      error: 'Duration cannot exceed 1 hour (3600 seconds)',
      suggestion: 'Consider breaking into smaller steps',
      warningLevel: 'warning',
    };
  }
  
  return { isValid: true, warningLevel: 'info' };
}

// 2. Update the model (models/catalog.model.ts)
export interface CatalogStep extends Entity {
  // ... existing fields
  duration?: number; // in seconds
}

// 3. Use in controller (when you create one)
const durationCheck = validateStepDuration(input.duration || 0);
if (!durationCheck.isValid) {
  return { success: false, error: durationCheck.error };
}
```

### Task 2: Add a New Repository Query

**Example:** Find catalog steps by SQL table

```typescript
// In repositories/catalog.repository.ts
export class CatalogRepository extends BaseRepository<CatalogStep> {
  // ... existing methods
  
  async findBySqlTable(sqlTable: string): Promise<CatalogStep[]> {
    const steps = await this.getFromStorage();
    return steps.filter(s => s.sqlTables.includes(sqlTable));
  }
  
  async getStepStatistics(): Promise<{
    total: number;
    byJavaClass: Map<string, number>;
  }> {
    const steps = await this.getFromStorage();
    const byJavaClass = new Map<string, number>();
    
    steps.forEach(step => {
      const count = byJavaClass.get(step.javaClass) || 0;
      byJavaClass.set(step.javaClass, count + 1);
    });
    
    return {
      total: steps.length,
      byJavaClass,
    };
  }
}
```

### Task 3: Add a New Component

**Example:** Add a component to display step statistics

```typescript
// 1. Create components/catalog/CatalogStats.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRepository } from '@/repositories/base.repository';
import { CatalogStep } from '@/models/catalog.model';

export function CatalogStats() {
  // Use repository via hook
  const { items: steps } = useRepository<CatalogStep>('catalog-steps');
  
  // Compute derived data
  const javaClasses = new Set(steps.map(s => s.javaClass)).size;
  const sqlTables = new Set(steps.flatMap(s => s.sqlTables)).size;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Catalog Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>Total Steps: {steps.length}</div>
          <div>Unique Java Classes: {javaClasses}</div>
          <div>Unique SQL Tables: {sqlTables}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// 2. Use in parent component
import { CatalogStats } from '@/components/catalog/CatalogStats';

function CatalogManager() {
  return (
    <div className="space-y-6">
      <CatalogStats />
      {/* ... other components */}
    </div>
  );
}
```

### Task 4: Add a New Model Field

**Example:** Add "priority" field to test cases

```typescript
// 1. Update model (models/testcase.model.ts)
export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface TestCase extends Entity {
  // ... existing fields
  priority: Priority;
}

export interface CreateTestCaseInput {
  // ... existing fields
  priority: Priority;
}

// 2. Add validation (validators/testcase.validator.ts)
export function validatePriority(value: string): ValidationResult {
  const validPriorities = ['low', 'medium', 'high', 'critical'];
  
  if (!validPriorities.includes(value)) {
    return {
      isValid: false,
      error: 'Invalid priority level',
      suggestion: `Choose from: ${validPriorities.join(', ')}`,
      warningLevel: 'error',
    };
  }
  
  return { isValid: true, warningLevel: 'info' };
}

// 3. Update existing test cases (migration)
// Add to component that loads test cases:
useEffect(() => {
  // Migrate old data
  const migrateTestCases = async () => {
    const cases = await testCaseRepository.findAll();
    const needsMigration = cases.some(tc => !tc.priority);
    
    if (needsMigration) {
      for (const tc of cases) {
        if (!tc.priority) {
          await testCaseRepository.update({
            ...tc,
            priority: 'medium',
          });
        }
      }
    }
  };
  
  migrateTestCases();
}, []);

// 4. Add UI (components/testcase/TestCaseForm.tsx)
<Select value={priority} onValueChange={setPriority}>
  <SelectTrigger>
    <SelectValue placeholder="Select priority" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="low">Low</SelectItem>
    <SelectItem value="medium">Medium</SelectItem>
    <SelectItem value="high">High</SelectItem>
    <SelectItem value="critical">Critical</SelectItem>
  </SelectContent>
</Select>
```

## 🛡️ Architectural Rules

### ✅ DO

```typescript
// ✅ Components use hooks to get data
function CatalogList() {
  const { items, loading } = useRepository<CatalogStep>('catalog-steps');
  // ...
}

// ✅ Validators are pure functions
export function validateName(value: string): ValidationResult {
  if (value.length < 3) {
    return { isValid: false, error: 'Too short' };
  }
  return { isValid: true };
}

// ✅ Repositories handle data access
class CatalogRepository extends BaseRepository<CatalogStep> {
  async findAll(): Promise<CatalogStep[]> {
    return this.getFromStorage();
  }
}

// ✅ Models define structure
export interface CatalogStep extends Entity {
  name: string;
  description: string;
}
```

### ❌ DON'T

```typescript
// ❌ DON'T access useKV directly in components
function CatalogList() {
  const [steps, setSteps] = useKV('catalog-steps', []);
  // WRONG! Use repository instead
}

// ❌ DON'T put business logic in components
function CatalogForm() {
  const handleSubmit = () => {
    if (name.length < 3 || name.length > 100) {
      toast.error('Invalid name');
      return;
    }
    // WRONG! Use validator instead
  };
}

// ❌ DON'T put validation in repositories
class CatalogRepository {
  async create(step: CatalogStep) {
    if (step.name.length < 3) {
      throw new Error('Invalid name');
    }
    // WRONG! Validation belongs in validators
  }
}

// ❌ DON'T mix concerns
function saveStepAndShowNotification() {
  // Save step
  // Show notification
  // Update history
  // WRONG! Separate these concerns
}
```

## 🐛 Debugging Tips

### Common Issues

#### Issue 1: Data Not Updating

**Problem:** Component doesn't reflect changes  
**Solution:** Check that you're using functional updates with `useKV`

```typescript
// ❌ WRONG - Stale closure issue
const [items, setItems] = useKV('key', []);
const addItem = (item) => setItems([...items, item]);

// ✅ CORRECT - Use functional update
const addItem = (item) => setItems(current => [...(current || []), item]);
```

#### Issue 2: Validation Not Working

**Problem:** Validation passes when it shouldn't  
**Solution:** Check that validator is being called with correct parameters

```typescript
// Add debug logging
const result = validateStepName(name, existingSteps, currentId);
console.log('Validation result:', result);
if (!result.isValid) {
  console.log('Validation failed:', result.error);
  return;
}
```

#### Issue 3: TypeScript Errors

**Problem:** Type errors in repository  
**Solution:** Ensure models are properly imported and typed

```typescript
// ❌ WRONG
const [items, setItems] = useKV('key');

// ✅ CORRECT
const [items, setItems] = useKV<CatalogStep[]>('key', []);
```

### Debugging Tools

```typescript
// 1. Inspect storage directly in browser console
window.spark.kv.keys().then(console.log);
window.spark.kv.get('catalog-steps').then(console.log);

// 2. Add temporary logging to track data flow
console.log('[Repository] Finding all catalog steps');
const steps = await this.getFromStorage();
console.log('[Repository] Found', steps.length, 'steps');

// 3. Use React DevTools to inspect component state
// Look for the component and check its hooks
```

## 🔄 Data Flow Examples

### Example 1: Creating a Catalog Step

```
User Input (Component)
    ↓
Validate (Validator)
    ↓
Create (Repository)
    ↓
Save (useKV/spark.kv)
    ↓
Update UI (React re-render)
```

**Code:**
```typescript
// Component
const handleCreate = async () => {
  // 1. Validate
  const validation = validateCatalogStep(formData, existingSteps);
  if (!validation.isValid) {
    toast.error(validation.error);
    return;
  }
  
  // 2. Create via repository
  const newStep = await catalogRepository.create({
    id: generateId(),
    ...formData,
  });
  
  // 3. UI updates automatically via useKV
  toast.success('Step created!');
};
```

### Example 2: Searching Catalog Steps

```
Search Input (Component)
    ↓
Query (Repository)
    ↓
Filter Data (Repository)
    ↓
Return Results
    ↓
Display (Component)
```

**Code:**
```typescript
// Component
const [searchTerm, setSearchTerm] = useState('');
const [results, setResults] = useState<CatalogStep[]>([]);

useEffect(() => {
  const search = async () => {
    if (searchTerm) {
      const found = await catalogRepository.search(searchTerm);
      setResults(found);
    } else {
      const all = await catalogRepository.findAll();
      setResults(all);
    }
  };
  search();
}, [searchTerm]);
```

## 📝 Code Style Guide

### Naming Conventions

```typescript
// Components: PascalCase
export function CatalogStepCard() {}

// Functions: camelCase
export function validateStepName() {}

// Constants: UPPER_SNAKE_CASE
const MAX_STEP_NAME_LENGTH = 100;

// Interfaces: PascalCase
export interface CatalogStep {}

// Types: PascalCase
export type ValidationResult = {};

// Files: kebab-case
// catalog-step-card.tsx
// validation.service.ts
```

### Function Organization

```typescript
// 1. Imports
import { useState } from 'react';
import { CatalogStep } from '@/models/catalog.model';

// 2. Types/Interfaces
interface Props {
  step: CatalogStep;
}

// 3. Constants
const MAX_LENGTH = 100;

// 4. Main component/function
export function CatalogStepCard({ step }: Props) {
  // 4a. Hooks
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 4b. Handlers
  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };
  
  // 4c. Render
  return <div>{/* ... */}</div>;
}

// 5. Helper functions (if needed)
function formatStepName(name: string) {
  return name.trim().toUpperCase();
}
```

### Comments

```typescript
// ✅ GOOD: Explain WHY, not WHAT
// We need to sort by name because the UI displays them alphabetically
const sorted = steps.sort((a, b) => a.name.localeCompare(b.name));

// ❌ BAD: Redundant comment
// Sort the steps
const sorted = steps.sort((a, b) => a.name.localeCompare(b.name));

// ✅ GOOD: Document complex business logic
/**
 * Generates the next available TCID based on an existing one.
 * Handles multiple formats: TC-001, PROJECT-TC-001, TC-001-V1
 * 
 * @param baseTCID - The TCID to increment
 * @param existingTestCases - All existing test cases to check for collisions
 * @returns The next available TCID
 */
export function generateNextTCID(
  baseTCID: string,
  existingTestCases: TestCase[]
): string {
  // ...
}
```

## 🧪 Testing Guidelines

### Manual Testing Checklist

When making changes, test:

- [ ] Happy path (everything works as expected)
- [ ] Empty state (no data)
- [ ] With data (populated)
- [ ] Validation errors (invalid input)
- [ ] Edge cases (max length, special characters, etc.)
- [ ] Browser refresh (data persists)
- [ ] Mobile view (responsive design)

### Future: Automated Tests

We plan to add:
- Unit tests for validators
- Integration tests for repositories
- Component tests for UI

## 🚨 Common Pitfalls

### Pitfall 1: Stale Closures with useKV

```typescript
// ❌ WRONG
const [items, setItems] = useKV('items', []);
const addItem = (item) => {
  setItems([...items, item]); // 'items' is stale!
};

// ✅ CORRECT
const addItem = (item) => {
  setItems(current => [...(current || []), item]);
};
```

### Pitfall 2: Not Handling Undefined

```typescript
// ❌ WRONG
const [items, setItems] = useKV<Item[]>('items', []);
const first = items[0]; // items might be undefined!

// ✅ CORRECT
const [items, setItems] = useKV<Item[]>('items', []);
const first = items?.[0];
const count = items?.length || 0;
```

### Pitfall 3: Direct Mutation

```typescript
// ❌ WRONG
const [items, setItems] = useKV('items', []);
items.push(newItem); // Direct mutation!
setItems(items);

// ✅ CORRECT
setItems(current => [...(current || []), newItem]);
```

## 📚 Additional Resources

### Key Files to Understand

1. **ARCHITECTURE.md** - Complete architecture documentation
2. **src/models/** - All data models
3. **src/validators/** - All validation logic
4. **src/repositories/** - All data access
5. **src/components/ui/** - shadcn components (reference only)

### External Documentation

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Getting Help

1. **Read the Architecture Doc** - ARCHITECTURE.md explains the design
2. **Check Existing Code** - Look for similar patterns
3. **Add Debug Logging** - console.log is your friend
4. **Test Incrementally** - Make small changes and test often

## 🎓 Learning Path

### For New Developers

**Week 1: Understand the Data**
- Read all model files in `src/models/`
- Understand the relationships between entities
- Try querying data in browser console

**Week 2: Understand Data Access**
- Read repository files in `src/repositories/`
- Understand how data is stored and retrieved
- Try creating a new repository method

**Week 3: Understand Validation**
- Read validator files in `src/validators/`
- Understand validation patterns
- Try adding a new validation rule

**Week 4: Understand UI**
- Read component files in `src/components/`
- Understand how components use repositories
- Try creating a new component

### For Experienced Developers

1. **Read ARCHITECTURE.md** - Understand the layers
2. **Scan key files** - Get a feel for patterns
3. **Make a small change** - Learn by doing
4. **Refactor something** - Improve the codebase

## 🔧 Maintenance Tasks

### Regular Maintenance

- **Check for unused code** - Remove dead code monthly
- **Update dependencies** - Check for updates weekly
- **Review validation logic** - Ensure rules are current
- **Optimize queries** - Profile slow operations
- **Update documentation** - Keep docs in sync with code

### Before Each Release

- [ ] Test all major workflows
- [ ] Check browser console for errors
- [ ] Verify data persists correctly
- [ ] Test on mobile devices
- [ ] Review recent changes
- [ ] Update CHANGES.md

---

## 💡 Pro Tips

1. **Use TypeScript fully** - Let the compiler catch errors
2. **Keep functions small** - Easier to test and understand
3. **Name things clearly** - Future you will thank you
4. **Don't repeat yourself** - Extract common logic
5. **Test as you go** - Don't wait until the end
6. **Read existing code** - Learn from patterns already there
7. **Ask questions** - Better to ask than to break things

---

**Happy Coding! 🚀**

If you improve this guide, please update it so the next developer benefits!
