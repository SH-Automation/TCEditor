import { useKV } from '@github/spark/hooks';
import { Entity } from '@/models/common.model';
import { useCallback } from 'react';

export abstract class BaseRepository<T extends Entity> {
  constructor(protected readonly storageKey: string) {}

  protected async getFromStorage(): Promise<T[]> {
    const data = await window.spark.kv.get<T[]>(this.storageKey);
    return data || [];
  }

  protected async saveToStorage(data: T[]): Promise<void> {
    await window.spark.kv.set(this.storageKey, data);
  }

  async findAll(): Promise<T[]> {
    return this.getFromStorage();
  }

  async findById(id: string): Promise<T | undefined> {
    const items = await this.getFromStorage();
    return items.find(item => item.id === id);
  }

  async create(item: T): Promise<T> {
    const items = await this.getFromStorage();
    const newItem = {
      ...item,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    items.push(newItem);
    await this.saveToStorage(items);
    return newItem;
  }

  async update(item: T): Promise<T> {
    const items = await this.getFromStorage();
    const index = items.findIndex(i => i.id === item.id);
    
    if (index === -1) {
      throw new Error(`Item with id ${item.id} not found`);
    }

    const updatedItem = {
      ...item,
      updatedAt: new Date(),
    };
    items[index] = updatedItem;
    await this.saveToStorage(items);
    return updatedItem;
  }

  async delete(id: string): Promise<boolean> {
    const items = await this.getFromStorage();
    const filteredItems = items.filter(item => item.id !== id);
    
    if (filteredItems.length === items.length) {
      return false;
    }

    await this.saveToStorage(filteredItems);
    return true;
  }

  async exists(id: string): Promise<boolean> {
    const item = await this.findById(id);
    return item !== undefined;
  }

  async count(): Promise<number> {
    const items = await this.getFromStorage();
    return items.length;
  }

  async clear(): Promise<void> {
    await this.saveToStorage([]);
  }
}

export function useRepository<T extends Entity>(
  storageKey: string
): {
  items: T[];
  loading: boolean;
  findById: (id: string) => T | undefined;
  create: (item: T) => void;
  update: (item: T) => void;
  remove: (id: string) => void;
  clear: () => void;
} {
  const [items, setItems] = useKV<T[]>(storageKey, []);

  const findById = useCallback(
    (id: string) => items?.find(item => item.id === id),
    [items]
  );

  const create = useCallback(
    (item: T) => {
      setItems(current => [
        ...(current || []),
        { ...item, createdAt: new Date(), updatedAt: new Date() } as T,
      ]);
    },
    [setItems]
  );

  const update = useCallback(
    (item: T) => {
      setItems(current =>
        (current || []).map(i =>
          i.id === item.id ? { ...item, updatedAt: new Date() } as T : i
        )
      );
    },
    [setItems]
  );

  const remove = useCallback(
    (id: string) => {
      setItems(current => (current || []).filter(item => item.id !== id));
    },
    [setItems]
  );

  const clear = useCallback(() => {
    setItems([]);
  }, [setItems]);

  return {
    items: items || [],
    loading: false,
    findById,
    create,
    update,
    remove,
    clear,
  };
}
