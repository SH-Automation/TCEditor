# Change History & Undo/Redo System

A comprehensive change tracking system with full undo/redo capabilities, visual timeline, and analytics.

## Features

### 🔄 Undo/Redo
- **Keyboard shortcuts**: Ctrl+Z to undo, Ctrl+Y to redo (Cmd on Mac)
- **Bidirectional navigation**: Move forward and backward through your change history
- **Smart state management**: Automatically captures complete entity state for accurate restoration
- **Branch handling**: Creating new changes after undo automatically creates a new branch

### 📊 Visual Timeline
- **Interactive timeline**: Click any entry to jump directly to that state
- **Color-coded actions**: Visual distinction between create, update, delete, and reorder operations
- **Rich metadata**: Timestamps, entity names, and descriptions for every change
- **Current position indicator**: Clear visual feedback showing where you are in history

### 💬 Change Annotations
- **Add notes**: Attach comments to any history entry
- **Document decisions**: Explain why changes were made
- **Searchable context**: Build a record of your workflow

### 📈 Analytics
- **Change patterns over time**: Bar charts showing daily activity
- **Action type breakdown**: See distribution of creates, updates, deletes
- **Entity statistics**: Track changes by entity type
- **Usage insights**: Understand how the system is being used

### 🎯 Automatic Tracking
- **Zero configuration**: All CRUD operations automatically logged
- **Comprehensive coverage**: Catalog steps, test cases, and memberships tracked
- **Smart descriptions**: Auto-generated human-readable change descriptions
- **Performance optimized**: Efficient storage with automatic pruning (100 entry limit)

## User Interface

### Floating Action Button
Located in the bottom-right corner of the screen:
- **Quick Undo/Redo buttons**: One-click access to undo/redo
- **History badge**: Shows total number of tracked changes
- **Slide-out panel**: Full timeline view with one click

### History Tab
Dedicated view accessible from the main navigation:
- **Analytics dashboard**: Charts showing change patterns
- **Full timeline**: Complete scrollable history with all details
- **Bulk operations**: Clear all history with confirmation

### Timeline Features
Each history entry shows:
- **Action type badge**: Color-coded (green=create, blue=update, red=delete, purple=reorder)
- **Timestamp**: When the change occurred
- **Entity name**: What was changed
- **Description**: Human-readable summary
- **Notes**: Optional user comments
- **State indicator**: Visual marker showing current position

## Technical Details

### Storage
- Uses persistent key-value storage via `useKV` hook
- Automatically synchronized across sessions
- Configurable history size limit (default: 100 entries)
- Efficient pruning of old entries

### State Management
- Immutable state snapshots for each change
- Complete entity data captured for accurate restoration
- Handles complex nested objects and arrays
- Prevents circular reference issues

### Tracked Entities
1. **Catalog Steps**: Test step library entries
2. **Test Cases**: Test scenario definitions  
3. **Test Memberships**: Step-to-case associations
4. **Data Entry Rows**: (extensible for future data grid operations)

### Action Types
- **create**: New entity added
- **update**: Existing entity modified
- **delete**: Entity removed
- **reorder**: Position/order changed
- **bulk-update**: Multiple entities updated
- **bulk-delete**: Multiple entities deleted

## Usage Examples

### Basic Undo/Redo
```
1. Create a new catalog step
2. Press Ctrl+Z to undo → step is removed
3. Press Ctrl+Y to redo → step is restored
```

### Timeline Navigation
```
1. View History tab
2. Click any entry in the timeline
3. System jumps to that exact state
4. All subsequent changes appear dimmed (future state)
```

### Adding Comments
```
1. Open history timeline
2. Click "Add note" on any entry
3. Type your comment explaining the change
4. Comment appears with note icon in timeline
```

### Analytics Review
```
1. Navigate to History tab
2. View "Changes Over Time" chart
3. See daily breakdown of activity
4. Check "Changes by Action Type" for distribution
5. Review entity type statistics
```

## Best Practices

### For Users
1. **Use undo liberally**: Don't fear making changes, you can always undo
2. **Add notes to complex changes**: Document your reasoning
3. **Review history before major operations**: Check what will be affected
4. **Use timeline navigation for comparisons**: Jump between states to compare

### For Developers
1. **Use tracked data hooks**: `useTrackedCatalogSteps()` instead of raw `useKV`
2. **Capture complete state**: Ensure previousState/newState are comprehensive
3. **Write descriptive messages**: Help users understand what changed
4. **Test undo/redo flows**: Verify bidirectional restoration works correctly

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Z (Cmd+Z) | Undo last change |
| Ctrl+Y (Cmd+Y) | Redo next change |
| Ctrl+Shift+Z (Cmd+Shift+Z) | Redo next change (alternative) |

## Configuration

### Adjust History Size
Edit `src/hooks/use-history.ts`:
```typescript
const DEFAULT_MAX_HISTORY = 100; // Change this value
```

### Customize Colors
Edit `src/components/HistoryChart.tsx`:
```typescript
const ACTION_COLORS: Record<ChangeAction, string> = {
  'create': '#10b981',   // Green
  'update': '#3b82f6',   // Blue
  'delete': '#ef4444',   // Red
  // ... modify as needed
};
```

## Architecture

### Components
- **HistoryButton**: Floating action button with quick access
- **HistoryTimeline**: Full timeline view with all entries
- **HistoryChart**: Analytics visualizations

### Hooks
- **useHistory**: Core hook for history operations
- **useTrackedCatalogSteps**: Auto-tracked catalog step operations
- **useTrackedTestCases**: Auto-tracked test case operations
- **useTrackedMemberships**: Auto-tracked membership operations

### Types
- **HistoryEntry**: Single history record
- **HistoryState**: Overall history state
- **ChangeAction**: Type of change
- **EntityType**: Type of entity

## Troubleshooting

### Undo/Redo not working
- Check that keyboard shortcuts aren't blocked by browser
- Verify history has entries (check History tab)
- Ensure you're at a valid position (canUndo/canRedo)

### History not showing changes
- Confirm you're using tracked data hooks
- Check that changes are being saved properly
- Review browser console for errors

### Timeline position incorrect
- Click specific entry to jump to exact state
- Use undo/redo buttons instead of clicking if confused
- Clear history and start fresh if corrupted

## Future Enhancements

Potential improvements:
- History export to JSON/CSV
- Search and filter timeline
- Comparison view between two states
- Collaborative change tracking with user attribution
- Automatic save points/bookmarks
- History compression for large datasets
