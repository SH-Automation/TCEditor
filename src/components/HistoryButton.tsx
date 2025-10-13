import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ArrowClockwise, ArrowCounterClockwise } from '@phosphor-icons/react';
import { HistoryTimeline } from './HistoryTimeline';
import { useHistory } from '@/hooks/use-history';
import { Badge } from '@/components/ui/badge';

export function HistoryButton() {
  const [open, setOpen] = useState(false);
  const { historyState, canUndo, canRedo, undo, redo } = useHistory();

  const entryCount = historyState?.entries.length || 0;

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={undo}
          disabled={!canUndo}
          className="shadow-lg"
          title="Undo (Ctrl+Z)"
        >
          <ArrowCounterClockwise size={16} />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={redo}
          disabled={!canRedo}
          className="shadow-lg"
          title="Redo (Ctrl+Y)"
        >
          <ArrowClockwise size={16} />
        </Button>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="default" size="sm" className="shadow-lg relative">
              <ArrowClockwise size={16} />
              History
              {entryCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                  {entryCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[600px] sm:max-w-[600px]">
            <SheetHeader>
              <SheetTitle>Change History Timeline</SheetTitle>
              <SheetDescription>
                View, navigate, and annotate your change history. Click any entry to jump to that state.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <HistoryTimeline />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
