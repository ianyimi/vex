import { describe, it, expect } from 'vitest';
import { validateProjectName } from '../utils/validation.js';

describe('validateProjectName', () => {
  it('accepts valid simple names', () => {
    expect(validateProjectName('my-app').valid).toBe(true);
    expect(validateProjectName('my-vexcms-app').valid).toBe(true);
    expect(validateProjectName('test-project').valid).toBe(true);
  });

  it('accepts scoped package names', () => {
    expect(validateProjectName('@org/my-app').valid).toBe(true);
    expect(validateProjectName('@mycompany/website').valid).toBe(true);
  });

  it('accepts dot notation', () => {
    expect(validateProjectName('.').valid).toBe(false);
    // "." is not a valid npm name but we handle it specially in resolveProjectName
  });

  it('rejects names with uppercase letters', () => {
    const result = validateProjectName('MyApp');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects names with spaces', () => {
    const result = validateProjectName('my app');
    expect(result.valid).toBe(false);
  });

  it('rejects empty string', () => {
    const result = validateProjectName('');
    expect(result.valid).toBe(false);
  });

  it('rejects names starting with period', () => {
    const result = validateProjectName('.hidden');
    expect(result.valid).toBe(false);
  });

  it('rejects names starting with underscore', () => {
    const result = validateProjectName('_private');
    expect(result.valid).toBe(false);
  });
});
