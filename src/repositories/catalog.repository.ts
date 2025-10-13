import { CatalogStep, CatalogStepFilters } from '@/models/catalog.model';
import { BaseRepository } from './base.repository';

export class CatalogRepository extends BaseRepository<CatalogStep> {
  constructor() {
    super('catalog-steps');
  }

  async findAll(): Promise<CatalogStep[]> {
    const steps = await this.getFromStorage();
    return steps.sort((a, b) => a.name.localeCompare(b.name));
  }

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
      steps = steps.filter(
        s =>
          s.name.toLowerCase().includes(term) ||
          s.description.toLowerCase().includes(term) ||
          s.javaClass.toLowerCase().includes(term) ||
          s.javaMethod.toLowerCase().includes(term)
      );
    }

    return steps.sort((a, b) => a.name.localeCompare(b.name));
  }

  async findByJavaClass(javaClass: string): Promise<CatalogStep[]> {
    const steps = await this.getFromStorage();
    return steps.filter(s => s.javaClass === javaClass);
  }

  async findBySqlTable(sqlTable: string): Promise<CatalogStep[]> {
    const steps = await this.getFromStorage();
    return steps.filter(s => s.sqlTables.includes(sqlTable));
  }

  async search(searchTerm: string): Promise<CatalogStep[]> {
    return this.findByFilters({ searchTerm });
  }
}

export const catalogRepository = new CatalogRepository();
