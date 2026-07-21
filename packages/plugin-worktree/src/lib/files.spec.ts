import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { resolve } from 'path';
import { tmpdir } from 'os';
import { copyFiles, linkFiles } from './files.js';

describe('files utilities', () => {
  let root: string;
  let repoRoot: string;
  let worktreePath: string;

  beforeEach(() => {
    root = mkdtempSync(resolve(tmpdir(), 'pik-worktree-'));
    repoRoot = resolve(root, 'repo');
    worktreePath = resolve(root, 'worktree');
    mkdirSync(repoRoot, { recursive: true });
    mkdirSync(worktreePath, { recursive: true });
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  describe('linkFiles', () => {
    it('should create a symlink pointing at the absolute source path', async () => {
      writeFileSync(resolve(repoRoot, '.env.local'), 'SECRET=1');

      const linked = await linkFiles(['.env.local'], repoRoot, worktreePath);

      const dest = resolve(worktreePath, '.env.local');
      expect(linked).toEqual(['.env.local']);
      expect(lstatSync(dest).isSymbolicLink()).toBe(true);
      expect(readlinkSync(dest)).toBe(resolve(repoRoot, '.env.local'));
      // Reading through the link resolves to the source content.
      expect(readFileSync(dest, 'utf8')).toBe('SECRET=1');
    });

    it('should symlink directories and create missing parent dirs', async () => {
      mkdirSync(resolve(repoRoot, '.angular', 'cache'), { recursive: true });
      writeFileSync(resolve(repoRoot, '.angular', 'cache', 'x'), 'cached');

      const linked = await linkFiles(
        ['.angular/cache'],
        repoRoot,
        worktreePath
      );

      const dest = resolve(worktreePath, '.angular', 'cache');
      expect(linked).toEqual(['.angular/cache']);
      expect(lstatSync(dest).isSymbolicLink()).toBe(true);
      expect(readlinkSync(dest)).toBe(resolve(repoRoot, '.angular', 'cache'));
      // The shared dir is readable through the link.
      expect(readFileSync(resolve(dest, 'x'), 'utf8')).toBe('cached');
    });

    it('should skip missing sources without erroring', async () => {
      const linked = await linkFiles(
        ['does-not-exist'],
        repoRoot,
        worktreePath
      );

      expect(linked).toEqual([]);
      expect(existsSync(resolve(worktreePath, 'does-not-exist'))).toBe(false);
    });

    it('should skip and report a destination that already exists', async () => {
      writeFileSync(resolve(repoRoot, 'shared'), 'source');
      // Simulate a file already placed by copyFiles.
      writeFileSync(resolve(worktreePath, 'shared'), 'already here');

      const skipped: string[] = [];
      const linked = await linkFiles(
        ['shared'],
        repoRoot,
        worktreePath,
        () => undefined,
        (match) => skipped.push(match)
      );

      const dest = resolve(worktreePath, 'shared');
      expect(linked).toEqual([]);
      expect(skipped).toEqual(['shared']);
      // The existing file was left untouched (not replaced by a symlink).
      expect(lstatSync(dest).isSymbolicLink()).toBe(false);
      expect(readFileSync(dest, 'utf8')).toBe('already here');
    });

    it('should invoke the onLinked reporter for each linked match', async () => {
      writeFileSync(resolve(repoRoot, 'a'), 'a');
      writeFileSync(resolve(repoRoot, 'b'), 'b');

      const reported: string[] = [];
      await linkFiles(['a', 'b'], repoRoot, worktreePath, (m) =>
        reported.push(m)
      );

      expect(reported.sort()).toEqual(['a', 'b']);
    });
  });

  describe('copyFiles', () => {
    it('should copy a file as an independent copy (not a symlink)', async () => {
      writeFileSync(resolve(repoRoot, '.env.local'), 'SECRET=1');

      const copied = await copyFiles(['.env.local'], repoRoot, worktreePath);

      const dest = resolve(worktreePath, '.env.local');
      expect(copied).toEqual(['.env.local']);
      expect(lstatSync(dest).isSymbolicLink()).toBe(false);
      expect(readFileSync(dest, 'utf8')).toBe('SECRET=1');
    });

    it('should copy directories recursively', async () => {
      mkdirSync(resolve(repoRoot, 'nested', 'deep'), { recursive: true });
      writeFileSync(resolve(repoRoot, 'nested', 'deep', 'f'), 'content');

      const copied = await copyFiles(['nested'], repoRoot, worktreePath);

      const dest = resolve(worktreePath, 'nested', 'deep', 'f');
      expect(copied).toEqual(['nested']);
      expect(existsSync(dest)).toBe(true);
      expect(readFileSync(dest, 'utf8')).toBe('content');
    });

    it('should skip missing sources without erroring', async () => {
      const copied = await copyFiles(['nope'], repoRoot, worktreePath);
      expect(copied).toEqual([]);
    });
  });
});
