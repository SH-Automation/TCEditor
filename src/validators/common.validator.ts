import { ValidationError } from '@/models/common.model';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  suggestion?: string;
  warningLevel?: 'error' | 'warning' | 'info';
}

export function createValidationError(
  field: string,
  message: string,
  suggestion?: string,
  warningLevel: 'error' | 'warning' | 'info' = 'error'
): ValidationError {
  return {
    field,
    message,
    suggestion,
    warningLevel,
  };
}

export function combineValidationResults(results: ValidationResult[]): ValidationResult {
  const errors = results.filter(r => !r.isValid);
  
  if (errors.length === 0) {
    return { isValid: true, warningLevel: 'info' };
  }
  
  const errorMessages = errors.map(e => e.error).filter(Boolean);
  const suggestions = errors.map(e => e.suggestion).filter(Boolean);
  
  return {
    isValid: false,
    error: errorMessages.join('; '),
    suggestion: suggestions.length > 0 ? suggestions.join('; ') : undefined,
    warningLevel: errors.some(e => e.warningLevel === 'error') ? 'error' : 'warning',
  };
}

export function validateRequired(value: any, fieldName: string): ValidationResult {
  if (value === null || value === undefined || value === '') {
    return {
      isValid: false,
      error: `${fieldName} is required`,
      warningLevel: 'error',
    };
  }
  return { isValid: true, warningLevel: 'info' };
}

export function validateLength(
  value: string,
  fieldName: string,
  min?: number,
  max?: number
): ValidationResult {
  if (min !== undefined && value.length < min) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${min} characters`,
      suggestion: min <= 10 ? 'Provide a more descriptive value' : undefined,
      warningLevel: 'error',
    };
  }
  
  if (max !== undefined && value.length > max) {
    return {
      isValid: false,
      error: `${fieldName} must be at most ${max} characters`,
      suggestion: `Shorten to ${max} characters or less`,
      warningLevel: 'error',
    };
  }
  
  return { isValid: true, warningLevel: 'info' };
}

export function validatePattern(
  value: string,
  pattern: RegExp,
  fieldName: string,
  errorMessage: string,
  suggestion?: string
): ValidationResult {
  if (!pattern.test(value)) {
    return {
      isValid: false,
      error: errorMessage,
      suggestion,
      warningLevel: 'error',
    };
  }
  return { isValid: true, warningLevel: 'info' };
}

export function validateUnique<T extends { id: string }>(
  value: string,
  items: T[],
  selector: (item: T) => string,
  currentId: string | undefined,
  fieldName: string
): ValidationResult {
  const duplicate = items.find(
    item => item.id !== currentId && selector(item).toLowerCase() === value.toLowerCase()
  );
  
  if (duplicate) {
    return {
      isValid: false,
      error: `${fieldName} "${value}" already exists`,
      suggestion: 'Try adding a qualifier to make it unique',
      warningLevel: 'error',
    };
  }
  
  return { isValid: true, warningLevel: 'info' };
}

export function validateRange(
  value: number,
  fieldName: string,
  min?: number,
  max?: number
): ValidationResult {
  if (min !== undefined && value < min) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${min}`,
      warningLevel: 'error',
    };
  }
  
  if (max !== undefined && value > max) {
    return {
      isValid: false,
      error: `${fieldName} must be at most ${max}`,
      warningLevel: 'error',
    };
  }
  
  return { isValid: true, warningLevel: 'info' };
}

export function validateInteger(value: number, fieldName: string): ValidationResult {
  if (!Number.isInteger(value)) {
    return {
      isValid: false,
      error: `${fieldName} must be a whole number`,
      suggestion: 'Use integers like 1, 2, 3...',
      warningLevel: 'error',
    };
  }
  
  return { isValid: true, warningLevel: 'info' };
}
