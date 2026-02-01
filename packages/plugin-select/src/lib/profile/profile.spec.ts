import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Selector, BlockSelector } from '@lsst/pik-core';
import { Profile } from './profile.js';
import type { FileResult } from '../scanner.js';

// Helper to create a mock Selector with options
function createSelector(
  name: string,
  options: Array<{ name: string; isActive: boolean }>
): Selector {
  const selector = new Selector(name, 1);
  for (const opt of options) {
    selector.options.push({
      name: opt.name,
      line: 1,
      contentLine: 1,
      content: '',
      isActive: opt.isActive,
    });
  }
  return selector;
}

// Helper to create a mock BlockSelector with options
function createBlockSelector(
  name: string,
  options: Array<{ name: string; isActive: boolean }>
): BlockSelector {
  const selector = new BlockSelector(name, 1);
  for (const opt of options) {
    selector.options.push({
      name: opt.name,
      startLine: 1,
      endLine: 3,
      contentLines: [2],
      isActive: opt.isActive,
    });
  }
  return selector;
}

// Helper to create FileResult
function createFileResult(
  path: string,
  selectors: (Selector | BlockSelector)[]
): FileResult {
  return {
    path,
    selectors,
    content: '',
  };
}

describe('Profile', () => {
  describe('findSelector', () => {
    it('should find selector by name in first file', () => {
      const selector = createSelector('Environment', [
        { name: 'DEV', isActive: true },
      ]);
      const results: FileResult[] = [createFileResult('/path/file.ts', [selector])];

      const found = Profile.findSelector(results, 'Environment');

      expect(found).not.toBeNull();
      expect(found?.selector.name).toBe('Environment');
      expect(found?.file.path).toBe('/path/file.ts');
    });

    it('should find selector in second file', () => {
      const selector1 = createSelector('Theme', [{ name: 'dark', isActive: true }]);
      const selector2 = createSelector('Environment', [{ name: 'DEV', isActive: true }]);
      const results: FileResult[] = [
        createFileResult('/path/file1.ts', [selector1]),
        createFileResult('/path/file2.ts', [selector2]),
      ];

      const found = Profile.findSelector(results, 'Environment');

      expect(found).not.toBeNull();
      expect(found?.file.path).toBe('/path/file2.ts');
    });

    it('should return null when selector not found', () => {
      const selector = createSelector('Theme', [{ name: 'dark', isActive: true }]);
      const results: FileResult[] = [createFileResult('/path/file.ts', [selector])];

      const found = Profile.findSelector(results, 'NonExistent');

      expect(found).toBeNull();
    });

    it('should return null for empty results', () => {
      const found = Profile.findSelector([], 'Environment');

      expect(found).toBeNull();
    });
  });

  describe('computeStatus', () => {
    it('should return fully active when all selectors match', () => {
      const envSelector = createSelector('Environment', [
        { name: 'DEV', isActive: true },
        { name: 'PROD', isActive: false },
      ]);
      const themeSelector = createSelector('Theme', [
        { name: 'dark', isActive: true },
        { name: 'light', isActive: false },
      ]);
      const results: FileResult[] = [
        createFileResult('/path/file.ts', [envSelector, themeSelector]),
      ];

      const profile = new Profile('dev', {
        Environment: 'DEV',
        Theme: 'dark',
      });
      const status = profile.computeStatus(results);

      expect(status.name).toBe('dev');
      expect(status.isFullyActive).toBe(true);
      expect(status.isPartiallyActive).toBe(false);
      expect(status.matchedCount).toBe(2);
      expect(status.totalCount).toBe(2);
    });

    it('should return partially active when some selectors match', () => {
      const envSelector = createSelector('Environment', [
        { name: 'DEV', isActive: true },
        { name: 'PROD', isActive: false },
      ]);
      const themeSelector = createSelector('Theme', [
        { name: 'dark', isActive: false },
        { name: 'light', isActive: true },
      ]);
      const results: FileResult[] = [
        createFileResult('/path/file.ts', [envSelector, themeSelector]),
      ];

      const profile = new Profile('dev', {
        Environment: 'DEV',
        Theme: 'dark',
      });
      const status = profile.computeStatus(results);

      expect(status.isFullyActive).toBe(false);
      expect(status.isPartiallyActive).toBe(true);
      expect(status.matchedCount).toBe(1);
      expect(status.totalCount).toBe(2);
    });

    it('should return inactive when no selectors match', () => {
      const envSelector = createSelector('Environment', [
        { name: 'DEV', isActive: false },
        { name: 'PROD', isActive: true },
      ]);
      const themeSelector = createSelector('Theme', [
        { name: 'dark', isActive: false },
        { name: 'light', isActive: true },
      ]);
      const results: FileResult[] = [
        createFileResult('/path/file.ts', [envSelector, themeSelector]),
      ];

      const profile = new Profile('dev', {
        Environment: 'DEV',
        Theme: 'dark',
      });
      const status = profile.computeStatus(results);

      expect(status.isFullyActive).toBe(false);
      expect(status.isPartiallyActive).toBe(false);
      expect(status.matchedCount).toBe(0);
      expect(status.totalCount).toBe(2);
    });

    it('should handle selector not found', () => {
      const results: FileResult[] = [];

      const profile = new Profile('dev', {
        Environment: 'DEV',
      });
      const status = profile.computeStatus(results);

      expect(status.isFullyActive).toBe(false);
      expect(status.matchedCount).toBe(0);
      expect(status.mappings[0].error).toBe('Selector "Environment" not found');
    });

    it('should handle option not found', () => {
      const selector = createSelector('Environment', [
        { name: 'DEV', isActive: true },
        { name: 'PROD', isActive: false },
      ]);
      const results: FileResult[] = [createFileResult('/path/file.ts', [selector])];

      const profile = new Profile('staging', {
        Environment: 'STAGING',
      });
      const status = profile.computeStatus(results);

      expect(status.isFullyActive).toBe(false);
      expect(status.mappings[0].error).toBe(
        'Option "STAGING" not found in selector "Environment"'
      );
    });

    it('should work with block selectors', () => {
      const blockSelector = createBlockSelector('Database', [
        { name: 'SQLite', isActive: false },
        { name: 'Postgres', isActive: true },
      ]);
      const results: FileResult[] = [createFileResult('/path/.env', [blockSelector])];

      const profile = new Profile('prod', {
        Database: 'Postgres',
      });
      const status = profile.computeStatus(results);

      expect(status.isFullyActive).toBe(true);
      expect(status.matchedCount).toBe(1);
    });
  });

  describe('computeAllStatuses', () => {
    it('should compute status for all profiles', () => {
      const envSelector = createSelector('Environment', [
        { name: 'DEV', isActive: true },
        { name: 'PROD', isActive: false },
      ]);
      const results: FileResult[] = [createFileResult('/path/file.ts', [envSelector])];

      const profiles = {
        dev: { Environment: 'DEV' },
        prod: { Environment: 'PROD' },
      };
      const statuses = Profile.computeAllStatuses(profiles, results);

      expect(statuses).toHaveLength(2);
      expect(statuses[0].name).toBe('dev');
      expect(statuses[0].isFullyActive).toBe(true);
      expect(statuses[1].name).toBe('prod');
      expect(statuses[1].isFullyActive).toBe(false);
    });

    it('should return empty array for empty profiles', () => {
      const statuses = Profile.computeAllStatuses({}, []);

      expect(statuses).toHaveLength(0);
    });
  });

  describe('apply', () => {
    beforeEach(() => {
      vi.resetModules();
    });

    it('should return error for selector not found', async () => {
      const results: FileResult[] = [];

      const profile = new Profile('dev', {
        Environment: 'DEV',
      });
      const applyResults = await profile.apply(results);

      expect(applyResults).toHaveLength(1);
      expect(applyResults[0].success).toBe(false);
      expect(applyResults[0].error).toBe('Selector "Environment" not found');
    });

    it('should return error for option not found', async () => {
      const selector = createSelector('Environment', [
        { name: 'DEV', isActive: true },
        { name: 'PROD', isActive: false },
      ]);
      const results: FileResult[] = [createFileResult('/path/file.ts', [selector])];

      const profile = new Profile('staging', {
        Environment: 'STAGING',
      });
      const applyResults = await profile.apply(results);

      expect(applyResults).toHaveLength(1);
      expect(applyResults[0].success).toBe(false);
      expect(applyResults[0].error).toBe('Option "STAGING" not found. Available: DEV, PROD');
    });
  });
});
