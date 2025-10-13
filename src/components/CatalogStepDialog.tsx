import { useEffect, useState } from 'react';
import { useKV } from '@github/spark/hooks';
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
import { ValidatedInput } from './ValidatedInput';
import { CatalogStep } from '@/lib/types';
import { 
  validateCatalogStepName, 
  validateJavaClassName, 
  validateJavaMethodName,
  validateSQLTableName,
  ValidationResult 
} from '@/lib/validation';
import { toast } from 'sonner';

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
  const [allSteps] = useKV<CatalogStep[]>("catalog-steps", []);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    javaClass: '',
    javaMethod: '',
    sqlTables: [] as string[],
  });
  
  const [newTable, setNewTable] = useState('');
  
  const [validations, setValidations] = useState<{
    name?: ValidationResult;
    javaClass?: ValidationResult;
    javaMethod?: ValidationResult;
    newTable?: ValidationResult;
  }>({});

  const [touched, setTouched] = useState({
    name: false,
    javaClass: false,
    javaMethod: false,
  });

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
    setTouched({ name: false, javaClass: false, javaMethod: false });
    setValidations({});
  }, [step, open]);

  const validateField = (field: 'name' | 'javaClass' | 'javaMethod' | 'newTable', value: string) => {
    let result: ValidationResult;
    
    if (field === 'name') {
      result = validateCatalogStepName(value, allSteps || [], step?.id);
      setValidations(prev => ({ ...prev, name: result }));
    } else if (field === 'javaClass') {
      result = validateJavaClassName(value);
      setValidations(prev => ({ ...prev, javaClass: result }));
    } else if (field === 'javaMethod') {
      result = validateJavaMethodName(value);
      setValidations(prev => ({ ...prev, javaMethod: result }));
    } else if (field === 'newTable') {
      result = validateSQLTableName(value);
      setValidations(prev => ({ ...prev, newTable: result }));
    } else {
      return;
    }
    
    return result;
  };

  const handleFieldChange = (field: 'name' | 'javaClass' | 'javaMethod' | 'description', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (touched[field as 'name' | 'javaClass' | 'javaMethod']) {
      if (field !== 'description') {
        validateField(field, value);
      }
    }
  };

  const handleFieldBlur = (field: 'name' | 'javaClass' | 'javaMethod') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const handleNewTableChange = (value: string) => {
    setNewTable(value);
    if (value.trim()) {
      validateField('newTable', value);
    } else {
      setValidations(prev => ({ ...prev, newTable: undefined }));
    }
  };

  const handleAddTable = () => {
    const validation = validateField('newTable', newTable);
    
    if (!validation?.isValid) {
      return;
    }
    
    const trimmedTable = newTable.trim();
    if (trimmedTable && !formData.sqlTables.includes(trimmedTable)) {
      setFormData(prev => ({
        ...prev,
        sqlTables: [...prev.sqlTables, trimmedTable],
      }));
      setNewTable('');
      setValidations(prev => ({ ...prev, newTable: undefined }));
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
    
    setTouched({ name: true, javaClass: true, javaMethod: true });
    const nameValidation = validateField('name', formData.name);
    const javaClassValidation = validateField('javaClass', formData.javaClass);
    const javaMethodValidation = validateField('javaMethod', formData.javaMethod);

    if (!nameValidation?.isValid || !javaClassValidation?.isValid || !javaMethodValidation?.isValid) {
      toast.error('Please fix validation errors before saving', {
        description: 'Check the form for error messages and suggestions',
      });
      return;
    }
    
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
    toast.success(
      step ? 'Test step updated successfully' : 'Test step created successfully',
      { description: stepData.name }
    );
  };

  const isFormValid = 
    formData.name.trim() && 
    formData.javaClass.trim() && 
    formData.javaMethod.trim() &&
    (!validations.name || validations.name.isValid) &&
    (!validations.javaClass || validations.javaClass.isValid) &&
    (!validations.javaMethod || validations.javaMethod.isValid);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step ? 'Edit Test Step' : 'Create New Test Step'}
          </DialogTitle>
          <DialogDescription>
            Define a reusable test step with Java class/method references and SQL table associations.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ValidatedInput
            id="name"
            label="Step Name"
            value={formData.name}
            onChange={(value) => handleFieldChange('name', value)}
            onBlur={() => handleFieldBlur('name')}
            validation={touched.name ? validations.name : undefined}
            placeholder="e.g., Validate User Login"
            required
            description="Unique name for this test step"
          />

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="Brief description of what this step does..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ValidatedInput
              id="javaClass"
              label="Java Class"
              value={formData.javaClass}
              onChange={(value) => handleFieldChange('javaClass', value)}
              onBlur={() => handleFieldBlur('javaClass')}
              validation={touched.javaClass ? validations.javaClass : undefined}
              placeholder="com.example.TestUtils"
              className="font-mono text-sm"
              required
              description="Fully qualified class name"
            />

            <ValidatedInput
              id="javaMethod"
              label="Method Name"
              value={formData.javaMethod}
              onChange={(value) => handleFieldChange('javaMethod', value)}
              onBlur={() => handleFieldBlur('javaMethod')}
              validation={touched.javaMethod ? validations.javaMethod : undefined}
              placeholder="validateLogin"
              className="font-mono text-sm"
              required
              description="camelCase method name"
            />
          </div>

          <div className="space-y-2">
            <Label>SQL Tables</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  value={newTable}
                  onChange={(e) => handleNewTableChange(e.target.value)}
                  placeholder="table_name or schema.table_name"
                  className="font-mono text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTable())}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTable}
                disabled={!newTable.trim() || (validations.newTable && !validations.newTable.isValid)}
              >
                <Plus size={14} />
              </Button>
            </div>
            
            {validations.newTable && !validations.newTable.isValid && (
              <p className="text-sm text-destructive">{validations.newTable.error}</p>
            )}
            
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
            <Button type="submit" disabled={!isFormValid}>
              {step ? 'Update Step' : 'Create Step'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}