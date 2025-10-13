import { useState, useRef } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Upload, ArrowRight, Check, Warning } from '@phosphor-icons/react';
import { CatalogStep, TestCase, TestStepMembership } from '@/lib/types';
import { importExportService } from '@/lib/import-export-service';
import { ImportPreview, ColumnMapping, TABLE_FIELD_DEFINITIONS } from '@/lib/import-export-types';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetTable: 'catalog-steps' | 'test-cases' | 'test-memberships';
}

export function ImportDialog({ open, onOpenChange, targetTable }: ImportDialogProps) {
  const [catalogSteps, setCatalogSteps] = useKV<CatalogStep[]>("catalog-steps", []);
  const [testCases, setTestCases] = useKV<TestCase[]>("test-cases", []);
  const [memberships, setMemberships] = useKV<TestStepMembership[]>("test-memberships", []);
  
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fieldDefinitions = TABLE_FIELD_DEFINITIONS[targetTable];

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    try {
      setSelectedFile(file);
      const previewData = await importExportService.parseCSV(file);
      setPreview(previewData);
      
      const autoMappings: ColumnMapping[] = previewData.headers.map(header => {
        const matchingField = fieldDefinitions.find(
          f => f.field.toLowerCase() === header.toLowerCase() || 
               f.label.toLowerCase() === header.toLowerCase()
        );
        
        return {
          sourceColumn: header,
          targetField: matchingField?.field || '',
          targetTable: targetTable,
        };
      });
      
      setMappings(autoMappings);
      toast.success(`Loaded ${previewData.totalRows} rows from CSV`);
    } catch (error) {
      toast.error('Failed to parse CSV file');
      console.error(error);
    }
  };

  const handleMappingChange = (sourceColumn: string, targetField: string) => {
    setMappings(prev => 
      prev.map(m => 
        m.sourceColumn === sourceColumn 
          ? { ...m, targetField }
          : m
      )
    );
  };

  const validateMappings = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const mappedFields = new Set<string>();
    
    const requiredFields = fieldDefinitions.filter(f => f.required).map(f => f.field);
    
    for (const mapping of mappings) {
      if (mapping.targetField) {
        if (mappedFields.has(mapping.targetField)) {
          errors.push(`Field "${mapping.targetField}" is mapped more than once`);
        }
        mappedFields.add(mapping.targetField);
      }
    }
    
    for (const required of requiredFields) {
      if (!mappedFields.has(required)) {
        const fieldDef = fieldDefinitions.find(f => f.field === required);
        errors.push(`Required field "${fieldDef?.label || required}" is not mapped`);
      }
    }
    
    return { valid: errors.length === 0, errors };
  };

  const handleImport = async () => {
    if (!selectedFile || !preview) return;

    const validation = validateMappings();
    if (!validation.valid) {
      toast.error('Invalid mappings', {
        description: validation.errors[0],
      });
      return;
    }

    setImporting(true);
    try {
      const result = await importExportService.importData(
        selectedFile,
        mappings.filter(m => m.targetField !== ''),
        {
          catalogSteps: catalogSteps || [],
          testCases: testCases || [],
          memberships: memberships || [],
        }
      );

      if (result.success) {
        switch (targetTable) {
          case 'catalog-steps':
            setCatalogSteps((current: CatalogStep[]) => [...current]);
            break;
          case 'test-cases':
            setTestCases((current: TestCase[]) => [...current]);
            break;
          case 'test-memberships':
            setMemberships((current: TestStepMembership[]) => [...current]);
            break;
        }

        toast.success(`Imported ${result.imported} records successfully`);
        handleClose();
      } else {
        toast.error(`Import failed: ${result.failed} records`, {
          description: result.errors[0],
        });
      }
    } catch (error) {
      toast.error('Import failed');
      console.error(error);
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setPreview(null);
    setMappings([]);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onOpenChange(false);
  };

  const validation = preview ? validateMappings() : { valid: false, errors: [] };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Import {targetTable.replace('-', ' ')}</DialogTitle>
          <DialogDescription>
            Upload a CSV file and map columns to database fields
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!preview ? (
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload size={48} className="mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Upload CSV File</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select a CSV file to import data
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <Button asChild>
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload size={16} className="mr-2" />
                  Select CSV File
                </label>
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{preview.totalRows} rows</Badge>
                  <span className="text-sm font-medium">{selectedFile?.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPreview(null);
                    setMappings([]);
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  Change File
                </Button>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Column Mapping (1:1 Required)</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Map each CSV column to exactly one database field. Required fields are marked with *.
                </p>
                
                <ScrollArea className="h-[300px] border rounded-lg p-4">
                  <div className="space-y-4">
                    {preview.headers.map((header, index) => {
                      const mapping = mappings.find(m => m.sourceColumn === header);
                      const targetField = fieldDefinitions.find(f => f.field === mapping?.targetField);
                      
                      return (
                        <div key={index} className="flex items-center gap-4">
                          <div className="flex-1">
                            <Label className="text-sm font-medium">{header}</Label>
                            <p className="text-xs text-muted-foreground">
                              Sample: {preview.sampleData[0]?.[header] || 'N/A'}
                            </p>
                          </div>
                          
                          <ArrowRight size={20} className="text-muted-foreground" />
                          
                          <div className="flex-1">
                            <Select
                              value={mapping?.targetField || ''}
                              onValueChange={(value) => handleMappingChange(header, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select field..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">
                                  <span className="text-muted-foreground">Skip column</span>
                                </SelectItem>
                                {fieldDefinitions.map(field => (
                                  <SelectItem key={field.field} value={field.field}>
                                    <div className="flex items-center gap-2">
                                      {field.label}
                                      {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {targetField && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {targetField.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>

              {validation.errors.length > 0 && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <Warning size={20} className="text-destructive mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-destructive">Validation Errors</p>
                    <ul className="text-sm text-destructive/90 mt-1 space-y-1">
                      {validation.errors.map((error, i) => (
                        <li key={i}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {validation.valid && (
                <div className="flex items-center gap-2 p-3 bg-accent/10 border border-accent/20 rounded-lg">
                  <Check size={20} className="text-accent" />
                  <p className="text-sm font-medium">All required fields are mapped</p>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={importing}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!preview || !validation.valid || importing}
          >
            {importing ? 'Importing...' : `Import ${preview?.totalRows || 0} Records`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
