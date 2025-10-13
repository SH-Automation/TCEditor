import { CatalogStep, TestCase } from './types';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  suggestion?: string;
  warningLevel?: 'error' | 'warning' | 'info';
}

export interface TCIDValidationResult extends ValidationResult {
  formattedValue?: string;
}

const TCID_PATTERNS = {
  standard: /^TC-\d{3,6}$/,
  withPrefix: /^[A-Z]{2,4}-TC-\d{3,6}$/,
  withSuffix: /^TC-\d{3,6}-[A-Z]{1,3}$/,
  full: /^[A-Z]{2,4}-TC-\d{3,6}-[A-Z]{1,3}$/,
};

export function validateTCID(
  value: string,
  existingTestCases: TestCase[],
  currentId?: string
): TCIDValidationResult {
  const trimmed = value.trim();

  if (!trimmed) {
    return {
      isValid: false,
      error: 'Test Case ID is required',
      suggestion: 'Try: TC-001, PROJECT-TC-001, or TC-001-V1',
      warningLevel: 'error',
    };
  }

  if (trimmed.length > 50) {
    return {
      isValid: false,
      error: 'Test Case ID is too long (max 50 characters)',
      suggestion: 'Shorten your ID to under 50 characters',
      warningLevel: 'error',
    };
  }

  const hasSpaces = /\s/.test(trimmed);
  if (hasSpaces) {
    const suggested = trimmed.replace(/\s+/g, '-');
    return {
      isValid: false,
      error: 'Test Case ID cannot contain spaces',
      suggestion: `Try: ${suggested}`,
      formattedValue: suggested,
      warningLevel: 'error',
    };
  }

  const hasLowercase = /[a-z]/.test(trimmed);
  if (hasLowercase) {
    const suggested = trimmed.toUpperCase();
    return {
      isValid: false,
      error: 'Test Case ID must be uppercase',
      suggestion: `Try: ${suggested}`,
      formattedValue: suggested,
      warningLevel: 'warning',
    };
  }

  const hasSpecialChars = /[^A-Z0-9\-]/.test(trimmed);
  if (hasSpecialChars) {
    const suggested = trimmed.replace(/[^A-Z0-9\-]/g, '');
    return {
      isValid: false,
      error: 'Test Case ID can only contain uppercase letters, numbers, and hyphens',
      suggestion: suggested ? `Try: ${suggested}` : 'Use only A-Z, 0-9, and hyphens',
      formattedValue: suggested || undefined,
      warningLevel: 'error',
    };
  }

  const matchesPattern = Object.values(TCID_PATTERNS).some(pattern => pattern.test(trimmed));
  if (!matchesPattern) {
    const suggestions: string[] = [];
    
    if (/^\d+$/.test(trimmed)) {
      const paddedNum = trimmed.padStart(3, '0').slice(0, 6);
      suggestions.push(`TC-${paddedNum}`);
    } else if (/^TC\d+$/.test(trimmed)) {
      const num = trimmed.slice(2).padStart(3, '0').slice(0, 6);
      suggestions.push(`TC-${num}`);
    } else if (/^[A-Z]+-\d+$/.test(trimmed)) {
      const parts = trimmed.split('-');
      const num = parts[1].padStart(3, '0').slice(0, 6);
      suggestions.push(`${parts[0]}-TC-${num}`);
    } else {
      suggestions.push('TC-001', 'PROJECT-TC-001', 'TC-001-V1');
    }

    return {
      isValid: false,
      error: 'Test Case ID format is invalid',
      suggestion: `Expected format: TC-### or PROJECT-TC-###-VERSION. Try: ${suggestions.join(', ')}`,
      formattedValue: suggestions[0],
      warningLevel: 'error',
    };
  }

  const duplicateCase = existingTestCases.find(
    tc => tc.id !== currentId && tc.id.toLowerCase() === trimmed.toLowerCase()
  );
  if (duplicateCase) {
    const nextAvailable = generateNextTCID(trimmed, existingTestCases);
    return {
      isValid: false,
      error: `Test Case ID "${trimmed}" already exists`,
      suggestion: `Try: ${nextAvailable}`,
      formattedValue: nextAvailable,
      warningLevel: 'error',
    };
  }

  return {
    isValid: true,
    warningLevel: 'info',
  };
}

function generateNextTCID(baseTCID: string, existingTestCases: TestCase[]): string {
  const tcidLower = baseTCID.toLowerCase();
  const existingIds = existingTestCases.map(tc => tc.id.toLowerCase());

  const tcMatch = baseTCID.match(/TC-(\d+)/);
  if (tcMatch) {
    const baseNum = parseInt(tcMatch[1], 10);
    const prefix = baseTCID.substring(0, tcMatch.index! + 3);
    const suffix = baseTCID.substring(tcMatch.index! + tcMatch[0].length);
    
    for (let i = baseNum + 1; i < baseNum + 100; i++) {
      const paddedNum = i.toString().padStart(tcMatch[1].length, '0');
      const candidate = `${prefix}${paddedNum}${suffix}`;
      if (!existingIds.includes(candidate.toLowerCase())) {
        return candidate;
      }
    }
  }

  let counter = 1;
  while (existingIds.includes(`${tcidLower}-${counter}`)) {
    counter++;
  }
  return `${baseTCID}-${counter}`;
}

