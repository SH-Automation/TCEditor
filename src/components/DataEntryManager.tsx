import { useState } from 'react';
import { useKV } from '@github/spark/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, Database, Flask, Info } from '@phosphor-icons/react';
import { CatalogStep, TestCase } from '@/lib/types';
import { DataEntryGrid } from './DataEntryGrid';
import { dbService } from '@/lib/db-service';

export function DataEntryManager() {
  const [catalogSteps] = useKV<CatalogStep[]>('catalog-steps', []);
  const [testCases] = useKV<TestCase[]>('test-cases', []);
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>('');
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string>('');
  const [selectedTableName, setSelectedTableName] = useState<string>('');

  const isConnected = dbService.isConnected();
  const selectedCatalog = catalogSteps?.find(c => c.id === selectedCatalogId);

  const handleCatalogChange = (catalogId: string) => {
    setSelectedCatalogId(catalogId);
    const catalog = catalogSteps?.find(c => c.id === catalogId);
    if (catalog && catalog.sqlTables.length > 0) {
      setSelectedTableName(catalog.sqlTables[0]);
    } else {
      setSelectedTableName('');
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Database size={48} className="text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Database Connection</h3>
          <p className="text-muted-foreground text-center mb-4">
            Connect to a SQL Server database to use dynamic data entry
          </p>
          <Button onClick={() => window.location.hash = '#database'}>
            Go to Database Settings
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!catalogSteps || catalogSteps.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Flask size={48} className="text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Catalog Steps</h3>
          <p className="text-muted-foreground text-center mb-4">
            Create catalog steps with SQL table associations to enable data entry
          </p>
          <Button onClick={() => window.location.hash = '#catalog'}>
            Go to Catalog
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Dynamic Data Entry</h2>
        <p className="text-muted-foreground">
          Manage table data based on catalog step associations with automatic schema introspection
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Catalog Step</CardTitle>
          <CardDescription>
            Choose a catalog step to view and edit data from its associated SQL tables
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Catalog Step</label>
              <Select value={selectedCatalogId} onValueChange={handleCatalogChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a catalog step..." />
                </SelectTrigger>
                <SelectContent>
                  {catalogSteps.map(step => (
                    <SelectItem key={step.id} value={step.id}>
                      <div className="flex items-center gap-2">
                        <span>{step.name}</span>
                        {step.sqlTables.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {step.sqlTables.length} table{step.sqlTables.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCatalog && selectedCatalog.sqlTables.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">SQL Table</label>
                <Select value={selectedTableName} onValueChange={setSelectedTableName}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a table..." />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCatalog.sqlTables.map(table => (
                      <SelectItem key={table} value={table}>
                        <div className="flex items-center gap-2">
                          <Table size={14} />
                          {table}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {selectedCatalog && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">Catalog Step Details</h4>
              <div className="grid gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Description:</span>
                  <p className="mt-1">{selectedCatalog.description}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Java Reference:</span>
                  <Badge variant="outline" className="font-mono text-xs ml-2">
                    {selectedCatalog.javaClass}.{selectedCatalog.javaMethod}()
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Associated Tables:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedCatalog.sqlTables.map(table => (
                      <Badge key={table} variant="secondary" className="text-xs">
                        {table}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedTableName && (
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Records</TabsTrigger>
            {testCases && testCases.length > 0 && (
              <TabsTrigger value="filtered">Filter by Test Case</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <DataEntryGrid tableName={selectedTableName} />
          </TabsContent>

          <TabsContent value="filtered" className="mt-6">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">Filter Options</CardTitle>
                <CardDescription>
                  View and edit data specific to a test case or catalog step
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Test Case</label>
                  <Select value={selectedTestCaseId} onValueChange={setSelectedTestCaseId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a test case..." />
                    </SelectTrigger>
                    <SelectContent>
                      {testCases?.map(tc => (
                        <SelectItem key={tc.id} value={tc.id}>
                          {tc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {selectedTestCaseId ? (
              <DataEntryGrid
                tableName={selectedTableName}
                filter={{ testCaseId: selectedTestCaseId }}
              />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Info size={48} className="text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Select a test case to view filtered data
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {!selectedCatalogId && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Database size={48} className="text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a Catalog Step</h3>
            <p className="text-muted-foreground text-center">
              Choose a catalog step above to begin managing table data
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
