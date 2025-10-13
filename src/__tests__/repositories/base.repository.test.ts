import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaseRepository } from '@/repositories/base.repository';
import { Entity } from '@/models/common.model';

interface TestEntity extends Entity {
  id: string;
  name: string;
  value: number;
  createdAt: Date;
  updatedAt: Date;
}

class TestRepository extends BaseRepository<TestEntity> {
  constructor() {
    super('test-storage-key');
  }
}

describe('BaseRepository', () => {
  let repository: TestRepository;
  let mockStorage: Map<string, any>;

  beforeEach(() => {
    mockStorage = new Map();
    
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

    repository = new TestRepository();
  });

  describe('findAll', () => {
    it('should return empty array when no items exist', async () => {
      const items = await repository.findAll();
      expect(items).toEqual([]);
    });

    it('should return all stored items', async () => {
      const testItems: TestEntity[] = [
        { id: '1', name: 'Item 1', value: 10, createdAt: new Date(), updatedAt: new Date() },
        { id: '2', name: 'Item 2', value: 20, createdAt: new Date(), updatedAt: new Date() },
      ];
      mockStorage.set('test-storage-key', testItems);

      const items = await repository.findAll();
      expect(items).toHaveLength(2);
      expect(items).toEqual(testItems);
    });
  });

  describe('findById', () => {
    it('should return undefined when item does not exist', async () => {
      const item = await repository.findById('nonexistent');
      expect(item).toBeUndefined();
    });

    it('should return item when it exists', async () => {
      const testItem: TestEntity = {
        id: '1',
        name: 'Item 1',
        value: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockStorage.set('test-storage-key', [testItem]);

      const item = await repository.findById('1');
      expect(item).toEqual(testItem);
    });

    it('should return correct item from multiple items', async () => {
      const testItems: TestEntity[] = [
        { id: '1', name: 'Item 1', value: 10, createdAt: new Date(), updatedAt: new Date() },
        { id: '2', name: 'Item 2', value: 20, createdAt: new Date(), updatedAt: new Date() },
        { id: '3', name: 'Item 3', value: 30, createdAt: new Date(), updatedAt: new Date() },
      ];
      mockStorage.set('test-storage-key', testItems);

      const item = await repository.findById('2');
      expect(item).toEqual(testItems[1]);
    });
  });

  describe('create', () => {
    it('should add new item to empty storage', async () => {
      const newItem: TestEntity = {
        id: '1',
        name: 'New Item',
        value: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const created = await repository.create(newItem);
      expect(created.id).toBe('1');
      expect(created.name).toBe('New Item');
      expect(created.createdAt).toBeInstanceOf(Date);
      expect(created.updatedAt).toBeInstanceOf(Date);

      const allItems = await repository.findAll();
      expect(allItems).toHaveLength(1);
    });

    it('should add new item to existing items', async () => {
      const existingItem: TestEntity = {
        id: '1',
        name: 'Existing',
        value: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockStorage.set('test-storage-key', [existingItem]);

      const newItem: TestEntity = {
        id: '2',
        name: 'New Item',
        value: 20,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await repository.create(newItem);
      const allItems = await repository.findAll();
      expect(allItems).toHaveLength(2);
      expect(allItems[0]).toEqual(existingItem);
      expect(allItems[1].id).toBe('2');
    });

    it('should set createdAt and updatedAt timestamps', async () => {
      const now = new Date();
      const newItem: TestEntity = {
        id: '1',
        name: 'New Item',
        value: 100,
        createdAt: new Date(0),
        updatedAt: new Date(0),
      };

      const created = await repository.create(newItem);
      expect(created.createdAt.getTime()).toBeGreaterThanOrEqual(now.getTime());
      expect(created.updatedAt.getTime()).toBeGreaterThanOrEqual(now.getTime());
    });
  });

  describe('update', () => {
    it('should throw error when item does not exist', async () => {
      const item: TestEntity = {
        id: 'nonexistent',
        name: 'Updated',
        value: 999,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await expect(repository.update(item)).rejects.toThrow('not found');
    });

    it('should update existing item', async () => {
      const originalItem: TestEntity = {
        id: '1',
        name: 'Original',
        value: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockStorage.set('test-storage-key', [originalItem]);

      const updatedItem: TestEntity = {
        ...originalItem,
        name: 'Updated',
        value: 999,
      };

      const result = await repository.update(updatedItem);
      expect(result.name).toBe('Updated');
      expect(result.value).toBe(999);
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(originalItem.updatedAt.getTime());
    });

    it('should preserve other items when updating one', async () => {
      const items: TestEntity[] = [
        { id: '1', name: 'Item 1', value: 10, createdAt: new Date(), updatedAt: new Date() },
        { id: '2', name: 'Item 2', value: 20, createdAt: new Date(), updatedAt: new Date() },
        { id: '3', name: 'Item 3', value: 30, createdAt: new Date(), updatedAt: new Date() },
      ];
      mockStorage.set('test-storage-key', items);

      const updatedItem: TestEntity = {
        ...items[1],
        name: 'Updated Item 2',
        value: 999,
      };

      await repository.update(updatedItem);
      const allItems = await repository.findAll();
      expect(allItems).toHaveLength(3);
      expect(allItems[0].name).toBe('Item 1');
      expect(allItems[1].name).toBe('Updated Item 2');
      expect(allItems[2].name).toBe('Item 3');
    });

    it('should update updatedAt timestamp', async () => {
      const originalDate = new Date(2020, 0, 1);
      const originalItem: TestEntity = {
        id: '1',
        name: 'Original',
        value: 10,
        createdAt: originalDate,
        updatedAt: originalDate,
      };
      mockStorage.set('test-storage-key', [originalItem]);

      const result = await repository.update(originalItem);
      expect(result.updatedAt.getTime()).toBeGreaterThan(originalDate.getTime());
    });
  });

  describe('delete', () => {
    it('should return false when item does not exist', async () => {
      const result = await repository.delete('nonexistent');
      expect(result).toBe(false);
    });

    it('should remove item and return true when it exists', async () => {
      const item: TestEntity = {
        id: '1',
        name: 'To Delete',
        value: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockStorage.set('test-storage-key', [item]);

      const result = await repository.delete('1');
      expect(result).toBe(true);

      const allItems = await repository.findAll();
      expect(allItems).toHaveLength(0);
    });

    it('should remove only specified item', async () => {
      const items: TestEntity[] = [
        { id: '1', name: 'Item 1', value: 10, createdAt: new Date(), updatedAt: new Date() },
        { id: '2', name: 'Item 2', value: 20, createdAt: new Date(), updatedAt: new Date() },
        { id: '3', name: 'Item 3', value: 30, createdAt: new Date(), updatedAt: new Date() },
      ];
      mockStorage.set('test-storage-key', items);

      await repository.delete('2');
      const allItems = await repository.findAll();
      expect(allItems).toHaveLength(2);
      expect(allItems.find(i => i.id === '2')).toBeUndefined();
      expect(allItems.find(i => i.id === '1')).toBeDefined();
      expect(allItems.find(i => i.id === '3')).toBeDefined();
    });
  });

  describe('exists', () => {
    it('should return false when item does not exist', async () => {
      const result = await repository.exists('nonexistent');
      expect(result).toBe(false);
    });

    it('should return true when item exists', async () => {
      const item: TestEntity = {
        id: '1',
        name: 'Existing',
        value: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockStorage.set('test-storage-key', [item]);

      const result = await repository.exists('1');
      expect(result).toBe(true);
    });
  });

  describe('count', () => {
    it('should return 0 for empty storage', async () => {
      const count = await repository.count();
      expect(count).toBe(0);
    });

    it('should return correct count of items', async () => {
      const items: TestEntity[] = [
        { id: '1', name: 'Item 1', value: 10, createdAt: new Date(), updatedAt: new Date() },
        { id: '2', name: 'Item 2', value: 20, createdAt: new Date(), updatedAt: new Date() },
        { id: '3', name: 'Item 3', value: 30, createdAt: new Date(), updatedAt: new Date() },
      ];
      mockStorage.set('test-storage-key', items);

      const count = await repository.count();
      expect(count).toBe(3);
    });
  });

  describe('clear', () => {
    it('should clear empty storage', async () => {
      await repository.clear();
      const items = await repository.findAll();
      expect(items).toHaveLength(0);
    });

    it('should remove all items from storage', async () => {
      const items: TestEntity[] = [
        { id: '1', name: 'Item 1', value: 10, createdAt: new Date(), updatedAt: new Date() },
        { id: '2', name: 'Item 2', value: 20, createdAt: new Date(), updatedAt: new Date() },
        { id: '3', name: 'Item 3', value: 30, createdAt: new Date(), updatedAt: new Date() },
      ];
      mockStorage.set('test-storage-key', items);

      await repository.clear();
      const allItems = await repository.findAll();
      expect(allItems).toHaveLength(0);
    });
  });
});
