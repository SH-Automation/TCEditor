import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowClockwise, CheckCircle, Warning } from '@phosphor-icons/react';
import { useHistory } from '@/hooks/use-history';

export function HistoryIndicator() {
  const { historyState, canUndo, canRedo } = useHistory();

  if (!historyState) return null;

  const { entries, currentIndex } = historyState;
  const hasChanges = entries.length > 0;
  const isAtLatest = currentIndex === entries.length - 1;

  if (!hasChanges) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="gap-2">
              <CheckCircle size={14} className="text-green-600" />
              <span className="hidden sm:inline">No changes</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>No changes have been made yet</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (!isAtLatest) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="gap-2">
              <Warning size={14} className="text-orange-600" />
              <span className="hidden sm:inline">
                {currentIndex + 1} of {entries.length}
              </span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Viewing past state. {entries.length - currentIndex - 1} changes ahead.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="gap-2">
            <ArrowClockwise size={14} className="text-primary" />
            <span className="hidden sm:inline">
              {entries.length} {entries.length === 1 ? 'change' : 'changes'}
            </span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p>{entries.length} changes tracked</p>
            <p className="text-xs text-muted-foreground">
              {canUndo ? 'Press Ctrl+Z to undo' : 'No changes to undo'}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
