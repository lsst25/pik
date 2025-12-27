import { describe, it, expect } from 'vitest';
import { isValidPlugin } from './config.js';

describe('isValidPlugin', () => {
  it('should return true for valid plugin object', () => {
    const validPlugin = {
      name: 'Test Plugin',
      description: 'A test plugin',
      command: 'test',
      register: () => undefined,
    };
    expect(isValidPlugin(validPlugin)).toBe(true);
  });

  it('should return true for plugin with optional aliases', () => {
    const validPlugin = {
      name: 'Test Plugin',
      description: 'A test plugin',
      command: 'test',
      aliases: ['t', 'tst'],
      register: () => undefined,
    };
    expect(isValidPlugin(validPlugin)).toBe(true);
  });

  it('should return false for null', () => {
    expect(isValidPlugin(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isValidPlugin(undefined)).toBe(false);
  });

  it('should return false for non-object', () => {
    expect(isValidPlugin('string')).toBe(false);
    expect(isValidPlugin(123)).toBe(false);
    expect(isValidPlugin(true)).toBe(false);
  });

  it('should return false when name is missing', () => {
    const plugin = {
      description: 'A test plugin',
      command: 'test',
      register: () => undefined,
    };
    expect(isValidPlugin(plugin)).toBe(false);
  });

  it('should return false when description is missing', () => {
    const plugin = {
      name: 'Test Plugin',
      command: 'test',
      register: () => undefined,
    };
    expect(isValidPlugin(plugin)).toBe(false);
  });

  it('should return false when command is missing', () => {
    const plugin = {
      name: 'Test Plugin',
      description: 'A test plugin',
      register: () => undefined,
    };
    expect(isValidPlugin(plugin)).toBe(false);
  });

  it('should return false when register is missing', () => {
    const plugin = {
      name: 'Test Plugin',
      description: 'A test plugin',
      command: 'test',
    };
    expect(isValidPlugin(plugin)).toBe(false);
  });

  it('should return false when register is not a function', () => {
    const plugin = {
      name: 'Test Plugin',
      description: 'A test plugin',
      command: 'test',
      register: 'not a function',
    };
    expect(isValidPlugin(plugin)).toBe(false);
  });
});
