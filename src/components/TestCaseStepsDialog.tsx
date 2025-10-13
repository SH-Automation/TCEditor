import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Plus, 
  Trash, 
  ArrowUp, 
  ArrowDown, 
  Code, 
  Database, 
  DotsSixVertical,
  MagnifyingGlass 
} from '@phosphor-icons/react';
import { CatalogStep, TestStepMembership } from '@/lib/types';

interface TestCaseStepsDialogProps {
  testCaseId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalogSteps: CatalogStep[];
  currentMemberships: TestStepMembership[];
  onSave: (memberships: TestStepMembership[]) => void;
}

export function TestCaseStepsDialog({
  testCaseId,
  open,
  onOpenChange,
  catalogSteps,
  currentMemberships,
  onSave,
}: TestCaseStepsDialogProps) {
  const [memberships, setMemberships] = useState<TestStepMembership[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (open) {
      setMemberships([...currentMemberships]);
      setSearchTerm('');
    }
  }, [open, currentMemberships]);

  const filteredCatalogSteps = catalogSteps.filter(step => 
    step.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    step.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    step.javaClass.toLowerCase().includes(searchTerm.toLowerCase()) ||
    step.javaMethod.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addedStepIds = new Set(memberships.map(m => m.catalogStepId));
  const availableSteps = filteredCatalogSteps.filter(step => !addedStepIds.has(step.id));

  const sortedMemberships = [...memberships].sort((a, b) => a.processOrder - b.processOrder);

  const handleAddStep = (catalogStepId: string) => {
    if (!testCaseId) return;

    const maxOrder = memberships.length > 0 
      ? Math.max(...memberships.map(m => m.processOrder))
      : 0;

    const newMembership: TestStepMembership = {
      id: `membership-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      testCaseId,
      catalogStepId,
      processOrder: maxOrder + 1,
      createdAt: new Date(),
    };

    setMemberships(prev => [...prev, newMembership]);
  };

  const handleRemoveStep = (membershipId: string) => {
    setMemberships(prev => {
      const filtered = prev.filter(m => m.id !== membershipId);
      return reorderMemberships(filtered);
    });
  };

  const handleMoveUp = (membershipId: string) => {
    setMemberships(prev => {
      const sorted = [...prev].sort((a, b) => a.processOrder - b.processOrder);
      const index = sorted.findIndex(m => m.id === membershipId);
      
      if (index <= 0) return prev;
      
      [sorted[index - 1], sorted[index]] = [sorted[index], sorted[index - 1]];
      return reorderMemberships(sorted);
    });
  };

  const handleMoveDown = (membershipId: string) => {
    setMemberships(prev => {
      const sorted = [...prev].sort((a, b) => a.processOrder - b.processOrder);
      const index = sorted.findIndex(m => m.id === membershipId);
      
      if (index >= sorted.length - 1) return prev;
      
      [sorted[index], sorted[index + 1]] = [sorted[index + 1], sorted[index]];
      return reorderMemberships(sorted);
    });
  };

  const reorderMemberships = (memberships: TestStepMembership[]): TestStepMembership[] => {
    return memberships.map((membership, index) => ({
      ...membership,
      processOrder: index + 1,
    }));
  };

  const handleSave = () => {
    onSave(reorderMemberships(memberships));
    onOpenChange(false);
  };

  const getCatalogStep = (catalogStepId: string) => {
    return catalogSteps.find(step => step.id === catalogStepId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Test Steps</DialogTitle>
          <DialogDescription>
            Add steps from the catalog and arrange their execution order for this test case.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-2 gap-6 overflow-hidden">
          {/* Available Steps */}
          <div className="flex flex-col min-h-0">
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Available Steps</h3>
              <div className="relative">
                <MagnifyingGlass size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search steps..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {availableSteps.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'No steps match your search' : 'No available steps'}
                </div>
              ) : (
                availableSteps.map(step => (
                  <Card key={step.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{step.name}</h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddStep(step.id)}
                        >
                          <Plus size={12} />
                        </Button>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Code size={12} className="text-muted-foreground" />
                          <Badge variant="secondary" className="font-mono text-xs">
                            {step.javaClass}.{step.javaMethod}()
                          </Badge>
                        </div>
                        
                        {step.sqlTables.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Database size={12} className="text-muted-foreground" />
                            <div className="flex flex-wrap gap-1">
                              {step.sqlTables.slice(0, 2).map(table => (
                                <Badge key={table} variant="outline" className="text-xs">
                                  {table}
                                </Badge>
                              ))}
                              {step.sqlTables.length > 2 && (
                                <span className="text-xs text-muted-foreground">
                                  +{step.sqlTables.length - 2}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Selected Steps */}
          <div className="flex flex-col min-h-0">
            <div className="mb-4">
              <h3 className="font-semibold">
                Selected Steps ({sortedMemberships.length})
              </h3>
              <p className="text-sm text-muted-foreground">
                Execution order from top to bottom
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {sortedMemberships.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No steps selected
                </div>
              ) : (
                sortedMemberships.map((membership, index) => {
                  const step = getCatalogStep(membership.catalogStepId);
                  if (!step) return null;

                  return (
                    <Card key={membership.id} className="relative">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex items-center gap-2 mt-1">
                            <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                              {membership.processOrder}
                            </span>
                            <DotsSixVertical size={16} className="text-muted-foreground drag-handle" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium">{step.name}</h4>
                            <p className="text-sm text-muted-foreground">{step.description}</p>
                          </div>
                          
                          <div className="flex flex-col gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMoveUp(membership.id)}
                              disabled={index === 0}
                            >
                              <ArrowUp size={12} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMoveDown(membership.id)}
                              disabled={index === sortedMemberships.length - 1}
                            >
                              <ArrowDown size={12} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveStep(membership.id)}
                            >
                              <Trash size={12} />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Steps ({sortedMemberships.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}