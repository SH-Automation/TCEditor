import { Entity } from './common.model';
import { CatalogStep } from './catalog.model';

export interface TestCase extends Entity {
  name: string;
  description: string;
}

export interface CreateTestCaseInput {
  id: string;
  name: string;
  description: string;
}

export interface UpdateTestCaseInput extends Partial<Omit<CreateTestCaseInput, 'id'>> {
  id: string;
}

export interface TestCaseWithSteps {
  testCase: TestCase;
  steps: TestCaseStepDetail[];
}

export interface TestCaseStepDetail {
  membership: TestStepMembership;
  catalogStep: CatalogStep;
}

export interface TestCaseStats {
  totalTestCases: number;
  avgStepsPerCase: number;
  totalStepAssignments: number;
  mostComplexCase?: {
    testCase: TestCase;
    stepCount: number;
  };
}

export interface TestStepMembership {
  id: string;
  testCaseId: string;
  catalogStepId: string;
  processOrder: number;
  createdAt: Date;
}

export interface CreateMembershipInput {
  testCaseId: string;
  catalogStepId: string;
  processOrder: number;
}

export interface UpdateMembershipInput {
  id: string;
  processOrder: number;
}

export interface BulkUpdateMembershipInput {
  id: string;
  processOrder: number;
}
