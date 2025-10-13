import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { TestCase } from '@/lib/types';

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
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (testCase) {
      setFormData({
        name: testCase.name,
        description: testCase.description,
      });
    } else {
      setFormData({
        name: '',
        description: '',
      });
    }
  }, [testCase, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const now = new Date();
    const testCaseData: TestCase = {
      id: testCase?.id || `testcase-${Date.now()}`,
      name: formData.name.trim(),
      description: formData.description.trim(),
      createdAt: testCase?.createdAt || now,
      updatedAt: now,
    };

    onSave(testCaseData);
  };

  const isValid = formData.name.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {testCase ? 'Edit Test Case' : 'Create New Test Case'}
          </DialogTitle>
          <DialogDescription>
            Define a test case that will contain an ordered sequence of test steps.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Test Case Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., User Registration Flow"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
            <Button type="submit" disabled={!isValid}>
              {testCase ? 'Update Test Case' : 'Create Test Case'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}