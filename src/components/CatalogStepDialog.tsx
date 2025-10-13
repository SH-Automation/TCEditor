import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, X } from '@phosphor-icons/react';
import { CatalogStep } from '@/lib/types';

interface CatalogStepDialogProps {
  step: CatalogStep | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (step: CatalogStep) => void;
}

export function CatalogStepDialog({
  step,
  open,
  onOpenChange,
  onSave,
}: CatalogStepDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    javaClass: '',
    javaMethod: '',
    sqlTables: [] as string[],
  });
  const [newTable, setNewTable] = useState('');

  useEffect(() => {
    if (step) {
      setFormData({
        name: step.name,
        description: step.description,
        javaClass: step.javaClass,
        javaMethod: step.javaMethod,
        sqlTables: [...step.sqlTables],
      });
    } else {
      setFormData({
        name: '',
        description: '',
        javaClass: '',
        javaMethod: '',
        sqlTables: [],
      });
    }
    setNewTable('');
  }, [step, open]);

  const handleAddTable = () => {
    if (newTable.trim() && !formData.sqlTables.includes(newTable.trim())) {
      setFormData(prev => ({
        ...prev,
        sqlTables: [...prev.sqlTables, newTable.trim()],
      }));
      setNewTable('');
    }
  };

  const handleRemoveTable = (table: string) => {
    setFormData(prev => ({
      ...prev,
      sqlTables: prev.sqlTables.filter(t => t !== table),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const now = new Date();
    const stepData: CatalogStep = {
      id: step?.id || `step-${Date.now()}`,
      name: formData.name.trim(),
      description: formData.description.trim(),
      javaClass: formData.javaClass.trim(),
      javaMethod: formData.javaMethod.trim(),
      sqlTables: formData.sqlTables,
      createdAt: step?.createdAt || now,
      updatedAt: now,
    };

    onSave(stepData);
  };

  const isValid = formData.name.trim() && 
                  formData.javaClass.trim() && 
                  formData.javaMethod.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step ? 'Edit Test Step' : 'Create New Test Step'}
          </DialogTitle>
          <DialogDescription>
            Define a reusable test step with Java class/method references and SQL table associations.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Step Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Validate User Login"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of what this step does..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="javaClass">Java Class</Label>
              <Input
                id="javaClass"
                value={formData.javaClass}
                onChange={(e) => setFormData(prev => ({ ...prev, javaClass: e.target.value }))}
                placeholder="com.example.TestUtils"
                className="font-mono text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="javaMethod">Method Name</Label>
              <Input
                id="javaMethod"
                value={formData.javaMethod}
                onChange={(e) => setFormData(prev => ({ ...prev, javaMethod: e.target.value }))}
                placeholder="validateLogin"
                className="font-mono text-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>SQL Tables</Label>
            <div className="flex gap-2">
              <Input
                value={newTable}
                onChange={(e) => setNewTable(e.target.value)}
                placeholder="table_name"
                className="font-mono text-sm"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTable())}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTable}
                disabled={!newTable.trim()}
              >
                <Plus size={14} />
              </Button>
            </div>
            
            {formData.sqlTables.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.sqlTables.map(table => (
                  <Badge key={table} variant="secondary" className="gap-1">
                    <span className="font-mono text-xs">{table}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTable(table)}
                      className="hover:bg-destructive/20 rounded-sm p-0.5"
                    >
                      <X size={10} />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid}>
              {step ? 'Update Step' : 'Create Step'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}