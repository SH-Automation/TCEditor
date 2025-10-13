import { useState } from 'react';
import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, PencilSimple, Trash, TestTube, ArrowRight } from '@phosphor-icons/react';
import { TestCase, TestStepMembership, CatalogStep, TestCaseWithSteps } from '@/lib/types';
import { TestCaseDialog } from './TestCaseDialog';
import { TestCaseStepsDialog } from './TestCaseStepsDialog';

export function TestCaseManager() {
  const [testCases, setTestCases] = useKV<TestCase[]>("test-cases", []);
  const [memberships, setMemberships] = useKV<TestStepMembership[]>("test-memberships", []);
  const [catalogSteps] = useKV<CatalogStep[]>("catalog-steps", []);
  
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [isTestCaseDialogOpen, setIsTestCaseDialogOpen] = useState(false);
  const [isStepsDialogOpen, setIsStepsDialogOpen] = useState(false);
  const [editingTestCaseId, setEditingTestCaseId] = useState<string | null>(null);

  const getTestCaseWithSteps = (testCaseId: string): TestCaseWithSteps | null => {
    const testCase = testCases?.find(tc => tc.id === testCaseId);
    if (!testCase) return null;

    const testCaseMemberships = (memberships || [])
      .filter(m => m.testCaseId === testCaseId)
      .sort((a, b) => a.processOrder - b.processOrder);

    const steps = testCaseMemberships.map(membership => {
      const catalogStep = catalogSteps?.find(cs => cs.id === membership.catalogStepId);
      return {
        membership,
        catalogStep: catalogStep!,
      };
    }).filter(step => step.catalogStep);

    return { testCase, steps };
  };

  const handleCreateTestCase = () => {
    setSelectedTestCase(null);
    setIsTestCaseDialogOpen(true);
  };

  const handleEditTestCase = (testCase: TestCase) => {
    setSelectedTestCase(testCase);
    setIsTestCaseDialogOpen(true);
  };

  const handleDeleteTestCase = (testCaseId: string) => {
    setTestCases(current => (current || []).filter(tc => tc.id !== testCaseId));
    setMemberships(current => (current || []).filter(m => m.testCaseId !== testCaseId));
  };

  const handleSaveTestCase = (testCase: TestCase) => {
    setTestCases(current => {
      const currentCases = current || [];
      const existing = currentCases.find(tc => tc.id === testCase.id);
      if (existing) {
        return currentCases.map(tc => tc.id === testCase.id ? testCase : tc);
      } else {
        return [...currentCases, testCase];
      }
    });
    setIsTestCaseDialogOpen(false);
  };

  const handleManageSteps = (testCaseId: string) => {
    setEditingTestCaseId(testCaseId);
    setIsStepsDialogOpen(true);
  };

  const handleUpdateMemberships = (newMemberships: TestStepMembership[]) => {
    setMemberships(current => {
      const currentMemberships = current || [];
      const otherMemberships = currentMemberships.filter(m => m.testCaseId !== editingTestCaseId);
      return [...otherMemberships, ...newMemberships];
    });
  };

  if (!testCases || testCases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center max-w-md">
          <TestTube size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No Test Cases Yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first test case and add ordered steps from the catalog to build comprehensive test scenarios.
          </p>
          <Button onClick={handleCreateTestCase} className="gap-2">
            <Plus size={16} />
            Create First Test Case
          </Button>
        </div>
        
        <TestCaseDialog
          testCase={selectedTestCase}
          open={isTestCaseDialogOpen}
          onOpenChange={setIsTestCaseDialogOpen}
          onSave={handleSaveTestCase}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Test Cases</h2>
          <p className="text-muted-foreground">
            Manage test cases with ordered sequences of catalog steps
          </p>
        </div>
        <Button onClick={handleCreateTestCase} className="gap-2">
          <Plus size={16} />
          New Test Case
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {testCases.map(testCase => {
          const testCaseWithSteps = getTestCaseWithSteps(testCase.id);
          const stepCount = testCaseWithSteps?.steps.length || 0;

          return (
            <Card key={testCase.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{testCase.name}</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditTestCase(testCase)}
                    >
                      <PencilSimple size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTestCase(testCase.id)}
                    >
                      <Trash size={14} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{testCase.description}</p>
                
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="gap-1">
                    <TestTube size={12} />
                    {stepCount} {stepCount === 1 ? 'Step' : 'Steps'}
                  </Badge>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManageSteps(testCase.id)}
                    className="gap-2"
                  >
                    <span>Manage Steps</span>
                    <ArrowRight size={12} />
                  </Button>
                </div>

                {stepCount > 0 && testCaseWithSteps && (
                  <div className="pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Execution Order:</p>
                    <div className="space-y-1">
                      {testCaseWithSteps.steps.slice(0, 3).map((step, index) => (
                        <div key={step.membership.id} className="flex items-center gap-2 text-xs">
                          <span className="w-4 h-4 bg-muted rounded-full flex items-center justify-center text-xs font-medium">
                            {step.membership.processOrder}
                          </span>
                          <span className="truncate">{step.catalogStep.name}</span>
                        </div>
                      ))}
                      {stepCount > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{stepCount - 3} more steps...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <TestCaseDialog
        testCase={selectedTestCase}
        open={isTestCaseDialogOpen}
        onOpenChange={setIsTestCaseDialogOpen}
        onSave={handleSaveTestCase}
      />

      <TestCaseStepsDialog
        testCaseId={editingTestCaseId}
        open={isStepsDialogOpen}
        onOpenChange={setIsStepsDialogOpen}
        catalogSteps={catalogSteps || []}
        currentMemberships={(memberships || []).filter(m => m.testCaseId === editingTestCaseId)}
        onSave={handleUpdateMemberships}
      />
    </div>
  );
}