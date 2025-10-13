import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  ArrowClockwise, 
  ArrowCounterClockwise, 
  Trash,
  Plus,
  PencilSimple,
  ArrowsClockwise,
  Database,
  Table,
  Note
} from '@phosphor-icons/react';
import { HistoryEntry } from '@/lib/history-types';
import { useHistory } from '@/hooks/use-history';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export function HistoryTimeline() {
  const {
    historyState,
    undo,
    redo,
    jumpToEntry,
    clearHistory,
    addComment,
    canUndo,
    canRedo,
  } = useHistory();

  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const [commentText, setCommentText] = useState('');

  if (!historyState) return null;

  const { entries, currentIndex } = historyState;

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return <Plus size={16} className="text-green-600" />;
      case 'update':
        return <PencilSimple size={16} className="text-blue-600" />;
      case 'delete':
        return <Trash size={16} className="text-red-600" />;
      case 'reorder':
        return <ArrowsClockwise size={16} className="text-purple-600" />;
      case 'bulk-update':
        return <Database size={16} className="text-orange-600" />;
      case 'bulk-delete':
        return <Database size={16} className="text-red-600" />;
      default:
        return <Note size={16} />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'update':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'delete':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'reorder':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'bulk-update':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'bulk-delete':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleAddComment = (entryId: string) => {
    if (commentText.trim()) {
      addComment(entryId, commentText.trim());
      setCommentText('');
      setSelectedEntry(null);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ArrowClockwise size={20} />
            Change History
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => undo()}
              disabled={!canUndo}
            >
              <ArrowCounterClockwise size={16} />
              Undo
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => redo()}
              disabled={!canRedo}
            >
              <ArrowClockwise size={16} />
              Redo
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={clearHistory}
              disabled={entries.length === 0}
            >
              <Trash size={16} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ArrowClockwise size={48} className="mx-auto mb-4 opacity-30" />
            <p>No changes recorded yet</p>
            <p className="text-sm mt-2">All actions will be tracked here</p>
          </div>
        ) : (
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {entries.map((entry, index) => {
                const isActive = index === currentIndex;
                const isFuture = index > currentIndex;
                
                return (
                  <div key={entry.id} className="relative">
                    {index > 0 && (
                      <div className="absolute left-[19px] top-0 w-0.5 h-4 bg-border -translate-y-4" />
                    )}
                    <div
                      className={`
                        flex gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer
                        ${isActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                        ${isFuture ? 'opacity-50' : ''}
                      `}
                      onClick={() => jumpToEntry(index)}
                    >
                      <div className={`
                        flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2
                        ${isActive ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background'}
                      `}>
                        {getActionIcon(entry.action)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={getActionColor(entry.action)}>
                              {entry.action}
                            </Badge>
                            {entry.entityName && (
                              <span className="text-sm font-medium truncate">
                                {entry.entityName}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(entry.timestamp), 'MMM d, h:mm a')}
                          </span>
                        </div>
                        
                        <p className="text-sm text-foreground mb-2">
                          {entry.description}
                        </p>
                        
                        {entry.comment && (
                          <div className="bg-muted/50 rounded p-2 mb-2">
                            <p className="text-xs text-muted-foreground flex items-start gap-1">
                              <Note size={14} className="flex-shrink-0 mt-0.5" />
                              {entry.comment}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="secondary" className="text-xs">
                            {entry.entityType}
                          </Badge>
                          {!entry.comment && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEntry(entry);
                                  }}
                                >
                                  <Note size={12} />
                                  Add note
                                </Button>
                              </DialogTrigger>
                              <DialogContent onClick={(e) => e.stopPropagation()}>
                                <DialogHeader>
                                  <DialogTitle>Add Note</DialogTitle>
                                  <DialogDescription>
                                    Add a comment to describe this change
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <Textarea
                                    placeholder="Enter your note here..."
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    rows={4}
                                  />
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setCommentText('');
                                        setSelectedEntry(null);
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button onClick={() => handleAddComment(entry.id)}>
                                      Save Note
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
        
        {entries.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{entries.length} total changes</span>
              <span>Currently at position {currentIndex + 1}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
