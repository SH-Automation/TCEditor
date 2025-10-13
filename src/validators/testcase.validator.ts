import { TestCase, CreateTestCaseInput, TestStepMembership } from '@/models/testcase.model';
import {
  ValidationResult,
  validateRequired,
  validateLength,
  validateUnique,
  validateRange,
  validateInteger,
  combineValidationResults,
} from './common.validator';
import { validateTCID } from './tcid.validator';

export function validateTestCase(
  input: Partial<CreateTestCaseInput>,
  existingTestCases: TestCase[],
  currentId?: string
): ValidationResult {
  const results: ValidationResult[] = [
    validateTCID(input.id || '', existingTestCases, currentId),
    validateTestCaseName(input.name || '', existingTestCases, currentId),
    validateTestCaseDescription(input.description || ''),
  ];

  return combineValidationResults(results);
}

export function validateTestCaseName(
  value: string,
  existingTestCases: TestCase[],
  currentId?: string
): ValidationResult {
  const trimmed = value.trim();

  const requiredCheck = validateRequired(trimmed, 'Test case name');
  if (!requiredCheck.isValid) return requiredCheck;

  const lengthCheck = validateLength(trimmed, 'Test case name', 3, 200);
  if (!lengthCheck.isValid) return lengthCheck;

  const uniqueCheck = validateUnique(
    trimmed,
    existingTestCases,
    tc => tc.name,
    currentId,
    'Test case name'
  );

  if (!uniqueCheck.isValid) {
    return {
      ...uniqueCheck,
      warningLevel: 'warning',
    };
  }

  return uniqueCheck;
}

export function validateTestCaseDescription(value: string): ValidationResult {
  const trimmed = value.trim();

  const requiredCheck = validateRequired(trimmed, 'Test case description');
  if (!requiredCheck.isValid) return requiredCheck;

  return validateLength(trimmed, 'Test case description', 10, 1000);
}

export function validateProcessOrder(
  value: number,
  existingMemberships: TestStepMembership[],
  testCaseId: string,
  currentMembershipId?: string
): ValidationResult {
  const integerCheck = validateInteger(value, 'Process order');
  if (!integerCheck.isValid) return integerCheck;

  const rangeCheck = validateRange(value, 'Process order', 1, 9999);
  if (!rangeCheck.isValid) return rangeCheck;

  const sameCaseMemberships = existingMemberships.filter(
    m => m.testCaseId === testCaseId && m.id !== currentMembershipId
  );
  const existingOrders = sameCaseMemberships.map(m => m.processOrder);
  
  const isDuplicate = existingOrders.includes(value);
  if (isDuplicate) {
    const nextAvailable = Math.max(...existingOrders, 0) + 1;
    return {
      isValid: false,
      error: `Process order ${value} is already used in this test case`,
      suggestion: `Try: ${nextAvailable}`,
      warningLevel: 'warning',
    };
  }

  return { isValid: true, warningLevel: 'info' };
}

export function validateMembershipOrders(
  memberships: Array<{ id: string; processOrder: number }>
): ValidationResult {
  const orders = memberships.map(m => m.processOrder);
  const uniqueOrders = new Set(orders);

  if (orders.length !== uniqueOrders.size) {
    return {
      isValid: false,
      error: 'Duplicate process orders detected',
      suggestion: 'Each step must have a unique process order',
      warningLevel: 'error',
    };
  }

  const invalidOrders = memberships.filter(m => m.processOrder < 1 || m.processOrder > 9999);
  if (invalidOrders.length > 0) {
    return {
      isValid: false,
      error: 'Process orders must be between 1 and 9999',
      warningLevel: 'error',
    };
  }

  return { isValid: true, warningLevel: 'info' };
}

export function suggestProcessOrders(
  currentMemberships: TestStepMembership[],
  testCaseId: string
): number[] {
  const sameCaseMemberships = currentMemberships.filter(m => m.testCaseId === testCaseId);
  const existingOrders = sameCaseMemberships.map(m => m.processOrder).sort((a, b) => a - b);

  if (existingOrders.length === 0) {
    return [1, 2, 3, 4, 5];
  }

  const maxOrder = Math.max(...existingOrders);
  const suggestions: number[] = [];

  for (let i = 1; i <= 5; i++) {
    const candidate = maxOrder + i;
    if (candidate <= 9999) {
      suggestions.push(candidate);
    }
  }

  for (let i = 1; i <= existingOrders.length && suggestions.length < 5; i++) {
    if (!existingOrders.includes(i)) {
      suggestions.unshift(i);
    }
  }

  return suggestions.slice(0, 5);
}
