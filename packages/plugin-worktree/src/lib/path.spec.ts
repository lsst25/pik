import { describe, expect, it } from 'vitest';
import { resolveWorktreePath } from './path.js';

describe('resolveWorktreePath', () => {
  const repoRoot = '/projects/app';

  it('should default to a sibling of the repo root', () => {
    expect(resolveWorktreePath(repoRoot, 'feat')).toBe('/projects/app-feat');
  });

  it('should resolve the config baseDir against the repo root', () => {
    expect(
      resolveWorktreePath(repoRoot, 'feat', { configBaseDir: '../worktrees' })
    ).toBe('/projects/worktrees/app-feat');
  });

  it('should prefer the CLI baseDir over the config baseDir', () => {
    expect(
      resolveWorktreePath(repoRoot, 'feat', {
        baseDir: '/reviews',
        configBaseDir: '../worktrees',
      })
    ).toBe('/reviews/app-feat');
  });

  it('should resolve a relative CLI baseDir against cwd, not the repo root', () => {
    expect(
      resolveWorktreePath(repoRoot, 'feat', {
        baseDir: 'reviews',
        cwd: '/home/me',
      })
    ).toBe('/home/me/reviews/app-feat');
  });
});
