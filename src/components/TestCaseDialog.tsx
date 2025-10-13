import { useEffect, useState } from 'react';
import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ValidatedInput } from './ValidatedInput';
import { TestCase } from '@/lib/types';
import { validateTCID, validateTestCaseName, TCIDValidationResult, ValidationResult } from '@/lib/validation';
import { toast } from 'sonner';

interface TestCaseDialogProps {
  testCase: TestCase | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (testCase: TestCase) => void;
}

export function TestCaseDialog({
  testCase,
  open,
  onOpenChange,
  onSave,
}: TestCaseDialogProps) {
  const [allTestCases] = useKV<TestCase[]>("test-cases", []);
  
  const [formData, setFormData] = useState({
    tcid: '',
    name: '',
    description: '',
  });

  const [validations, setValidations] = useState<{
    tcid?: TCIDValidationResult;
    name?: ValidationResult;
  }>({});

  const [touched, setTouched] = useState({
    tcid: false,
    name: false,
  });

  useEffect(() => {
    if (testCase) {
      setFormData({
        tcid: testCase.id,
        name: testCase.name,
        description: testCase.description,
      });
    } else {
      setFormData({
        tcid: '',
        name: '',
        description: '',
      });
    }
    setTouched({ tcid: false, name: false });
    setValidations({});
  }, [testCase, open]);

  const validateField = (field: 'tcid' | 'name', value: string) => {
    if (field === 'tcid') {
      const result = validateTCID(value, allTestCases || [], testCase?.id);
      setValidations(prev => ({ ...prev, tcid: result }));
      return result;
    } else if (field === 'name') {
      const result = validateTestCaseName(value, allTestCases || [], testCase?.id);
      setValidations(prev => ({ ...prev, name: result }));
      return result;
    }
  };

  const handleFieldChange = (field: 'tcid' | 'name' | 'description', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (touched[field as 'tcid' | 'name']) {
      if (field === 'tcid' || field === 'name') {
        validateField(field, value);
      }
    }
  };

  const handleFieldBlur = (field: 'tcid' | 'name') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    setTouched({ tcid: true, name: true });
    const tcidValidation = validateField('tcid', formData.tcid);
    const nameValidation = validateField('name', formData.name);

    if (!tcidValidation?.isValid || !nameValidation?.isValid) {
      toast.error('Please fix validation errors before saving', {
        description: 'Check the form for error messages and suggestions',
      });
      return;
    }
    
    const now = new Date();
    const testCaseData: TestCase = {
      id: formData.tcid.trim(),
      name: formData.name.trim(),
      description: formData.description.trim(),
      createdAt: testCase?.createdAt || now,
      updatedAt: now,
    };

    onSave(testCaseData);
    toast.success(
      testCase ? 'Test case updated successfully' : 'Test case created successfully',
      { description: `TCID: ${testCaseData.id}` }
    );
  };

  const isFormValid = 
    formData.tcid.trim() &&
    formData.name.trim() &&
    (!validations.tcid || validations.tcid.isValid) &&
    (!validations.name || validations.name.isValid);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {testCase ? 'Edit Test Case' : 'Create New Test Case'}
          </DialogTitle>
          <DialogDescription>
            Define a test case with a unique TCID and ordered sequence of test steps.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ValidatedInput
            id="tcid"
            label="Test Case ID (TCID)"
            value={formData.tcid}
            onChange={(value) => handleFieldChange('tcid', value)}
            onBlur={() => handleFieldBlur('tcid')}
            validation={touched.tcid ? validations.tcid : undefined}
            placeholder="e.g., TC-001, PROJECT-TC-001, TC-001-V1"
            required
            disabled={!!testCase}
            description={testCase ? 'TCID cannot be changed after creation' : 'Use format: TC-### or PROJECT-TC-###'}
          />

          <ValidatedInput
            id="name"
            label="Test Case Name"
            value={formData.name}
            onChange={(value) => handleFieldChange('name', value)}
            onBlur={() => handleFieldBlur('name')}
            validation={touched.name ? validations.name : undefined}
            placeholder="e.g., User Registration Flow"
            required
            description="Descriptive name for the test case"
          />

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="Brief description of what this test case validates..."
              rows={4}
            />
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
              {testCase ? 'Update Test Case' : 'Create Test Case'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}