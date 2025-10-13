import { TestCase } from '@/models/testcase.model';
import { ValidationResult, validateRequired } from './common.validator';

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
  const requiredCheck = validateRequired(value.trim(), 'Test Case ID');
  if (!requiredCheck.isValid) {
    return {
      ...requiredCheck,
      suggestion: 'Try: TC-001, PROJECT-TC-001, or TC-001-V1',
    };
  }

  const trimmed = value.trim();

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
    const suggestions = generateFormatSuggestions(trimmed);
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

function generateFormatSuggestions(value: string): string[] {
  const suggestions: string[] = [];
  
  if (/^\d+$/.test(value)) {
    const paddedNum = value.padStart(3, '0').slice(0, 6);
    suggestions.push(`TC-${paddedNum}`);
  } else if (/^TC\d+$/.test(value)) {
    const num = value.slice(2).padStart(3, '0').slice(0, 6);
    suggestions.push(`TC-${num}`);
  } else if (/^[A-Z]+-\d+$/.test(value)) {
    const parts = value.split('-');
    const num = parts[1].padStart(3, '0').slice(0, 6);
    suggestions.push(`${parts[0]}-TC-${num}`);
  } else {
    suggestions.push('TC-001', 'PROJECT-TC-001', 'TC-001-V1');
  }

  return suggestions;
}

export function generateNextTCID(baseTCID: string, existingTestCases: TestCase[]): string {
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

export function parseTCIDComponents(tcid: string): {
  prefix?: string;
  number: string;
  suffix?: string;
} | null {
  for (const [name, pattern] of Object.entries(TCID_PATTERNS)) {
    if (pattern.test(tcid)) {
      const match = tcid.match(/^(?:([A-Z]{2,4})-)?TC-(\d{3,6})(?:-([A-Z]{1,3}))?$/);
      if (match) {
        return {
          prefix: match[1],
          number: match[2],
          suffix: match[3],
        };
      }
    }
  }
  return null;
}

export function formatTCID(
  number: number,
  options: {
    prefix?: string;
    suffix?: string;
    padding?: number;
  } = {}
): string {
  const { prefix, suffix, padding = 3 } = options;
  const paddedNumber = number.toString().padStart(padding, '0');
  
  let tcid = `TC-${paddedNumber}`;
  if (prefix) {
    tcid = `${prefix}-${tcid}`;
  }
  if (suffix) {
    tcid = `${tcid}-${suffix}`;
  }
  
  return tcid;
}
