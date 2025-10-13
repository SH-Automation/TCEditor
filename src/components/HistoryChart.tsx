import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useHistory } from '@/hooks/use-history';
import { format, parseISO, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { ChangeAction } from '@/lib/history-types';

const ACTION_COLORS: Record<ChangeAction, string> = {
  'create': '#10b981',
  'update': '#3b82f6',
  'delete': '#ef4444',
  'reorder': '#a855f7',
  'bulk-update': '#f97316',
  'bulk-delete': '#dc2626',
};

export function HistoryChart() {
  const { historyState } = useHistory();

  const chartData = useMemo(() => {
    if (!historyState?.entries || historyState.entries.length === 0) return [];

    const groupedByDate = historyState.entries.reduce((acc, entry) => {
      const date = format(new Date(entry.timestamp), 'MMM dd');
      
      if (!acc[date]) {
        acc[date] = {
          date,
          create: 0,
          update: 0,
          delete: 0,
          reorder: 0,
          'bulk-update': 0,
          'bulk-delete': 0,
        };
      }
      
      acc[date][entry.action]++;
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(groupedByDate).slice(-7);
  }, [historyState]);

  const actionCounts = useMemo(() => {
    if (!historyState?.entries || historyState.entries.length === 0) return [];

    const counts = historyState.entries.reduce((acc, entry) => {
      acc[entry.action] = (acc[entry.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([action, count]) => ({
      action,
      count,
      color: ACTION_COLORS[action as ChangeAction] || '#6b7280',
    }));
  }, [historyState]);

  const entityCounts = useMemo(() => {
    if (!historyState?.entries || historyState.entries.length === 0) return [];

    const counts = historyState.entries.reduce((acc, entry) => {
      acc[entry.entityType] = (acc[entry.entityType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([type, count]) => ({
      type,
      count,
    }));
  }, [historyState]);

  if (!historyState?.entries || historyState.entries.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Changes Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
              <Legend />
              <Bar dataKey="create" stackId="a" fill={ACTION_COLORS.create} name="Create" />
              <Bar dataKey="update" stackId="a" fill={ACTION_COLORS.update} name="Update" />
              <Bar dataKey="delete" stackId="a" fill={ACTION_COLORS.delete} name="Delete" />
              <Bar dataKey="reorder" stackId="a" fill={ACTION_COLORS.reorder} name="Reorder" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Changes by Action Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {actionCounts.map(({ action, count, color }) => (
              <div key={action} className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-sm flex-shrink-0" 
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{action.replace('-', ' ')}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full"
                        style={{ 
                          width: `${((count / (historyState?.entries.length || 1)) * 100)}%`,
                          backgroundColor: color 
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t">
            <div className="text-sm font-medium mb-3">Changes by Entity Type</div>
            <div className="space-y-2">
              {entityCounts.map(({ type, count }) => (
                <div key={type} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground capitalize">{type.replace('-', ' ')}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
