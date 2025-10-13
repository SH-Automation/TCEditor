import { useState } from 'react';
import { useKV } from '@github/spark/hooks';
import { Toaster } from '@/components/ui/sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CatalogManager } from '@/components/CatalogManager';
import { TestCaseManager } from '@/components/TestCaseManager';
import { DatabaseManager } from '@/components/DatabaseManager';
import { QueryExecutor } from '@/components/QueryExecutor';
import { DatabaseStatusIndicator } from '@/components/DatabaseStatusIndicator';
import { DataEntryManager } from '@/components/DataEntryManager';
import { HistoryButton } from '@/components/HistoryButton';
import { HistoryTimeline } from '@/components/HistoryTimeline';
import { HistoryChart } from '@/components/HistoryChart';
import { HistoryDemo } from '@/components/HistoryDemo';
import { HistoryIndicator } from '@/components/HistoryIndicator';
import { ValidationShowcase } from '@/components/ValidationShowcase';
import { Flask, TestTube, Database, Code, Table, ClockCounterClockwise, ArrowsLeftRight } from '@phosphor-icons/react';
import { CatalogStep, TestCase, TestStepMembership } from '@/lib/types';
import { ImportExportManager } from '@/components/ImportExportManager';

function App() {
  const [activeTab, setActiveTab] = useState('database');

  return (
    <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Flask size={32} className="text-primary" />
                <div>
                  <h1 className="text-3xl font-bold">Test Case Management System</h1>
                  <p className="text-muted-foreground">
                    Manage software test cases with reusable catalog steps and execution ordering
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <HistoryIndicator />
                <DatabaseStatusIndicator />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-8 max-w-6xl">
              <TabsTrigger value="database" className="gap-2">
                <Database size={16} />
                <span className="hidden sm:inline">Database</span>
              </TabsTrigger>
              <TabsTrigger value="catalog" className="gap-2">
                <Flask size={16} />
                <span className="hidden sm:inline">Catalog</span>
              </TabsTrigger>
              <TabsTrigger value="testcases" className="gap-2">
                <TestTube size={16} />
                <span className="hidden sm:inline">Test Cases</span>
              </TabsTrigger>
              <TabsTrigger value="dataentry" className="gap-2">
                <Table size={16} />
                <span className="hidden sm:inline">Data Entry</span>
              </TabsTrigger>
              <TabsTrigger value="import-export" className="gap-2">
                <ArrowsLeftRight size={16} />
                <span className="hidden sm:inline">Import/Export</span>
              </TabsTrigger>
              <TabsTrigger value="query" className="gap-2">
                <Code size={16} />
                <span className="hidden sm:inline">Query</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <ClockCounterClockwise size={16} />
                <span className="hidden sm:inline">History</span>
              </TabsTrigger>
              <TabsTrigger value="overview" className="gap-2">
                <Database size={16} />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="database" className="space-y-6">
                <DatabaseManager />
              </TabsContent>

              <TabsContent value="catalog" className="space-y-6">
                <CatalogManager />
              </TabsContent>

              <TabsContent value="testcases" className="space-y-6">
                <TestCaseManager />
              </TabsContent>

              <TabsContent value="dataentry" className="space-y-6">
                <DataEntryManager />
              </TabsContent>

              <TabsContent value="import-export" className="space-y-6">
                <ImportExportManager />
              </TabsContent>

              <TabsContent value="query" className="space-y-6">
                <QueryExecutor />
              </TabsContent>

              <TabsContent value="history" className="space-y-6">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold mb-2">Change History & Analytics</h2>
                    <p className="text-muted-foreground">
                      Track all changes with undo/redo capabilities and visual analytics
                    </p>
                  </div>
                  
                  <HistoryChart />
                  
                  <HistoryTimeline />
                </div>
              </TabsContent>

              <TabsContent value="overview" className="space-y-6">
                <OverviewPanel />
              </TabsContent>
            </div>
          </Tabs>
        </main>
        
        <HistoryButton />
        <Toaster />
      </div>
  );
}

function OverviewPanel() {
  const [catalogSteps] = useKV<CatalogStep[]>("catalog-steps", []);
  const [testCases] = useKV<TestCase[]>("test-cases", []);
  const [memberships] = useKV<TestStepMembership[]>("test-memberships", []);

  const avgSteps = testCases && testCases.length > 0 
    ? ((memberships?.length || 0) / testCases.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">System Overview</h2>
        <p className="text-muted-foreground">
          Comprehensive view of your test management system
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Catalog Steps"
          value={catalogSteps?.length || 0}
          icon={<Database size={20} />}
          description="Reusable test components"
        />
        <StatsCard
          title="Active Test Cases"
          value={testCases?.length || 0}
          icon={<TestTube size={20} />}
          description="Configured test scenarios"
        />
        <StatsCard
          title="Step Memberships"
          value={memberships?.length || 0}
          icon={<Flask size={20} />}
          description="Step-to-case relationships"
        />
        <StatsCard
          title="Avg Steps per Case"
          value={avgSteps}
          icon={<TestTube size={20} />}
          description="Average complexity"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ValidationShowcase />
        
        <div className="space-y-6">
          <HistoryDemo />
          
          <Card>
            <CardHeader>
              <CardTitle>Quick Start Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">1. Build Your Catalog</h4>
                  <p className="text-sm text-muted-foreground">
                    Create reusable test steps with Java class/method references and SQL table associations.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">2. Create Test Cases</h4>
                  <p className="text-sm text-muted-foreground">
                    Define test scenarios and select steps from your catalog to build comprehensive test flows.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">3. Order Execution Steps</h4>
                  <p className="text-sm text-muted-foreground">
                    Arrange steps in the correct sequence with explicit ProcessOrder values for reliable test execution.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">4. Execute & Validate</h4>
                  <p className="text-sm text-muted-foreground">
                    Use the structured test cases with Java class references and data requirements for systematic testing.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ 
  title, 
  value, 
  icon, 
  description 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  description: string; 
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export default App;