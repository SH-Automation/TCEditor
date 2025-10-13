import { useState } from 'react';
import { useKV } from '@github/spark/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Upload, 
  Download, 
  FileArrowDown, 
  FileArrowUp,
  FileText 
} from '@phosphor-icons/react';
import { CatalogStep, TestCase, TestStepMembership } from '@/lib/types';
import { importExportService } from '@/lib/import-export-service';
import { ImportDialog } from './ImportDialog';
import { ExportDialog } from './ExportDialog';

export function ImportExportManager() {
  const [catalogSteps] = useKV<CatalogStep[]>("catalog-steps", []);
  const [testCases] = useKV<TestCase[]>("test-cases", []);
  const [memberships] = useKV<TestStepMembership[]>("test-memberships", []);
  
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<'catalog-steps' | 'test-cases' | 'test-memberships'>('catalog-steps');

  const handleTemplateDownload = (table: 'catalog-steps' | 'test-cases' | 'test-memberships') => {
    try {
      importExportService.generateTemplate(table);
      toast.success(`Template downloaded for ${table}`);
    } catch (error) {
      toast.error('Failed to generate template');
    }
  };

  const handleQuickExport = (table: 'catalog-steps' | 'test-cases' | 'test-memberships') => {
    try {
      let data: any[] = [];
      let filename = '';

      switch (table) {
        case 'catalog-steps':
          data = (catalogSteps || []).map(step => ({
            id: step.id,
            name: step.name,
            description: step.description,
            javaClass: step.javaClass,
            javaMethod: step.javaMethod,
            sqlTables: step.sqlTables.join(', '),
          }));
          filename = 'catalog-steps.csv';
          break;
        case 'test-cases':
          data = (testCases || []).map(tc => ({
            id: tc.id,
            name: tc.name,
            description: tc.description,
          }));
          filename = 'test-cases.csv';
          break;
        case 'test-memberships':
          data = (memberships || []).map(m => ({
            id: m.id,
            testCaseId: m.testCaseId,
            catalogStepId: m.catalogStepId,
            processOrder: m.processOrder,
          }));
          filename = 'test-memberships.csv';
          break;
      }

      if (data.length === 0) {
        toast.warning(`No data to export for ${table}`);
        return;
      }

      importExportService.exportToCSV(data, filename);
      toast.success(`Exported ${data.length} records`);
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const openImportDialog = (table: 'catalog-steps' | 'test-cases' | 'test-memberships') => {
    setSelectedTable(table);
    setImportDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Import & Export Data</h2>
        <p className="text-muted-foreground">
          Bulk import or export test data using CSV files with column mapping
        </p>
      </div>

      <Tabs defaultValue="import" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="import" className="gap-2">
            <FileArrowUp size={16} />
            Import
          </TabsTrigger>
          <TabsTrigger value="export" className="gap-2">
            <FileArrowDown size={16} />
            Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload size={20} />
                  Catalog Steps
                </CardTitle>
                <CardDescription>
                  Import reusable test steps
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => openImportDialog('catalog-steps')}
                  className="w-full"
                >
                  <Upload size={16} className="mr-2" />
                  Import CSV
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleTemplateDownload('catalog-steps')}
                  className="w-full"
                >
                  <FileText size={16} className="mr-2" />
                  Download Template
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload size={20} />
                  Test Cases
                </CardTitle>
                <CardDescription>
                  Import test case definitions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => openImportDialog('test-cases')}
                  className="w-full"
                >
                  <Upload size={16} className="mr-2" />
                  Import CSV
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleTemplateDownload('test-cases')}
                  className="w-full"
                >
                  <FileText size={16} className="mr-2" />
                  Download Template
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload size={20} />
                  Step Memberships
                </CardTitle>
                <CardDescription>
                  Import step-to-case relationships
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => openImportDialog('test-memberships')}
                  className="w-full"
                >
                  <Upload size={16} className="mr-2" />
                  Import CSV
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleTemplateDownload('test-memberships')}
                  className="w-full"
                >
                  <FileText size={16} className="mr-2" />
                  Download Template
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle>Import Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Download a CSV template for the data type you want to import</li>
                <li>Fill in your data following the template structure</li>
                <li>Click "Import CSV" and select your file</li>
                <li>Map your CSV columns to database fields (1:1 mapping required)</li>
                <li>Review the preview and confirm the import</li>
              </ol>
              <div className="mt-4 p-3 bg-background rounded-md border">
                <p className="text-sm font-medium mb-1">Tips:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Ensure all required fields are mapped</li>
                  <li>• IDs must be unique across all records</li>
                  <li>• For SQL tables, use comma-separated values</li>
                  <li>• Test with a small file first</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download size={20} />
                  Catalog Steps
                </CardTitle>
                <CardDescription>
                  {catalogSteps?.length || 0} records available
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => handleQuickExport('catalog-steps')}
                  className="w-full"
                  disabled={(catalogSteps?.length || 0) === 0}
                >
                  <Download size={16} className="mr-2" />
                  Export to CSV
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download size={20} />
                  Test Cases
                </CardTitle>
                <CardDescription>
                  {testCases?.length || 0} records available
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => handleQuickExport('test-cases')}
                  className="w-full"
                  disabled={(testCases?.length || 0) === 0}
                >
                  <Download size={16} className="mr-2" />
                  Export to CSV
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download size={20} />
                  Step Memberships
                </CardTitle>
                <CardDescription>
                  {memberships?.length || 0} records available
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => handleQuickExport('test-memberships')}
                  className="w-full"
                  disabled={(memberships?.length || 0) === 0}
                >
                  <Download size={16} className="mr-2" />
                  Export to CSV
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Advanced Export</CardTitle>
              <CardDescription>
                Export multiple tables or use custom formats
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setExportDialogOpen(true)}
                variant="outline"
                className="w-full max-w-md"
              >
                <Download size={16} className="mr-2" />
                Advanced Export Options
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        targetTable={selectedTable}
      />

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
      />
    </div>
  );
}