export function validateCatalogStepName(
  value: string,
  existingSteps: CatalogStep[],
  currentId?: string
): ValidationResult {
  const trimmed = value.trim();

  if (!trimmed) {
    return {
      isValid: false,
      error: 'Step name is required',
      warningLevel: 'error',
    };
  }

  if (trimmed.length < 3) {
    return {
      isValid: false,
      error: 'Step name must be at least 3 characters',
      suggestion: 'Provide a more descriptive name',
      warningLevel: 'error',
    };
  }

  if (trimmed.length > 100) {
    return {
      isValid: false,
      error: 'Step name is too long (max 100 characters)',
      suggestion: 'Shorten your step name to under 100 characters',
      warningLevel: 'error',
    };
  }

  const duplicateStep = existingSteps.find(
    step => step.id !== currentId && step.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (duplicateStep) {
    return {
      isValid: false,
      error: `Step name "${trimmed}" already exists`,
      suggestion: 'Try adding a qualifier like a version number or context',
      warningLevel: 'error',
    };
  }

  return {
    isValid: true,
    warningLevel: 'info',
  };
}

export function validateJavaClassName(value: string): ValidationResult {
  const trimmed = value.trim();

  if (!trimmed) {
    return {
      isValid: false,
      error: 'Java class name is required',
      warningLevel: 'error',
    };
  }

  const javaClassPattern = /^[A-Z][a-zA-Z0-9_]*(\.[A-Z][a-zA-Z0-9_]*)*$/;
  if (!javaClassPattern.test(trimmed)) {
    return {
      isValid: false,
      error: 'Invalid Java class name format',
      suggestion: 'Use format: com.example.ClassName or ClassName',
      warningLevel: 'error',
    };
  }

  if (trimmed.length > 255) {
    return {
      isValid: false,
      error: 'Java class name is too long (max 255 characters)',
      warningLevel: 'error',
    };
  }

  return {
    isValid: true,
    warningLevel: 'info',
  };
}

export function validateJavaMethodName(value: string): ValidationResult {
  const trimmed = value.trim();

  if (!trimmed) {
    return {
      isValid: false,
      error: 'Java method name is required',
      warningLevel: 'error',
    };
  }

  const javaMethodPattern = /^[a-z][a-zA-Z0-9_]*$/;
  if (!javaMethodPattern.test(trimmed)) {
    return {
      isValid: false,
      error: 'Invalid Java method name format',
      suggestion: 'Use camelCase format: methodName',
      warningLevel: 'error',
    };
  }

  if (trimmed.length > 100) {
    return {
      isValid: false,
      error: 'Java method name is too long (max 100 characters)',
      warningLevel: 'error',
    };
  }

  return {
    isValid: true,
    warningLevel: 'info',
  };
}

export function validateSQLTableName(value: string): ValidationResult {
  const trimmed = value.trim();

  if (!trimmed) {
    return {
      isValid: false,
      error: 'SQL table name is required',
      warningLevel: 'error',
    };
  }

  const sqlTablePattern = /^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)?$/;
  if (!sqlTablePattern.test(trimmed)) {
    return {
      isValid: false,
      error: 'Invalid SQL table name format',
      suggestion: 'Use format: table_name or schema.table_name',
      warningLevel: 'error',
    };
  }

  if (trimmed.length > 128) {
    return {
      isValid: false,
      error: 'SQL table name is too long (max 128 characters)',
      warningLevel: 'error',
    };
  }

  return {
    isValid: true,
    warningLevel: 'info',
  };
}

export function validateProcessOrder(
  value: number,
  existingOrders: number[],
  currentMembershipId?: string,
  excludeMembershipId?: string
): ValidationResult {
  if (!Number.isInteger(value)) {
    return {
      isValid: false,
      error: 'Process order must be a whole number',
      suggestion: 'Use integers like 1, 2, 3...',
      warningLevel: 'error',
    };
  }

  if (value < 1) {
    return {
      isValid: false,
      error: 'Process order must be at least 1',
      suggestion: 'Start with 1 for the first step',
      warningLevel: 'error',
    };
  }

  if (value > 9999) {
    return {
      isValid: false,
      error: 'Process order is too large (max 9999)',
      warningLevel: 'error',
    };
  }

  const isDuplicate = existingOrders.includes(value);
  if (isDuplicate && currentMembershipId !== excludeMembershipId) {
    const nextAvailable = Math.max(...existingOrders, 0) + 1;
    return {
      isValid: false,
      error: `Process order ${value} is already used`,
      suggestion: `Try: ${nextAvailable}`,
      warningLevel: 'warning',
    };
  }

  return {
    isValid: true,
    warningLevel: 'info',
  };
}

export function validateTestCaseName(
  value: string,
  existingTestCases: TestCase[],
  currentId?: string
): ValidationResult {
  const trimmed = value.trim();

  if (!trimmed) {
    return {
      isValid: false,
      error: 'Test case name is required',
      warningLevel: 'error',
    };
  }

  if (trimmed.length < 3) {
    return {
      isValid: false,
      error: 'Test case name must be at least 3 characters',
      suggestion: 'Provide a more descriptive name',
      warningLevel: 'error',
    };
  }

  if (trimmed.length > 200) {
    return {
      isValid: false,
      error: 'Test case name is too long (max 200 characters)',
      suggestion: 'Shorten your test case name',
      warningLevel: 'error',
    };
  }

  const duplicateCase = existingTestCases.find(
    tc => tc.id !== currentId && tc.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (duplicateCase) {
    return {
      isValid: false,
      error: `Test case name "${trimmed}" already exists`,
      suggestion: 'Try adding a qualifier to make it unique',
      warningLevel: 'warning',
    };
  }

  return {
    isValid: true,
    warningLevel: 'info',
  };
}
