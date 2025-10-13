import { CatalogStep, CreateCatalogStepInput } from '@/models/catalog.model';
import {
  ValidationResult,
  validateRequired,
  validateLength,
  validatePattern,
  validateUnique,
  combineValidationResults,
} from './common.validator';

export function validateCatalogStep(
  input: Partial<CreateCatalogStepInput>,
  existingSteps: CatalogStep[],
  currentId?: string
): ValidationResult {
  const results: ValidationResult[] = [
    validateStepName(input.name || '', existingSteps, currentId),
    validateStepDescription(input.description || ''),
    validateJavaClass(input.javaClass || ''),
    validateJavaMethod(input.javaMethod || ''),
  ];

  if (input.sqlTables) {
    results.push(...input.sqlTables.map(validateSQLTable));
  }

  return combineValidationResults(results);
}

export function validateStepName(
  value: string,
  existingSteps: CatalogStep[],
  currentId?: string
): ValidationResult {
  const trimmed = value.trim();

  const requiredCheck = validateRequired(trimmed, 'Step name');
  if (!requiredCheck.isValid) return requiredCheck;

  const lengthCheck = validateLength(trimmed, 'Step name', 3, 100);
  if (!lengthCheck.isValid) return lengthCheck;

  return validateUnique(
    trimmed,
    existingSteps,
    step => step.name,
    currentId,
    'Step name'
  );
}

export function validateStepDescription(value: string): ValidationResult {
  const trimmed = value.trim();

  const requiredCheck = validateRequired(trimmed, 'Step description');
  if (!requiredCheck.isValid) return requiredCheck;

  return validateLength(trimmed, 'Step description', 10, 500);
}

export function validateJavaClass(value: string): ValidationResult {
  const trimmed = value.trim();

  const requiredCheck = validateRequired(trimmed, 'Java class name');
  if (!requiredCheck.isValid) return requiredCheck;

  const lengthCheck = validateLength(trimmed, 'Java class name', 1, 255);
  if (!lengthCheck.isValid) return lengthCheck;

  const javaClassPattern = /^[A-Z][a-zA-Z0-9_]*(\.[A-Z][a-zA-Z0-9_]*)*$/;
  return validatePattern(
    trimmed,
    javaClassPattern,
    'Java class name',
    'Invalid Java class name format',
    'Use format: com.example.ClassName or ClassName'
  );
}

export function validateJavaMethod(value: string): ValidationResult {
  const trimmed = value.trim();

  const requiredCheck = validateRequired(trimmed, 'Java method name');
  if (!requiredCheck.isValid) return requiredCheck;

  const lengthCheck = validateLength(trimmed, 'Java method name', 1, 100);
  if (!lengthCheck.isValid) return lengthCheck;

  const javaMethodPattern = /^[a-z][a-zA-Z0-9_]*$/;
  return validatePattern(
    trimmed,
    javaMethodPattern,
    'Java method name',
    'Invalid Java method name format',
    'Use camelCase format: methodName'
  );
}

export function validateSQLTable(value: string): ValidationResult {
  const trimmed = value.trim();

  const requiredCheck = validateRequired(trimmed, 'SQL table name');
  if (!requiredCheck.isValid) return requiredCheck;

  const lengthCheck = validateLength(trimmed, 'SQL table name', 1, 128);
  if (!lengthCheck.isValid) return lengthCheck;

  const sqlTablePattern = /^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)?$/;
  return validatePattern(
    trimmed,
    sqlTablePattern,
    'SQL table name',
    'Invalid SQL table name format',
    'Use format: table_name or schema.table_name'
  );
}

export function validateBulkCatalogSteps(
  inputs: CreateCatalogStepInput[],
  existingSteps: CatalogStep[]
): Map<number, ValidationResult> {
  const results = new Map<number, ValidationResult>();
  const allSteps = [...existingSteps];
  const usedNames = new Set(existingSteps.map(s => s.name.toLowerCase()));

  inputs.forEach((input, index) => {
    const result = validateCatalogStep(input, allSteps);
    results.set(index, result);

    if (result.isValid) {
      const nameLower = input.name.trim().toLowerCase();
      if (usedNames.has(nameLower)) {
        results.set(index, {
          isValid: false,
          error: `Duplicate step name in import: "${input.name}"`,
          warningLevel: 'error',
        });
      } else {
        usedNames.add(nameLower);
      }
    }
  });

  return results;
}
