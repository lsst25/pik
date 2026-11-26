import { describe, it, expect } from 'vitest';
import { execFileSync } from 'child_process';
import { mkdtempSync, realpathSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  getGit,
  getRepoRoot,
  getCurrentBranch,
  listWorktrees,
  listBranches,
  branchExists,
  createWorktree,
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

  describe('createWorktree', () => {
    it('should not track the start point of a new branch', async () => {
      const root = realpathSync(mkdtempSync(join(tmpdir(), 'pik-wt-')));
      const run = (cwd: string, ...args: string[]) =>
        execFileSync('git', args, { cwd, encoding: 'utf-8' }).trim();
      try {
        const origin = join(root, 'origin');
        const clone = join(root, 'app');
        run(root, 'init', '--quiet', '--initial-branch=develop', origin);
        run(
          origin,
          '-c',
          'user.name=t',
          '-c',
          'user.email=t@t',
          'commit',
          '--quiet',
          '--allow-empty',
          '-m',
          'init',
        );
        run(root, 'clone', '--quiet', origin, clone);

        await createWorktree(
          join(root, 'app-x'),
          'feature/x',
          { newBranch: true, baseBranch: 'origin/develop' },
          clone,
        );

        expect(() =>
          run(clone, 'rev-parse', '--abbrev-ref', 'feature/x@{upstream}'),
        ).toThrow();
        expect(run(clone, 'rev-parse', 'feature/x')).toBe(
          run(clone, 'rev-parse', 'origin/develop'),
        );
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
    });
  });
});
