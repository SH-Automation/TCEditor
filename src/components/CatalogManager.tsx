import { useState } from 'react';
import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, PencilSimple, Trash, Code, Database } from '@phosphor-icons/react';
import { CatalogStep } from '@/lib/types';
import { CatalogStepDialog } from './CatalogStepDialog';

export function CatalogManager() {
  const [catalogSteps, setCatalogSteps] = useKV<CatalogStep[]>("catalog-steps", []);
  const [selectedStep, setSelectedStep] = useState<CatalogStep | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreateStep = () => {
    setSelectedStep(null);
    setIsDialogOpen(true);
  };

  const handleEditStep = (step: CatalogStep) => {
    setSelectedStep(step);
    setIsDialogOpen(true);
  };

  const handleDeleteStep = (stepId: string) => {
    setCatalogSteps(current => (current || []).filter(step => step.id !== stepId));
  };

  const handleSaveStep = (step: CatalogStep) => {
    setCatalogSteps(current => {
      const currentSteps = current || [];
      const existing = currentSteps.find(s => s.id === step.id);
      if (existing) {
        return currentSteps.map(s => s.id === step.id ? step : s);
      } else {
        return [...currentSteps, step];
      }
    });
    setIsDialogOpen(false);
  };

  if (!catalogSteps || catalogSteps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center max-w-md">
          <Code size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No Test Steps Yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first reusable test step to start building test cases. Steps include Java class/method references and SQL table associations.
          </p>
          <Button onClick={handleCreateStep} className="gap-2">
            <Plus size={16} />
            Create First Step
          </Button>
        </div>
        
        <CatalogStepDialog
          step={selectedStep}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSave={handleSaveStep}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Test Step Catalog</h2>
          <p className="text-muted-foreground">
            Manage reusable test steps with Java class references and SQL table associations
          </p>
        </div>
        <Button onClick={handleCreateStep} className="gap-2">
          <Plus size={16} />
          New Step
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {catalogSteps.map(step => (
          <Card key={step.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{step.name}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditStep(step)}
                  >
                    <PencilSimple size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteStep(step.id)}
                  >
                    <Trash size={14} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{step.description}</p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Code size={14} className="text-muted-foreground" />
                  <Badge variant="secondary" className="font-mono text-xs">
                    {step.javaClass}.{step.javaMethod}()
                  </Badge>
                </div>
                
                {step.sqlTables.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Database size={14} className="text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">SQL Tables:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {step.sqlTables.map(table => (
                        <Badge key={table} variant="outline" className="text-xs">
                          {table}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <CatalogStepDialog
        step={selectedStep}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveStep}
      />
    </div>
  );
}