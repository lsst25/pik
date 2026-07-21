import { resolve } from 'path';
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  statSync,
  symlinkSync,
} from 'fs';
import { glob } from 'glob';

/** Report progress for a single processed match (relative path). */
export type MatchReporter = (match: string) => void;

/**
 * Copy files/dirs matching the given glob patterns from `repoRoot` into
 * `worktreePath`, preserving their relative location. Directories are copied
 * recursively.
 *
 * - Missing sources are skipped.
 *
 * @returns the relative paths that were copied.
 */
export async function copyFiles(
  patterns: string[],
  repoRoot: string,
  worktreePath: string,
  onCopied: MatchReporter = () => undefined
): Promise<string[]> {
  const copied: string[] = [];

  for (const pattern of patterns) {
    const matches = await glob(pattern, { cwd: repoRoot });
    for (const match of matches) {
      const src = resolve(repoRoot, match);
      const dest = resolve(worktreePath, match);
      const destDir = resolve(dest, '..');

      if (!existsSync(src)) continue;

      if (!existsSync(destDir)) {
        mkdirSync(destDir, { recursive: true });
      }

      if (statSync(src).isDirectory()) {
        cpSync(src, dest, { recursive: true });
      } else {
        copyFileSync(src, dest);
      }

      onCopied(match);
      copied.push(match);
    }
  }

  return copied;
}

/**
 * Symlink files/dirs matching the given glob patterns from `repoRoot` into
 * `worktreePath`. Each symlink targets the **absolute** source path in the
 * main repo so it survives the worktree living in a different directory.
 *
 * - Missing sources are skipped (parity with {@link copyFiles}).
 * - Existing destinations are skipped, so a path already placed by
 *   {@link copyFiles} is never clobbered.
 *
 * @returns the relative paths that were linked.
 */
export async function linkFiles(
  patterns: string[],
  repoRoot: string,
  worktreePath: string,
  onLinked: MatchReporter = () => undefined,
  onSkipped: MatchReporter = () => undefined
): Promise<string[]> {
  const linked: string[] = [];

  for (const pattern of patterns) {
    const matches = await glob(pattern, { cwd: repoRoot });
    for (const match of matches) {
      // Target is the absolute source path so the link survives the worktree
      // living in a different directory.
      const src = resolve(repoRoot, match);
      const dest = resolve(worktreePath, match);
      const destDir = resolve(dest, '..');

      if (!existsSync(src)) continue;

      // Don't clobber anything already placed (e.g. by copyFiles).
      if (existsSync(dest)) {
        onSkipped(match);
        continue;
      }

      if (!existsSync(destDir)) {
        mkdirSync(destDir, { recursive: true });
      }

      symlinkSync(src, dest, statSync(src).isDirectory() ? 'dir' : 'file');
      onLinked(match);
      linked.push(match);
    }
  }

  return linked;
}
