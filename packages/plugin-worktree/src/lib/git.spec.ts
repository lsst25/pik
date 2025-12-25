import { describe, it, expect } from 'vitest';
import {
  getGit,
  getRepoRoot,
  getCurrentBranch,
  listWorktrees,
  listBranches,
  branchExists,
  isClean,
} from './git.js';

describe('git utilities', () => {
  describe('getGit', () => {
    it('should return a SimpleGit instance', () => {
      const git = getGit();
      expect(git).toBeDefined();
      expect(typeof git.status).toBe('function');
    });
  });

  describe('getRepoRoot', () => {
    it('should return the repository root path', async () => {
      const root = await getRepoRoot();
      expect(root).toMatch(/pik$/);
    });
  });

  describe('getCurrentBranch', () => {
    it('should return current branch name', async () => {
      const branch = await getCurrentBranch();
      expect(typeof branch).toBe('string');
      expect(branch.length).toBeGreaterThan(0);
    });
  });

  describe('listBranches', () => {
    it('should return array of branch names', async () => {
      const branches = await listBranches();
      expect(Array.isArray(branches)).toBe(true);
      expect(branches.length).toBeGreaterThan(0);
      // Should include main branch
      expect(branches).toContain('main');
    });

    it('should return clean branch names without refs/heads prefix', async () => {
      const branches = await listBranches();
      branches.forEach((branch) => {
        expect(typeof branch).toBe('string');
        expect(branch).not.toContain('refs/heads/');
      });
    });
  });

  describe('branchExists', () => {
    it('should return true for existing branch', async () => {
      expect(await branchExists('main')).toBe(true);
    });

    it('should return false for non-existing branch', async () => {
      expect(await branchExists('this-branch-does-not-exist-xyz')).toBe(false);
    });
  });

  describe('listWorktrees', () => {
    it('should return array of worktrees', async () => {
      const worktrees = await listWorktrees();
      expect(Array.isArray(worktrees)).toBe(true);
      expect(worktrees.length).toBeGreaterThan(0);
    });

    it('should mark first worktree as main', async () => {
      const worktrees = await listWorktrees();
      expect(worktrees[0].isMain).toBe(true);
    });

    it('should include branch and commit info', async () => {
      const worktrees = await listWorktrees();
      const mainWorktree = worktrees[0];
      expect(mainWorktree.branch).toBeDefined();
      expect(mainWorktree.commit).toBeDefined();
      expect(mainWorktree.path).toBeDefined();
    });
  });

  describe('isClean', () => {
    it('should return boolean', async () => {
      const result = await isClean();
      expect(typeof result).toBe('boolean');
    });
  });
});
