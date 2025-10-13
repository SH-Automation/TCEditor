# History Integration Guide

This document explains how to integrate undo/redo history tracking into your components.

## Overview

The history system automatically tracks all changes made to catalog steps, test cases, and test memberships. Users can:
- Undo/Redo changes with Ctrl+Z / Ctrl+Y
- View a visual timeline of all changes
- Jump to any point in history
- Add comments/notes to changes
- View analytics charts of change patterns

## Components

### Core Components

1. **HistoryTimeline** - Full timeline view with all entries
2. **HistoryButton** - Floating action button with quick undo/redo
3. **HistoryChart** - Visual analytics of change patterns

### Using the History Hook

```typescript
import { useHistory } from '@/hooks/use-history';

function MyComponent() {
  const {
    historyState,      // Current history state with entries
    addHistoryEntry,   // Log a new change
    undo,              // Undo last change
    redo,              // Redo next change
    jumpToEntry,       // Jump to specific history entry
    clearHistory,      // Clear all history
    addComment,        // Add note to an entry
    canUndo,           // Boolean: can undo?
    canRedo,           // Boolean: can redo?
  } = useHistory();
  
  // Your component logic...
}
```

### Using Tracked Data Hooks

For automatic history integration, use the tracked data hooks instead of raw useKV:

```typescript
import { useTrackedCatalogSteps } from '@/lib/use-tracked-data';

function CatalogManager() {
  const {
    catalogSteps,
    addCatalogStep,       // Automatically logs to history
    updateCatalogStep,    // Automatically logs to history  
    deleteCatalogStep,    // Automatically logs to history
  } = useTrackedCatalogSteps();
  
  // Use these methods instead of setCatalogSteps directly
  const handleCreate = () => {
    const newStep = { /* ... */ };
    addCatalogStep(newStep);  // Automatically tracked!
  };
}
```

### Available Tracked Hooks

1. **useTrackedCatalogSteps()** - For catalog step operations
2. **useTrackedTestCases()** - For test case operations
3. **useTrackedMemberships()** - For test step membership operations

## Manual History Logging

If you need to log custom actions:

```typescript
import { useHistory } from '@/hooks/use-history';

function MyComponent() {
  const { addHistoryEntry } = useHistory();
  
  const handleCustomAction = () => {
    const previousState = currentData;
    
    // Perform your action...
    const newData = modifyData(currentData);
    
    // Log it
    addHistoryEntry(
      'update',                    // action: 'create' | 'update' | 'delete' | 'reorder' | 'bulk-update' | 'bulk-delete'
      'catalog-step',              // entityType: 'catalog-step' | 'test-case' | 'test-membership' | 'data-entry-row'
      newData.id,                  // entityId: unique identifier
      'Updated catalog step name', // description: human-readable description
      previousState,               // previousState: data before change
      newData,                     // newState: data after change
      undefined,                   // comment: optional user comment
      newData.name                 // entityName: optional display name
    );
  };
}
```

## History Entry Structure

```typescript
interface HistoryEntry {
  id: string;                    // Unique entry ID
  timestamp: Date;               // When the change occurred
  action: ChangeAction;          // Type of change
  entityType: EntityType;        // What kind of entity
  entityId: string;              // ID of the entity
  entityName?: string;           // Display name
  description: string;           // Human-readable description
  comment?: string;              // Optional user note
  previousState: any;            // State before change
  newState: any;                 // State after change
}
```

## Keyboard Shortcuts

The following keyboard shortcuts work globally:

- **Ctrl+Z** (Cmd+Z on Mac): Undo
- **Ctrl+Y** (Cmd+Y on Mac): Redo  
- **Ctrl+Shift+Z** (Cmd+Shift+Z on Mac): Redo (alternative)

## Best Practices

1. **Always capture complete state**: Store enough information in previousState/newState to fully restore the entity
2. **Write descriptive messages**: Help users understand what changed
3. **Use entity names**: Include the name/title in entityName for better timeline display
4. **Add comments for complex changes**: Encourage users to document why they made changes
5. **Test undo/redo thoroughly**: Ensure bidirectional state restoration works correctly

## Example: Converting an Existing Component

### Before (without history):

```typescript
function CatalogManager() {
  const [catalogSteps, setCatalogSteps] = useKV<CatalogStep[]>("catalog-steps", []);
  
  const handleDeleteStep = (stepId: string) => {
    setCatalogSteps(current => 
      (current || []).filter(step => step.id !== stepId)
    );
  };
}
```

### After (with history):

```typescript
function CatalogManager() {
  const {
    catalogSteps,
    deleteCatalogStep,  // Now automatically tracked!
  } = useTrackedCatalogSteps();
  
  const handleDeleteStep = (stepId: string) => {
    deleteCatalogStep(stepId);  // That's it!
  };
}
```

## UI Integration

The history system includes:

1. **Floating Action Button** (bottom-right) - Quick access to undo/redo and full timeline
2. **History Tab** - Dedicated view with timeline and analytics
3. **Keyboard Shortcuts** - Standard Ctrl+Z/Y shortcuts work everywhere

## Configuration

History settings are stored in the HistoryState:

```typescript
interface HistoryState {
  entries: HistoryEntry[];       // All history entries
  currentIndex: number;          // Current position in history
  maxHistorySize: number;        // Max entries (default: 100)
}
```

To change the maximum history size, update the DEFAULT_MAX_HISTORY constant in `src/hooks/use-history.ts`.
