export interface CatalogStep {
  id: string;
  name: string;
  description: string;
  javaClass: string;
  javaMethod: string;
  sqlTables: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TestCase {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestStepMembership {
  id: string;
  testCaseId: string;
  catalogStepId: string;
  processOrder: number;
  createdAt: Date;
}

export interface TestCaseWithSteps {
  testCase: TestCase;
  steps: Array<{
    membership: TestStepMembership;
    catalogStep: CatalogStep;
  }>;
}