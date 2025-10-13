import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ValidationMessage } from './ValidationMessage';
import { ValidationResult, TCIDValidationResult } from '@/lib/validation';
import { cn } from '@/lib/utils';

interface ValidatedInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  validation?: ValidationResult | TCIDValidationResult;
  placeholder?: string;
  required?: boolean;
  type?: string;
  className?: string;
  description?: string;
  disabled?: boolean;
}

export function ValidatedInput({
  id,
  label,
  value,
  onChange,
  onBlur,
  validation,
  placeholder,
  required = false,
  type = 'text',
  className,
  description,
  disabled = false,
}: ValidatedInputProps) {
  const hasError = validation && !validation.isValid;
  const formattedValue = validation && 'formattedValue' in validation ? validation.formattedValue : undefined;

  const handleApplySuggestion = (suggestedValue: string) => {
    onChange(suggestedValue);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="space-y-1">
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={cn(
          hasError && 'border-destructive focus-visible:ring-destructive'
        )}
      />
      
      {validation && (
        <ValidationMessage
          validation={validation}
          onApplySuggestion={formattedValue ? handleApplySuggestion : undefined}
        />
      )}
    </div>
  );
}
