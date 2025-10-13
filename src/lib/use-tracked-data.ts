import { useCallback } from 'react';
import { useKV } from '@github/spark/hooks';
import { useHistory } from '@/hooks/use-history';
import { ChangeAction, EntityType } from './history-types';
import { CatalogStep, TestCase, TestStepMembership } from './types';

export function useTrackedCatalogSteps() {
  const [catalogSteps, setCatalogSteps] = useKV<CatalogStep[]>('catalog-steps', []);
  const { addHistoryEntry, historyState, undo, redo } = useHistory();

  const addCatalogStep = useCallback((step: CatalogStep) => {
    setCatalogSteps((current) => {
      const newSteps = [...(current || []), step];
      addHistoryEntry(
        'create',
        'catalog-step',
        step.id,
        `Created catalog step: ${step.name}`,
        null,
        step,
        undefined,
        step.name
      );
      return newSteps;
    });
  }, [setCatalogSteps, addHistoryEntry]);

  const updateCatalogStep = useCallback((stepId: string, updates: Partial<CatalogStep>) => {
    setCatalogSteps((current) => {
      const steps = current || [];
      const oldStep = steps.find(s => s.id === stepId);
      const newSteps = steps.map(s =>
        s.id === stepId ? { ...s, ...updates, updatedAt: new Date() } : s
      );
      
      const updatedStep = newSteps.find(s => s.id === stepId);
      if (oldStep && updatedStep) {
        addHistoryEntry(
          'update',
          'catalog-step',
          stepId,
          `Updated catalog step: ${updatedStep.name}`,
          oldStep,
          updatedStep,
          undefined,
          updatedStep.name
        );
      }
      
      return newSteps;
    });
  }, [setCatalogSteps, addHistoryEntry]);

  const deleteCatalogStep = useCallback((stepId: string) => {
    setCatalogSteps((current) => {
      const steps = current || [];
      const deletedStep = steps.find(s => s.id === stepId);
      const newSteps = steps.filter(s => s.id !== stepId);
      
      if (deletedStep) {
        addHistoryEntry(
          'delete',
          'catalog-step',
          stepId,
          `Deleted catalog step: ${deletedStep.name}`,
          deletedStep,
          null,
          undefined,
          deletedStep.name
        );
      }
      
      return newSteps;
    });
  }, [setCatalogSteps, addHistoryEntry]);

  const applyHistoryChange = useCallback(async (goingBack: boolean) => {
    const entry = goingBack ? await undo() : await redo();
    if (!entry || entry.entityType !== 'catalog-step') return;

    const targetState = goingBack ? entry.previousState : entry.newState;
    
    setCatalogSteps((current) => {
      const steps = current || [];
      
      if (entry.action === 'create') {
        if (goingBack) {
          return steps.filter(s => s.id !== entry.entityId);
        } else {
          return [...steps, targetState];
        }
      } else if (entry.action === 'delete') {
        if (goingBack) {
          return [...steps, targetState];
        } else {
          return steps.filter(s => s.id !== entry.entityId);
        }
      } else if (entry.action === 'update') {
        return steps.map(s => s.id === entry.entityId ? targetState : s);
      }
      
      return steps;
    });
  }, [setCatalogSteps, undo, redo]);

  return {
    catalogSteps,
    setCatalogSteps,
    addCatalogStep,
    updateCatalogStep,
    deleteCatalogStep,
    applyHistoryChange,
  };
}

export function useTrackedTestCases() {
  const [testCases, setTestCases] = useKV<TestCase[]>('test-cases', []);
  const { addHistoryEntry, undo, redo } = useHistory();

  const addTestCase = useCallback((testCase: TestCase) => {
    setTestCases((current) => {
      const newCases = [...(current || []), testCase];
      addHistoryEntry(
        'create',
        'test-case',
        testCase.id,
        `Created test case: ${testCase.name}`,
        null,
        testCase,
        undefined,
        testCase.name
      );
      return newCases;
    });
  }, [setTestCases, addHistoryEntry]);

  const updateTestCase = useCallback((caseId: string, updates: Partial<TestCase>) => {
    setTestCases((current) => {
      const cases = current || [];
      const oldCase = cases.find(c => c.id === caseId);
      const newCases = cases.map(c =>
        c.id === caseId ? { ...c, ...updates, updatedAt: new Date() } : c
      );
      
      const updatedCase = newCases.find(c => c.id === caseId);
      if (oldCase && updatedCase) {
        addHistoryEntry(
          'update',
          'test-case',
          caseId,
          `Updated test case: ${updatedCase.name}`,
          oldCase,
          updatedCase,
          undefined,
          updatedCase.name
        );
      }
      
      return newCases;
    });
  }, [setTestCases, addHistoryEntry]);

  const deleteTestCase = useCallback((caseId: string) => {
    setTestCases((current) => {
      const cases = current || [];
      const deletedCase = cases.find(c => c.id === caseId);
      const newCases = cases.filter(c => c.id !== caseId);
      
      if (deletedCase) {
        addHistoryEntry(
          'delete',
          'test-case',
          caseId,
          `Deleted test case: ${deletedCase.name}`,
          deletedCase,
          null,
          undefined,
          deletedCase.name
        );
      }
      
      return newCases;
    });
  }, [setTestCases, addHistoryEntry]);

  const applyHistoryChange = useCallback(async (goingBack: boolean) => {
    const entry = goingBack ? await undo() : await redo();
    if (!entry || entry.entityType !== 'test-case') return;

    const targetState = goingBack ? entry.previousState : entry.newState;
    
    setTestCases((current) => {
      const cases = current || [];
      
      if (entry.action === 'create') {
        if (goingBack) {
          return cases.filter(c => c.id !== entry.entityId);
        } else {
          return [...cases, targetState];
        }
      } else if (entry.action === 'delete') {
        if (goingBack) {
          return [...cases, targetState];
        } else {
          return cases.filter(c => c.id !== entry.entityId);
        }
      } else if (entry.action === 'update') {
        return cases.map(c => c.id === entry.entityId ? targetState : c);
      }
      
      return cases;
    });
  }, [setTestCases, undo, redo]);

  return {
    testCases,
    setTestCases,
    addTestCase,
    updateTestCase,
    deleteTestCase,
    applyHistoryChange,
  };
}

