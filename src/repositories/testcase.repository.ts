import { TestCase, TestCaseWithSteps, TestStepMembership } from '@/models/testcase.model';
import { CatalogStep } from '@/models/catalog.model';
import { BaseRepository } from './base.repository';

export class TestCaseRepository extends BaseRepository<TestCase> {
  constructor() {
    super('test-cases');
  }

  async findAll(): Promise<TestCase[]> {
    const testCases = await this.getFromStorage();
    return testCases.sort((a, b) => a.name.localeCompare(b.name));
  }

  async findWithSteps(id: string): Promise<TestCaseWithSteps | undefined> {
    const testCase = await this.findById(id);
    if (!testCase) return undefined;

    const memberships = await window.spark.kv.get<TestStepMembership[]>('test-memberships') || [];
    const catalogSteps = await window.spark.kv.get<CatalogStep[]>('catalog-steps') || [];

    const caseMemberships = memberships
      .filter(m => m.testCaseId === id)
      .sort((a, b) => a.processOrder - b.processOrder);

    const steps = caseMemberships.map(membership => {
      const catalogStep = catalogSteps.find(s => s.id === membership.catalogStepId);
      return {
        membership,
        catalogStep: catalogStep!,
      };
    }).filter(s => s.catalogStep);

    return {
      testCase,
      steps,
    };
  }

  async search(searchTerm: string): Promise<TestCase[]> {
    const testCases = await this.getFromStorage();
    const term = searchTerm.toLowerCase();
    
    return testCases.filter(
      tc =>
        tc.id.toLowerCase().includes(term) ||
        tc.name.toLowerCase().includes(term) ||
        tc.description.toLowerCase().includes(term)
    ).sort((a, b) => a.name.localeCompare(b.name));
  }
}

export class MembershipRepository {
  private readonly storageKey = 'test-memberships';

  private async getFromStorage(): Promise<TestStepMembership[]> {
    const data = await window.spark.kv.get<TestStepMembership[]>(this.storageKey);
    return data || [];
  }

  private async saveToStorage(data: TestStepMembership[]): Promise<void> {
    await window.spark.kv.set(this.storageKey, data);
  }

  async findAll(): Promise<TestStepMembership[]> {
    return this.getFromStorage();
  }

  async findByTestCase(testCaseId: string): Promise<TestStepMembership[]> {
    const memberships = await this.getFromStorage();
    return memberships
      .filter(m => m.testCaseId === testCaseId)
      .sort((a, b) => a.processOrder - b.processOrder);
  }

  async findByCatalogStep(catalogStepId: string): Promise<TestStepMembership[]> {
    const memberships = await this.getFromStorage();
    return memberships.filter(m => m.catalogStepId === catalogStepId);
  }

  async create(membership: Omit<TestStepMembership, 'createdAt'>): Promise<TestStepMembership> {
    const memberships = await this.getFromStorage();
    const newMembership = {
      ...membership,
      createdAt: new Date(),
    };
    memberships.push(newMembership);
    await this.saveToStorage(memberships);
    return newMembership;
  }

  async update(membership: TestStepMembership): Promise<TestStepMembership> {
    const memberships = await this.getFromStorage();
    const index = memberships.findIndex(m => m.id === membership.id);
    
    if (index === -1) {
      throw new Error(`Membership with id ${membership.id} not found`);
    }

    memberships[index] = membership;
    await this.saveToStorage(memberships);
    return membership;
  }

  async bulkUpdateOrders(updates: Array<{ id: string; processOrder: number }>): Promise<void> {
    const memberships = await this.getFromStorage();
    const updateMap = new Map(updates.map(u => [u.id, u.processOrder]));

    const updatedMemberships = memberships.map(m => {
      const newOrder = updateMap.get(m.id);
      return newOrder !== undefined ? { ...m, processOrder: newOrder } : m;
    });

    await this.saveToStorage(updatedMemberships);
  }

  async delete(id: string): Promise<boolean> {
    const memberships = await this.getFromStorage();
    const filteredMemberships = memberships.filter(m => m.id !== id);
    
    if (filteredMemberships.length === memberships.length) {
      return false;
    }

    await this.saveToStorage(filteredMemberships);
    return true;
  }

  async deleteByTestCase(testCaseId: string): Promise<number> {
    const memberships = await this.getFromStorage();
    const filteredMemberships = memberships.filter(m => m.testCaseId !== testCaseId);
    const deletedCount = memberships.length - filteredMemberships.length;
    
    if (deletedCount > 0) {
      await this.saveToStorage(filteredMemberships);
    }
    
    return deletedCount;
  }

  async deleteByCatalogStep(catalogStepId: string): Promise<number> {
    const memberships = await this.getFromStorage();
    const filteredMemberships = memberships.filter(m => m.catalogStepId !== catalogStepId);
    const deletedCount = memberships.length - filteredMemberships.length;
    
    if (deletedCount > 0) {
      await this.saveToStorage(filteredMemberships);
    }
    
    return deletedCount;
  }
}

export const testCaseRepository = new TestCaseRepository();
export const membershipRepository = new MembershipRepository();
