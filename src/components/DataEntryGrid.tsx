import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow as UITableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, PencilSimple, Trash, FloppyDisk, X, ArrowsClockwise, Database } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { tableSchemaService, TableColumn, TableRow, TableDataFilter } from '@/lib/table-schema-service';

interface DataEntryGridProps {
  tableName: string;
  filter?: TableDataFilter;
  onSchemaUpdate?: () => void;
}

export function DataEntryGrid({ tableName, filter, onSchemaUpdate }: DataEntryGridProps) {
  const [columns, setColumns] = useState<TableColumn[]>([]);
  const [rows, setRows] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRow, setEditingRow] = useState<TableRow | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isNewRow, setIsNewRow] = useState(false);
  const [formData, setFormData] = useState<TableRow>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const primaryKeyColumn = useMemo(
    () => columns.find(col => col.isPrimaryKey),
    [columns]
  );

  const editableColumns = useMemo(
    () => columns.filter(col => !col.isPrimaryKey || !col.isIdentity),
    [columns]
  );

  useEffect(() => {
    loadTableSchema();
  }, [tableName]);

  useEffect(() => {
    if (columns.length > 0) {
      loadTableData();
    }
  }, [columns, filter]);

  const loadTableSchema = async () => {
    try {
      setLoading(true);
      const schema = await tableSchemaService.introspectTable(tableName);
      setColumns(schema.columns);
    } catch (error) {
      toast.error('Failed to load table schema');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadTableData = async () => {
    try {
      const result = await tableSchemaService.getTableData(tableName, filter);
      if (result.success && result.data) {
        setRows(Array.isArray(result.data) ? result.data : []);
      } else {
        setRows([]);
        if (result.error) {
          toast.error(`Failed to load data: ${result.error}`);
        }
      }
    } catch (error) {
      toast.error('Failed to load table data');
      console.error(error);
      setRows([]);
    }
  };

  const handleRefresh = async () => {
    tableSchemaService.clearCache(tableName);
    await loadTableSchema();
    toast.success('Schema and data refreshed');
    onSchemaUpdate?.();
  };

  const handleAddRow = () => {
    const newRow: TableRow = {};
    columns.forEach(col => {
      if (col.isPrimaryKey && col.isIdentity) {
        newRow[col.columnName] = crypto.randomUUID();
      } else if (col.defaultValue) {
        newRow[col.columnName] = null;
      } else if (!col.isNullable) {
        newRow[col.columnName] = getDefaultValueForType(col.dataType);
      } else {
        newRow[col.columnName] = null;
      }
    });
    setFormData(newRow);
    setEditingRow(null);
    setIsNewRow(true);
    setIsEditDialogOpen(true);
    setValidationErrors({});
  };

  const handleEditRow = (row: TableRow) => {
    setFormData({ ...row });
    setEditingRow(row);
    setIsNewRow(false);
    setIsEditDialogOpen(true);
    setValidationErrors({});
  };

  const handleDeleteRow = async (row: TableRow) => {
    if (!primaryKeyColumn) {
      toast.error('Cannot delete: No primary key defined');
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to delete this row?`);
    if (!confirmed) return;

    try {
      const pkValue = row[primaryKeyColumn.columnName];
      const result = await tableSchemaService.deleteRow(tableName, primaryKeyColumn.columnName, pkValue);
      
      if (result.success) {
        toast.success('Row deleted successfully');
        await loadTableData();
      } else {
        toast.error(`Delete failed: ${result.error}`);
      }
    } catch (error) {
      toast.error('Failed to delete row');
      console.error(error);
    }
  };

  const handleSaveRow = async () => {
    const errors: Record<string, string> = {};
    
    editableColumns.forEach(col => {
      const validation = tableSchemaService.validateValue(col, formData[col.columnName]);
      if (!validation.valid && validation.error) {
        errors[col.columnName] = validation.error;
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error('Please fix validation errors');
      return;
    }

    try {
      let result;
      if (isNewRow) {
        result = await tableSchemaService.insertRow(tableName, formData);
      } else if (primaryKeyColumn) {
        const pkValue = formData[primaryKeyColumn.columnName];
        result = await tableSchemaService.updateRow(tableName, formData, primaryKeyColumn.columnName, pkValue);
      } else {
        toast.error('Cannot save: No primary key defined');
        return;
      }

      if (result.success) {
        toast.success(isNewRow ? 'Row created successfully' : 'Row updated successfully');
        setIsEditDialogOpen(false);
        await loadTableData();
      } else {
        toast.error(`Save failed: ${result.error}`);
      }
    } catch (error) {
      toast.error('Failed to save row');
      console.error(error);
    }
  };

  const handleInputChange = (columnName: string, value: any) => {
    setFormData(prev => ({ ...prev, [columnName]: value }));
    if (validationErrors[columnName]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[columnName];
        return newErrors;
      });
    }
  };

  const getDefaultValueForType = (dataType: string): any => {
    const type = dataType.toLowerCase();
    if (type.includes('int') || type.includes('numeric') || type.includes('decimal')) {
      return 0;
    }
    if (type.includes('bit')) {
      return false;
    }
    if (type.includes('date') || type.includes('time')) {
      return new Date().toISOString().split('T')[0];
    }
    return '';
  };

  const renderInputForColumn = (column: TableColumn) => {
    const value = formData[column.columnName];
    const error = validationErrors[column.columnName];
    const isReadonly = column.isPrimaryKey && column.isIdentity && !isNewRow;
    const type = column.dataType.toLowerCase();

    if (type.includes('bit')) {
      return (
        <div className="flex items-center gap-2">
          <Checkbox
            id={column.columnName}
            checked={value === true || value === 1}
            onCheckedChange={(checked) => handleInputChange(column.columnName, checked)}
            disabled={isReadonly}
          />
          <Label htmlFor={column.columnName} className="text-sm">
            {column.columnName}
          </Label>
        </div>
      );
    }

    if (type.includes('text') || (type.includes('varchar') && (column.maxLength ?? 0) > 500)) {
      return (
        <div className="space-y-1">
          <Label htmlFor={column.columnName}>
            {column.columnName}
            {!column.isNullable && <span className="text-destructive ml-1">*</span>}
            {isReadonly && <Badge variant="secondary" className="ml-2 text-xs">Read-only</Badge>}
          </Label>
          <textarea
            id={column.columnName}
            className="w-full min-h-[80px] px-3 py-2 text-sm border border-input rounded-md bg-background"
            value={value ?? ''}
            onChange={(e) => handleInputChange(column.columnName, e.target.value)}
            disabled={isReadonly}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      );
    }

    return (
      <div className="space-y-1">
        <Label htmlFor={column.columnName}>
          {column.columnName}
          {!column.isNullable && <span className="text-destructive ml-1">*</span>}
          {isReadonly && <Badge variant="secondary" className="ml-2 text-xs">Read-only</Badge>}
        </Label>
        <Input
          id={column.columnName}
          type={getInputType(column.dataType)}
          value={value ?? ''}
          onChange={(e) => handleInputChange(column.columnName, e.target.value)}
          disabled={isReadonly}
          className={error ? 'border-destructive' : ''}
        />
        {column.foreignKeyReference && (
          <p className="text-xs text-muted-foreground">
            References: {column.foreignKeyReference.table}.{column.foreignKeyReference.column}
          </p>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  };

  const getInputType = (dataType: string): string => {
    const type = dataType.toLowerCase();
    if (type.includes('int') || type.includes('numeric') || type.includes('decimal')) {
      return 'number';
    }
    if (type.includes('date')) {
      return 'date';
    }
    if (type.includes('time')) {
      return 'datetime-local';
    }
    return 'text';
  };

  const formatCellValue = (value: any, column: TableColumn): string => {
    if (value === null || value === undefined) {
      return '';
    }
    if (column.dataType.toLowerCase().includes('bit')) {
      return value ? '✓' : '✗';
    }
    if (column.dataType.toLowerCase().includes('date') || column.dataType.toLowerCase().includes('time')) {
      try {
        return new Date(value).toLocaleString();
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <ArrowsClockwise size={48} className="mx-auto mb-4 text-muted-foreground animate-spin" />
            <p className="text-muted-foreground">Loading table schema...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database size={20} />
                {tableName}
              </CardTitle>
              <CardDescription>
                {rows.length} row{rows.length !== 1 ? 's' : ''} • {columns.length} column{columns.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <ArrowsClockwise size={16} />
                Refresh
              </Button>
              <Button size="sm" onClick={handleAddRow}>
                <Plus size={16} />
                Add Row
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {columns.map(col => (
                <Badge
                  key={col.columnName}
                  variant={col.isPrimaryKey ? 'default' : col.isForeignKey ? 'secondary' : 'outline'}
                  className="font-mono text-xs"
                >
                  {col.columnName}
                  <span className="ml-1 text-muted-foreground">({col.dataType})</span>
                  {col.isPrimaryKey && <span className="ml-1">🔑</span>}
                  {col.isForeignKey && <span className="ml-1">🔗</span>}
                </Badge>
              ))}
            </div>

            <ScrollArea className="w-full rounded-md border">
              <div className="min-w-[800px]">
                <Table>
                  <TableHeader>
                    <UITableRow>
                      {columns.map(col => (
                        <TableHead key={col.columnName} className="whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span>{col.columnName}</span>
                            {col.isPrimaryKey && <Badge variant="secondary" className="text-xs">PK</Badge>}
                            {!col.isNullable && <span className="text-destructive">*</span>}
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </UITableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.length === 0 ? (
                      <UITableRow>
                        <TableCell colSpan={columns.length + 1} className="text-center py-8 text-muted-foreground">
                          No data available. Click "Add Row" to create a new record.
                        </TableCell>
                      </UITableRow>
                    ) : (
                      rows.map((row, idx) => (
                        <UITableRow key={idx}>
                          {columns.map(col => (
                            <TableCell key={col.columnName} className="font-mono text-xs">
                              {formatCellValue(row[col.columnName], col)}
                            </TableCell>
                          ))}
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditRow(row)}
                              >
                                <PencilSimple size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteRow(row)}
                              >
                                <Trash size={14} />
                              </Button>
                            </div>
                          </TableCell>
                        </UITableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNewRow ? 'Add New Row' : 'Edit Row'}</DialogTitle>
            <DialogDescription>
              {isNewRow ? 'Enter values for the new row' : 'Modify the values for this row'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {editableColumns.map(col => (
              <div key={col.columnName}>
                {renderInputForColumn(col)}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              <X size={16} />
              Cancel
            </Button>
            <Button onClick={handleSaveRow}>
              <FloppyDisk size={16} />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
