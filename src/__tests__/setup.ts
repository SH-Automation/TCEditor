import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

global.window.URL.createObjectURL = vi.fn(() => 'mock-url');
global.window.URL.revokeObjectURL = vi.fn();

export {};
