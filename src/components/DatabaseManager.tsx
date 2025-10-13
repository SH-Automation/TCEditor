import { useState } from 'react';
import { useKV } from '@github/spark/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DatabaseConnectionDialog } from './DatabaseConnectionDialog';
import { DatabaseConnection } from '@/lib/db-types';
import { dbService } from '@/lib/db-service';
import { SQL_SERVER_SCHEMA, generateCreateTablesScript } from '@/lib/db-schema';
import { Database, Plus, Power, Trash, Code, CheckCircle, XCircle, Copy } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export function DatabaseManager() {
  const [connections, setConnections] = useKV<DatabaseConnection[]>('db-connections', []);
  const [activeConnectionId, setActiveConnectionId] = useKV<string | null>('active-connection-id', null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<DatabaseConnection | undefined>();
  const [schemaDialogOpen, setSchemaDialogOpen] = useState(false);

  const activeConnection = connections?.find(c => c.id === activeConnectionId);

  const handleSaveConnection = (connection: DatabaseConnection) => {
    setConnections((current) => {
      const existing = current?.find(c => c.id === connection.id);
      if (existing) {
        return current!.map(c => c.id === connection.id ? connection : c);
      }
      return [...(current || []), connection];
    });
    setEditingConnection(undefined);
  };

  const handleDeleteConnection = (id: string) => {
    setConnections((current) => current?.filter(c => c.id !== id) || []);
    if (activeConnectionId === id) {
      setActiveConnectionId(null);
      dbService.setActiveConnection(null);
    }
    toast.success('Connection removed');
  };

  const handleActivateConnection = (connection: DatabaseConnection) => {
    const updatedConnection = { ...connection, isActive: true, lastConnected: new Date() };
    
    setConnections((current) =>
      current?.map(c => ({
        ...c,
        isActive: c.id === connection.id,
      })) || []
    );
    
    setActiveConnectionId(connection.id);
    dbService.setActiveConnection(updatedConnection);
    toast.success(`Connected to ${connection.name}`);
  };

  const handleDisconnect = () => {
    if (activeConnectionId) {
      setConnections((current) =>
        current?.map(c => c.id === activeConnectionId ? { ...c, isActive: false } : c) || []
      );
      setActiveConnectionId(null);
      dbService.setActiveConnection(null);
      toast.info('Disconnected from database');
    }
  };

  const handleEditConnection = (connection: DatabaseConnection) => {
    setEditingConnection(connection);
    setDialogOpen(true);
  };

  const handleCopySchema = () => {
    const schema = generateCreateTablesScript();
    navigator.clipboard.writeText(schema);
    toast.success('SQL schema copied to clipboard');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Database Connections</h2>
          <p className="text-muted-foreground">
            Manage SQL Server connections and view schema information
          </p>
        </div>
        <Button onClick={() => { setEditingConnection(undefined); setDialogOpen(true); }}>
          <Plus size={16} />
          New Connection
        </Button>
      </div>

      {activeConnection && (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CheckCircle size={24} className="text-primary" weight="fill" />
                </div>
                <div>
                  <CardTitle className="text-lg">Active Connection</CardTitle>
                  <CardDescription>{activeConnection.name}</CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleDisconnect}>
                <Power size={16} />
                Disconnect
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Server:</span>
                <span className="ml-2 font-medium">{activeConnection.server}:{activeConnection.port}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Database:</span>
                <span className="ml-2 font-medium">{activeConnection.database}</span>
              </div>
              <div>
                <span className="text-muted-foreground">User:</span>
                <span className="ml-2 font-medium">{activeConnection.username}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Encryption:</span>
                <span className="ml-2">
                  <Badge variant={activeConnection.encrypt ? "default" : "secondary"}>
                    {activeConnection.encrypt ? 'Enabled' : 'Disabled'}
                  </Badge>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {connections && connections.length > 0 ? (
          connections.map((connection) => (
            <Card key={connection.id} className={connection.isActive ? 'opacity-50' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database size={24} className="text-primary" />
                    <div>
                      <CardTitle className="text-lg">{connection.name}</CardTitle>
                      <CardDescription>
                        {connection.server}:{connection.port} / {connection.database}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!connection.isActive && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleActivateConnection(connection)}
                        >
                          <Power size={16} />
                          Connect
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditConnection(connection)}
                        >
                          Edit
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteConnection(connection.id)}
                      disabled={connection.isActive}
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Database size={48} className="text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Database Connections</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first database connection to start managing test cases
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus size={16} />
                Create Connection
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Database Schema</CardTitle>
              <CardDescription>
                SQL Server table definitions for the test case management system
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopySchema}>
                <Copy size={16} />
                Copy SQL
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSchemaDialogOpen(true)}>
                <Code size={16} />
                View Schema
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(SQL_SERVER_SCHEMA).map(([tableName, schema]) => (
              <div key={tableName} className="border rounded-lg p-4 space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Database size={16} className="text-primary" />
                  {tableName}
                </h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  {schema.columns.slice(0, 5).map((col) => (
                    <div key={col.name} className="flex items-center gap-2">
                      {col.isPrimaryKey && <Badge variant="secondary" className="text-xs">PK</Badge>}
                      {col.isForeignKey && <Badge variant="outline" className="text-xs">FK</Badge>}
                      <span className="font-mono text-xs">{col.name}</span>
                    </div>
                  ))}
                  {schema.columns.length > 5 && (
                    <p className="text-xs italic">+{schema.columns.length - 5} more columns</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <DatabaseConnectionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        connection={editingConnection}
        onSave={handleSaveConnection}
      />

      <Dialog open={schemaDialogOpen} onOpenChange={setSchemaDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>SQL Server Schema</DialogTitle>
            <DialogDescription>
              Complete table definitions with indexes and foreign key constraints
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[600px] w-full pr-4">
            <pre className="text-xs font-mono bg-muted p-4 rounded-lg overflow-x-auto">
              {generateCreateTablesScript()}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
