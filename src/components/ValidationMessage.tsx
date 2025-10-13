import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, Warning, X, Lightbulb } from '@phosphor-icons/react';
import { ValidationResult, TCIDValidationResult } from '@/lib/validation';

interface ValidationMessageProps {
  validation: ValidationResult | TCIDValidationResult;
  onApplySuggestion?: (value: string) => void;
  className?: string;
}

export function ValidationMessage({ 
  validation, 
  onApplySuggestion,
  className 
}: ValidationMessageProps) {
  if (validation.isValid && !validation.suggestion) {
    return null;
  }

  const formattedValue = 'formattedValue' in validation ? validation.formattedValue : undefined;
  const showApplyButton = onApplySuggestion && formattedValue;

  const getIcon = () => {
    switch (validation.warningLevel) {
      case 'error':
        return <X size={16} className="text-destructive" />;
      case 'warning':
        return <Warning size={16} className="text-accent" />;
      case 'info':
        return <Info size={16} className="text-primary" />;
      default:
        return <Info size={16} />;
    }
  };

  const getAlertVariant = () => {
    return validation.warningLevel === 'error' ? 'destructive' : 'default';
  };

  return (
    <Alert variant={getAlertVariant()} className={className}>
      <div className="flex items-start gap-2">
        {getIcon()}
        <div className="flex-1 space-y-1">
          {validation.error && (
            <AlertDescription className="font-medium">
              {validation.error}
            </AlertDescription>
          )}
          {validation.suggestion && (
            <AlertDescription className="text-sm flex items-start gap-1.5">
              <Lightbulb size={14} className="mt-0.5 shrink-0" />
              <span>{validation.suggestion}</span>
            </AlertDescription>
          )}
        </div>
        {showApplyButton && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onApplySuggestion(formattedValue)}
            className="shrink-0"
          >
            Apply
          </Button>
        )}
      </div>
    </Alert>
  );
}
