import { useKV } from '@github/spark/hooks';
import { Badge } from '@/components/ui/badge';
import { DatabaseConnection } from '@/lib/db-types';
import { Database, CheckCircle, XCircle } from '@phosphor-icons/react';

export function DatabaseStatusIndicator() {
  const [connections] = useKV<DatabaseConnection[]>('db-connections', []);
  const [activeConnectionId] = useKV<string | null>('active-connection-id', null);

  const activeConnection = connections?.find(c => c.id === activeConnectionId);

  if (!activeConnection) {
    return (
      <Badge variant="outline" className="gap-2 text-muted-foreground">
        <XCircle size={14} />
        No Database
      </Badge>
    );
  }

  return (
    <Badge variant="default" className="gap-2 bg-green-600 hover:bg-green-700">
      <CheckCircle size={14} weight="fill" />
      {activeConnection.name}
    </Badge>
  );
}
