import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useHistory } from '@/hooks/use-history';
import { ArrowClockwise, ArrowCounterClockwise, Sparkle } from '@phosphor-icons/react';

export function HistoryDemo() {
  const { historyState, canUndo, canRedo, undo, redo } = useHistory();

  if (!historyState) return null;

  const { entries, currentIndex } = historyState;
  const recentEntries = entries.slice(-5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkle size={20} className="text-accent" />
          History System Demo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            size="sm"
            onClick={undo}
            disabled={!canUndo}
            className="flex items-center gap-2"
          >
            <ArrowCounterClockwise size={16} />
            Undo {canUndo && `(${currentIndex + 1} available)`}
          </Button>
          <Button
            size="sm"
            onClick={redo}
            disabled={!canRedo}
            className="flex items-center gap-2"
          >
            <ArrowClockwise size={16} />
            Redo {canRedo && `(${entries.length - currentIndex - 1} available)`}
          </Button>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">History Stats</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-muted rounded p-3">
              <div className="text-2xl font-bold">{entries.length}</div>
              <div className="text-xs text-muted-foreground">Total Changes</div>
            </div>
            <div className="bg-muted rounded p-3">
              <div className="text-2xl font-bold">{currentIndex + 1}</div>
              <div className="text-xs text-muted-foreground">Current Position</div>
            </div>
          </div>
        </div>

        {recentEntries.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Recent Changes</div>
            <div className="space-y-1">
              {recentEntries.map((entry, idx) => (
                <div
                  key={entry.id}
                  className="text-xs p-2 rounded bg-muted/50 flex items-center gap-2"
                >
                  <Badge variant="outline" className="text-xs">
                    {entry.action}
                  </Badge>
                  <span className="truncate flex-1">{entry.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t text-sm text-muted-foreground">
          <p>💡 <strong>Tip:</strong> Use Ctrl+Z to undo and Ctrl+Y to redo from anywhere in the app!</p>
        </div>
      </CardContent>
    </Card>
  );
}
