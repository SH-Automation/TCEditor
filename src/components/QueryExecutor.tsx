import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { dbService, CatalogStepQueries, TestCaseQueries, MembershipQueries } from '@/lib/db-service';
import { Play, Clock, CheckCircle, XCircle, Code } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function QueryExecutor() {
  const [customQuery, setCustomQuery] = useState('');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  const executeCustomQuery = async () => {
    if (!dbService.isConnected()) {
      toast.error('No active database connection');
      return;
    }

    if (!customQuery.trim()) {
      toast.error('Please enter a query');
      return;
    }

    setIsExecuting(true);
    setQueryResult(null);

    try {
      const result = await dbService.executeQuery({
        query: customQuery,
        parameters: {},
      });

      setExecutionTime(result.executionTime);

      if (result.success) {
        setQueryResult(result);
        toast.success(`Query executed successfully in ${result.executionTime.toFixed(2)}ms`);
      } else {
        setQueryResult(result);
        toast.error('Query execution failed');
      }
    } catch (error) {
      toast.error('Unexpected error during query execution');
    } finally {
      setIsExecuting(false);
    }
  };

  const loadSampleQuery = (query: string) => {
    setCustomQuery(query);
  };

  const sampleQueries = [
    {
      name: 'Get All Catalog Steps',
      query: CatalogStepQueries.getAll().query,
    },
    {
      name: 'Get All Test Cases',
      query: TestCaseQueries.getAll().query,
    },
    {
      name: 'Get Test Case With Steps',
      query: TestCaseQueries.getWithSteps('[TEST_CASE_ID]').query,
    },
    {
      name: 'Get Memberships by Test Case',
      query: MembershipQueries.getByTestCase('[TEST_CASE_ID]').query,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Query Executor</h2>
        <p className="text-muted-foreground">
          Execute SQL queries with parameterized statements for safe database operations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SQL Query Editor</CardTitle>
          <CardDescription>
            Write and execute queries using prepared statements with parameter binding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Query</label>
              <Badge variant="secondary">
                <Code size={12} className="mr-1" />
                Prepared Statement
              </Badge>
            </div>
            <Textarea
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="SELECT * FROM CatalogSteps WHERE Name = @name"
              className="font-mono text-sm min-h-[200px]"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {sampleQueries.map((sample) => (
                <Button
                  key={sample.name}
                  variant="outline"
                  size="sm"
                  onClick={() => loadSampleQuery(sample.query)}
                >
                  {sample.name}
                </Button>
              ))}
            </div>
            <Button onClick={executeCustomQuery} disabled={isExecuting || !dbService.isConnected()}>
              <Play size={16} weight="fill" />
              {isExecuting ? 'Executing...' : 'Execute'}
            </Button>
          </div>

          {!dbService.isConnected() && (
            <div className="bg-muted p-4 rounded-lg flex items-center gap-3">
              <XCircle size={20} className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No active database connection. Please connect to a database in the Database tab.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {queryResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Query Results</CardTitle>
              <div className="flex items-center gap-4">
                {executionTime !== null && (
                  <Badge variant="outline" className="gap-1">
                    <Clock size={12} />
                    {executionTime.toFixed(2)}ms
                  </Badge>
                )}
                {queryResult.success ? (
                  <Badge variant="default" className="gap-1 bg-green-600">
                    <CheckCircle size={12} weight="fill" />
                    Success
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle size={12} weight="fill" />
                    Error
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] w-full">
              <pre className="text-xs font-mono bg-muted p-4 rounded-lg">
                {JSON.stringify(queryResult, null, 2)}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Prepared Statement Examples</CardTitle>
          <CardDescription>
            SQL injection prevention through parameterized queries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="insert">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="insert">INSERT</TabsTrigger>
              <TabsTrigger value="update">UPDATE</TabsTrigger>
              <TabsTrigger value="select">SELECT</TabsTrigger>
              <TabsTrigger value="delete">DELETE</TabsTrigger>
            </TabsList>

            <TabsContent value="insert" className="space-y-2">
              <h4 className="text-sm font-semibold">Insert Catalog Step</h4>
              <pre className="text-xs font-mono bg-muted p-4 rounded-lg overflow-x-auto">
{`INSERT INTO CatalogSteps 
  (Id, Name, Description, JavaClass, JavaMethod, SqlTables, CreatedAt, UpdatedAt)
VALUES 
  (@id, @name, @description, @javaClass, @javaMethod, @sqlTables, GETUTCDATE(), GETUTCDATE())

Parameters:
  @id: UNIQUEIDENTIFIER
  @name: NVARCHAR(255)
  @description: NVARCHAR(MAX)
  @javaClass: NVARCHAR(500)
  @javaMethod: NVARCHAR(255)
  @sqlTables: NVARCHAR(MAX) (JSON array)`}
              </pre>
            </TabsContent>

            <TabsContent value="update" className="space-y-2">
              <h4 className="text-sm font-semibold">Update Test Case</h4>
              <pre className="text-xs font-mono bg-muted p-4 rounded-lg overflow-x-auto">
{`UPDATE TestCases
SET Name = @name,
    Description = @description,
    UpdatedAt = GETUTCDATE()
WHERE Id = @id

Parameters:
  @id: UNIQUEIDENTIFIER
  @name: NVARCHAR(255)
  @description: NVARCHAR(MAX)`}
              </pre>
            </TabsContent>

            <TabsContent value="select" className="space-y-2">
              <h4 className="text-sm font-semibold">Select with Join</h4>
              <pre className="text-xs font-mono bg-muted p-4 rounded-lg overflow-x-auto">
{`SELECT 
  tc.Name AS TestCaseName,
  cs.Name AS StepName,
  m.ProcessOrder
FROM TestCases tc
INNER JOIN TestStepMemberships m ON tc.Id = m.TestCaseId
INNER JOIN CatalogSteps cs ON m.CatalogStepId = cs.Id
WHERE tc.Id = @testCaseId
ORDER BY m.ProcessOrder ASC

Parameters:
  @testCaseId: UNIQUEIDENTIFIER`}
              </pre>
            </TabsContent>

            <TabsContent value="delete" className="space-y-2">
              <h4 className="text-sm font-semibold">Delete with Cascade</h4>
              <pre className="text-xs font-mono bg-muted p-4 rounded-lg overflow-x-auto">
{`DELETE FROM TestCases WHERE Id = @id

-- Foreign key constraints automatically cascade delete to TestStepMemberships
-- due to ON DELETE CASCADE constraint definition

Parameters:
  @id: UNIQUEIDENTIFIER`}
              </pre>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
