export type ChangeAction = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'reorder'
  | 'bulk-update'
  | 'bulk-delete';

export type EntityType = 
  | 'catalog-step' 
  | 'test-case' 
  | 'test-membership'
  | 'data-entry-row';

export interface HistoryEntry {
  id: string;
  timestamp: Date;
  action: ChangeAction;
  entityType: EntityType;
  entityId: string;
  entityName?: string;
  description: string;
  comment?: string;
  previousState: any;
  newState: any;
  userId?: string;
}

export interface HistoryState {
  entries: HistoryEntry[];
  currentIndex: number;
  maxHistorySize: number;
}
