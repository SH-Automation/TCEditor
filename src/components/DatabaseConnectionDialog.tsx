import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DatabaseConnection } from '@/lib/db-types';
import { toast } from 'sonner';

interface DatabaseConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connection?: DatabaseConnection;
  onSave: (connection: DatabaseConnection) => void;
}

export function DatabaseConnectionDialog({
  open,
  onOpenChange,
  connection,
  onSave,
}: DatabaseConnectionDialogProps) {
  const [formData, setFormData] = useState<Partial<DatabaseConnection>>(
    connection || {
      name: '',
      server: 'localhost',
      port: 1433,
      database: 'TestCaseManagement',
      username: '',
      encrypt: true,
      trustServerCertificate: false,
      connectionTimeout: 15000,
      requestTimeout: 30000,
      isActive: false,
    }
  );

  const handleSave = () => {
    if (!formData.name || !formData.server || !formData.database || !formData.username) {
      toast.error('Please fill in all required fields');
      return;
    }

    const connectionConfig: DatabaseConnection = {
      id: connection?.id || crypto.randomUUID(),
      name: formData.name!,
      server: formData.server!,
      port: formData.port || 1433,
      database: formData.database!,
      username: formData.username!,
      encrypt: formData.encrypt ?? true,
      trustServerCertificate: formData.trustServerCertificate ?? false,
      connectionTimeout: formData.connectionTimeout || 15000,
      requestTimeout: formData.requestTimeout || 30000,
      isActive: false,
      createdAt: connection?.createdAt || new Date(),
    };

    onSave(connectionConfig);
    onOpenChange(false);
    toast.success('Database connection configuration saved');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {connection ? 'Edit Database Connection' : 'New Database Connection'}
          </DialogTitle>
          <DialogDescription>
            Configure connection settings for Microsoft SQL Server. Connection strings use the mssql package format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Connection Name *</Label>
            <Input
              id="name"
              placeholder="Production DB"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="server">Server Address *</Label>
              <Input
                id="server"
                placeholder="localhost or IP address"
                value={formData.server}
                onChange={(e) => setFormData({ ...formData, server: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                placeholder="1433"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 1433 })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="database">Database Name *</Label>
            <Input
              id="database"
              placeholder="TestCaseManagement"
              value={formData.database}
              onChange={(e) => setFormData({ ...formData, database: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              placeholder="sa or domain\\user"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-semibold">Security Options</h4>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="encrypt">Encrypt Connection</Label>
                <p className="text-xs text-muted-foreground">
                  Use TLS/SSL encryption for data transmission
                </p>
              </div>
              <Switch
                id="encrypt"
                checked={formData.encrypt}
                onCheckedChange={(checked) => setFormData({ ...formData, encrypt: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="trustCert">Trust Server Certificate</Label>
                <p className="text-xs text-muted-foreground">
                  Skip certificate validation (development only)
                </p>
              </div>
              <Switch
                id="trustCert"
                checked={formData.trustServerCertificate}
                onCheckedChange={(checked) => setFormData({ ...formData, trustServerCertificate: checked })}
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-semibold">Timeout Settings (milliseconds)</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="connectionTimeout">Connection Timeout</Label>
                <Input
                  id="connectionTimeout"
                  type="number"
                  value={formData.connectionTimeout}
                  onChange={(e) => setFormData({ ...formData, connectionTimeout: parseInt(e.target.value) || 15000 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requestTimeout">Request Timeout</Label>
                <Input
                  id="requestTimeout"
                  type="number"
                  value={formData.requestTimeout}
                  onChange={(e) => setFormData({ ...formData, requestTimeout: parseInt(e.target.value) || 30000 })}
                />
              </div>
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h4 className="text-sm font-semibold">Example Connection String</h4>
            <code className="text-xs block font-mono bg-background p-2 rounded">
              {`Server=${formData.server || 'localhost'},${formData.port || 1433};Database=${formData.database || 'TestCaseManagement'};User Id=${formData.username || 'username'};Encrypt=${formData.encrypt};TrustServerCertificate=${formData.trustServerCertificate}`}
            </code>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Connection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
