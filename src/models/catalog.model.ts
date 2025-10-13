import { Entity } from './common.model';

export interface CatalogStep extends Entity {
  name: string;
  description: string;
  javaClass: string;
  javaMethod: string;
  sqlTables: string[];
}

export interface CreateCatalogStepInput {
  name: string;
  description: string;
  javaClass: string;
  javaMethod: string;
  sqlTables: string[];
}

export interface UpdateCatalogStepInput extends Partial<CreateCatalogStepInput> {
  id: string;
}

export interface CatalogStepFilters {
  javaClass?: string;
  sqlTable?: string;
  searchTerm?: string;
}

export interface CatalogStepStats {
  totalSteps: number;
  reusedSteps: number;
  avgReusageCount: number;
  topUsedSteps: Array<{
    step: CatalogStep;
    usageCount: number;
  }>;
}
