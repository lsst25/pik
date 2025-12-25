import { describe, it, expect } from 'vitest';
import {
  git,
  getRepoRoot,
  getCurrentBranch,
  listWorktrees,
  listBranches,
  branchExists,
  isClean,
} from './git.js';

describe('git utilities', () => {
  describe('git', () => {
    it('should execute basic git commands', () => {
      const result = git(['--version']);
      expect(result).toMatch(/^git version/);
    });

    it('should handle arguments with special shell characters', () => {
      // This was failing before with execSync due to shell interpretation of ()
      const branches = git(['branch', '--format=%(refname:short)']);
      expect(typeof branches).toBe('string');
    });

    it('should throw on invalid git command', () => {
      expect(() => git(['invalid-command-xyz'])).toThrow();
    });
  });

  describe('getRepoRoot', () => {
    it('should return the repository root path', () => {
      const root = getRepoRoot();
      expect(root).toMatch(/pik$/);
    });
  });

  describe('getCurrentBranch', () => {
    it('should return current branch name', () => {
      const branch = getCurrentBranch();
      expect(typeof branch).toBe('string');
      expect(branch.length).toBeGreaterThan(0);
    });
  });

  describe('listBranches', () => {
    it('should return array of branch names', () => {
      const branches = listBranches();
      expect(Array.isArray(branches)).toBe(true);
      expect(branches.length).toBeGreaterThan(0);
      // Should include main branch
      expect(branches).toContain('main');
    });

    it('should handle format string with special characters', () => {
      // Specifically tests that %(refname:short) doesn't cause shell issues
      const branches = listBranches();
      branches.forEach((branch) => {
        expect(typeof branch).toBe('string');
        expect(branch).not.toContain('refs/heads/');
      });
    });
  });

  describe('branchExists', () => {
    it('should return true for existing branch', () => {
      expect(branchExists('main')).toBe(true);
    });

    it('should return false for non-existing branch', () => {
      expect(branchExists('this-branch-does-not-exist-xyz')).toBe(false);
    });
  });

  describe('listWorktrees', () => {
    it('should return array of worktrees', () => {
      const worktrees = listWorktrees();
      expect(Array.isArray(worktrees)).toBe(true);
      expect(worktrees.length).toBeGreaterThan(0);
    });

    it('should mark first worktree as main', () => {
      const worktrees = listWorktrees();
      expect(worktrees[0].isMain).toBe(true);
    });

    it('should include branch and commit info', () => {
      const worktrees = listWorktrees();
      const mainWorktree = worktrees[0];
      expect(mainWorktree.branch).toBeDefined();
      expect(mainWorktree.commit).toBeDefined();
      expect(mainWorktree.path).toBeDefined();
    });
  });

  describe('isClean', () => {
    it('should return boolean', () => {
      const result = isClean();
      expect(typeof result).toBe('boolean');
    });
  });
});
