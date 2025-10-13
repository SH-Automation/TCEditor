import { useState } from 'react';
import { useKV } from '@github/spark/hooks';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Download, FileText } from '@phosphor-icons/react';
import { CatalogStep, TestCase, TestStepMembership } from '@/lib/types';
import { importExportService } from '@/lib/import-export-service';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const [catalogSteps] = useKV<CatalogStep[]>("catalog-steps", []);
  const [testCases] = useKV<TestCase[]>("test-cases", []);
  const [memberships] = useKV<TestStepMembership[]>("test-memberships", []);
  
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set(['catalog-steps']));
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [exporting, setExporting] = useState(false);

  const handleTableToggle = (table: string) => {
    setSelectedTables(prev => {
      const newSet = new Set(prev);
      if (newSet.has(table)) {
        newSet.delete(table);
      } else {
        newSet.add(table);
      }
      return newSet;
    });
  };

  const getTableData = (table: string) => {
    switch (table) {
      case 'catalog-steps':
        return (catalogSteps || []).map(step => ({
          id: step.id,
          name: step.name,
          description: step.description,
          javaClass: step.javaClass,
          javaMethod: step.javaMethod,
          sqlTables: step.sqlTables.join(', '),
        }));
      case 'test-cases':
        return (testCases || []).map(tc => ({
          id: tc.id,
          name: tc.name,
          description: tc.description,
        }));
      case 'test-memberships':
        return (memberships || []).map(m => ({
          id: m.id,
          testCaseId: m.testCaseId,
          catalogStepId: m.catalogStepId,
          processOrder: m.processOrder,
        }));
      default:
        return [];
    }
  };

  const getTableCount = (table: string): number => {
    switch (table) {
      case 'catalog-steps':
        return catalogSteps?.length || 0;
      case 'test-cases':
        return testCases?.length || 0;
      case 'test-memberships':
        return memberships?.length || 0;
      default:
        return 0;
    }
  };

  const handleExport = async () => {
    if (selectedTables.size === 0) {
      toast.error('Please select at least one table to export');
      return;
    }

    setExporting(true);
    try {
      const tables = Array.from(selectedTables);
      
      if (tables.length === 1) {
        const table = tables[0];
        const data = getTableData(table);
        
        if (data.length === 0) {
          toast.warning(`No data to export for ${table}`);
          setExporting(false);
          return;
        }
        
        const filename = `${table}.${format}`;
        
        if (format === 'csv') {
          importExportService.exportToCSV(data, filename);
        } else {
          importExportService.exportToJSON(data, filename);
        }
        
        toast.success(`Exported ${data.length} records from ${table}`);
      } else {
        const exportData: Record<string, any[]> = {};
        let totalRecords = 0;
        
        for (const table of tables) {
          const data = getTableData(table);
          if (data.length > 0) {
            exportData[table] = data;
            totalRecords += data.length;
          }
        }
        
        if (totalRecords === 0) {
          toast.warning('No data to export');
          setExporting(false);
          return;
        }
        
        if (format === 'csv') {
          for (const [table, data] of Object.entries(exportData)) {
            importExportService.exportToCSV(data, `${table}.csv`);
          }
          toast.success(`Exported ${totalRecords} records from ${tables.length} tables`);
        } else {
          importExportService.exportToJSON(exportData, 'test-data-export.json');
          toast.success(`Exported ${totalRecords} records from ${tables.length} tables`);
        }
      }
      
      onOpenChange(false);
    } catch (error) {
      toast.error('Export failed');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const totalRecords = Array.from(selectedTables).reduce(
    (sum, table) => sum + getTableCount(table),
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Advanced Export Options</DialogTitle>
          <DialogDescription>
            Select tables and format for your export
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label className="text-base font-semibold mb-3 block">Select Tables</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <Checkbox
                  id="catalog-steps"
                  checked={selectedTables.has('catalog-steps')}
                  onCheckedChange={() => handleTableToggle('catalog-steps')}
                />
                <div className="flex-1">
                  <Label htmlFor="catalog-steps" className="cursor-pointer font-medium">
                    Catalog Steps
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Reusable test step definitions
                  </p>
                </div>
                <Badge variant="secondary">
                  {getTableCount('catalog-steps')} records
                </Badge>
              </div>

              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <Checkbox
                  id="test-cases"
                  checked={selectedTables.has('test-cases')}
                  onCheckedChange={() => handleTableToggle('test-cases')}
                />
                <div className="flex-1">
                  <Label htmlFor="test-cases" className="cursor-pointer font-medium">
                    Test Cases
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Test case definitions and metadata
                  </p>
                </div>
                <Badge variant="secondary">
                  {getTableCount('test-cases')} records
                </Badge>
              </div>

              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <Checkbox
                  id="test-memberships"
                  checked={selectedTables.has('test-memberships')}
                  onCheckedChange={() => handleTableToggle('test-memberships')}
                />
                <div className="flex-1">
                  <Label htmlFor="test-memberships" className="cursor-pointer font-medium">
                    Step Memberships
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Relationships between steps and test cases
                  </p>
                </div>
                <Badge variant="secondary">
                  {getTableCount('test-memberships')} records
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">Export Format</Label>
            <RadioGroup value={format} onValueChange={(value) => setFormat(value as 'csv' | 'json')}>
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="csv" id="format-csv" />
                <div className="flex-1">
                  <Label htmlFor="format-csv" className="cursor-pointer font-medium">
                    CSV (Comma-Separated Values)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Best for spreadsheet applications and data analysis
                  </p>
                </div>
                <FileText size={24} className="text-muted-foreground" />
              </div>

              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="json" id="format-json" />
                <div className="flex-1">
                  <Label htmlFor="format-json" className="cursor-pointer font-medium">
                    JSON (JavaScript Object Notation)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Best for programmatic access and data interchange
                  </p>
                </div>
                <FileText size={24} className="text-muted-foreground" />
              </div>
            </RadioGroup>
          </div>

          {selectedTables.size > 0 && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <span className="font-medium">Export Summary:</span> {totalRecords} total records from{' '}
                {selectedTables.size} {selectedTables.size === 1 ? 'table' : 'tables'}
              </p>
              {selectedTables.size > 1 && format === 'csv' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Multiple CSV files will be downloaded, one for each table
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={exporting}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={selectedTables.size === 0 || totalRecords === 0 || exporting}
          >
            <Download size={16} className="mr-2" />
            {exporting ? 'Exporting...' : 'Export Data'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
