import { useState } from 'react';
import { useKV } from '@github/spark/hooks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CatalogManager } from '@/components/CatalogManager';
import { TestCaseManager } from '@/components/TestCaseManager';
import { Flask, TestTube, Database } from '@phosphor-icons/react';
import { CatalogStep, TestCase, TestStepMembership } from '@/lib/types';

function App() {
  const [activeTab, setActiveTab] = useState('catalog');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Flask size={32} className="text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Test Case Management System</h1>
              <p className="text-muted-foreground">
                Manage software test cases with reusable catalog steps and execution ordering
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="catalog" className="gap-2">
              <Database size={16} />
              <span className="hidden sm:inline">Catalog</span>
            </TabsTrigger>
            <TabsTrigger value="testcases" className="gap-2">
              <TestTube size={16} />
              <span className="hidden sm:inline">Test Cases</span>
            </TabsTrigger>
            <TabsTrigger value="overview" className="gap-2">
              <Flask size={16} />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="catalog" className="space-y-6">
              <CatalogManager />
            </TabsContent>

            <TabsContent value="testcases" className="space-y-6">
              <TestCaseManager />
            </TabsContent>

            <TabsContent value="overview" className="space-y-6">
              <OverviewPanel />
            </TabsContent>
          </div>
        </Tabs>
      </main>
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

      <Card>
        <CardHeader>
          <CardTitle>Quick Start Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
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