export function useTrackedMemberships() {
  const [memberships, setMemberships] = useKV<TestStepMembership[]>('test-memberships', []);
  const { addHistoryEntry, undo, redo } = useHistory();

  const addMembership = useCallback((membership: TestStepMembership) => {
    setMemberships((current) => {
      const newMemberships = [...(current || []), membership];
      addHistoryEntry(
        'create',
        'test-membership',
        membership.id,
        `Added step to test case (order: ${membership.processOrder})`,
        null,
        membership
      );
      return newMemberships;
    });
  }, [setMemberships, addHistoryEntry]);

  const updateMembership = useCallback((membershipId: string, updates: Partial<TestStepMembership>) => {
    setMemberships((current) => {
      const items = current || [];
      const oldMembership = items.find(m => m.id === membershipId);
      const newMemberships = items.map(m =>
        m.id === membershipId ? { ...m, ...updates } : m
      );
      
      const updatedMembership = newMemberships.find(m => m.id === membershipId);
      if (oldMembership && updatedMembership) {
        addHistoryEntry(
          'update',
          'test-membership',
          membershipId,
          `Updated step membership (order: ${updatedMembership.processOrder})`,
          oldMembership,
          updatedMembership
        );
      }
      
      return newMemberships;
    });
  }, [setMemberships, addHistoryEntry]);

  const reorderMemberships = useCallback((updates: Array<{ id: string; processOrder: number }>) => {
    setMemberships((current) => {
      const items = current || [];
      const oldState = items.filter(m => updates.some(u => u.id === m.id));
      
      const newMemberships = items.map(m => {
        const update = updates.find(u => u.id === m.id);
        return update ? { ...m, processOrder: update.processOrder } : m;
      });
      
      addHistoryEntry(
        'reorder',
        'test-membership',
        'bulk',
        `Reordered ${updates.length} test steps`,
        oldState,
        newMemberships.filter(m => updates.some(u => u.id === m.id))
      );
      
      return newMemberships;
    });
  }, [setMemberships, addHistoryEntry]);

  const deleteMembership = useCallback((membershipId: string) => {
    setMemberships((current) => {
      const items = current || [];
      const deletedMembership = items.find(m => m.id === membershipId);
      const newMemberships = items.filter(m => m.id !== membershipId);
      
      if (deletedMembership) {
        addHistoryEntry(
          'delete',
          'test-membership',
          membershipId,
          `Removed step from test case`,
          deletedMembership,
          null
        );
      }
      
      return newMemberships;
    });
  }, [setMemberships, addHistoryEntry]);

  const applyHistoryChange = useCallback(async (goingBack: boolean) => {
    const entry = goingBack ? await undo() : await redo();
    if (!entry || entry.entityType !== 'test-membership') return;

    const targetState = goingBack ? entry.previousState : entry.newState;
    
    setMemberships((current) => {
      const items = current || [];
      
      if (entry.action === 'create') {
        if (goingBack) {
          return items.filter(m => m.id !== entry.entityId);
        } else {
          return [...items, targetState];
        }
      } else if (entry.action === 'delete') {
        if (goingBack) {
          return [...items, targetState];
        } else {
          return items.filter(m => m.id !== entry.entityId);
        }
      } else if (entry.action === 'update') {
        return items.map(m => m.id === entry.entityId ? targetState : m);
      } else if (entry.action === 'reorder') {
        const targetItems = Array.isArray(targetState) ? targetState : [targetState];
        return items.map(m => {
          const updated = targetItems.find((t: TestStepMembership) => t.id === m.id);
          return updated || m;
        });
      }
      
      return items;
    });
  }, [setMemberships, undo, redo]);

  return {
    memberships,
    setMemberships,
    addMembership,
    updateMembership,
    reorderMemberships,
    deleteMembership,
    applyHistoryChange,
  };
}
