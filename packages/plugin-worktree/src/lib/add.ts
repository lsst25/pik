import { execSync } from 'child_process';
import { existsSync } from 'fs';
import pc from 'picocolors';
import { loadConfig } from '@lsst/pik-core';
import { copyFiles, linkFiles } from './files.js';
import { createWorktree, listWorktrees } from './git.js';
import { resolveWorktreePath } from './path.js';
import type { WorktreeConfig } from './types.js';

export interface AddWorktreeOptions {
  /** Main clone of the repository (its pik config supplies copyFiles/linkFiles/postCreate) */
  repoRoot: string;
  /** Worktree name; the directory is `<repoName>-<name>` */
  name: string;
  /** Branch to check out, or to create with `newBranch` */
  branch: string;
  /** Create `branch` instead of checking out an existing one */
  newBranch?: boolean;
  /** Start point for a new branch (default: the current HEAD of `repoRoot`) */
  from?: string;
  /** Directory for the worktree; overrides the config baseDir; relative to `cwd` */
  baseDir?: string;
  /** Working directory for a relative `baseDir` (default: process.cwd()) */
  cwd?: string;
  /**
   * What to do with the configured postCreate command:
   * - 'run' (default): run it in the new worktree
   * - 'skip': do not run it; the caller gets it back in the result to run elsewhere
   */
  postCreate?: 'run' | 'skip';
  /** Progress output (default: console.log) */
  log?: (message: string) => void;
}

export interface AddWorktreeResult {
  /** Absolute path of the new worktree */
  path: string;
  /** The configured postCreate command when it was not run (postCreate: 'skip') */
  pendingPostCreate?: string;
}

/**
 * Create a worktree and set it up from the repo's pik config: copy files, link
 * files, then run (or hand back) the postCreate command. Throws on failure.
 */
export async function addWorktree(
  options: AddWorktreeOptions
): Promise<AddWorktreeResult> {
  const log = options.log ?? ((message: string) => console.log(message));
  const config = await loadConfig(options.repoRoot);
  const worktreeConfig = (config?.worktree ?? {}) as WorktreeConfig;

  const worktreePath = resolveWorktreePath(options.repoRoot, options.name, {
    baseDir: options.baseDir,
    configBaseDir: worktreeConfig.baseDir,
    cwd: options.cwd,
  });

  const existing = await listWorktrees(options.repoRoot);
  if (existing.some((w) => w.path === worktreePath) || existsSync(worktreePath)) {
    throw new Error(`Path already exists: ${worktreePath}`);
  }

  log(pc.dim(`Creating worktree at ${worktreePath}...`));
  await createWorktree(
    worktreePath,
    options.branch,
    { newBranch: options.newBranch, baseBranch: options.from },
    options.repoRoot
  );
  log(pc.green(`✓ Created worktree for branch ${pc.bold(options.branch)}`));

  if (worktreeConfig.copyFiles?.length) {
    log(pc.dim('Copying files...'));
    await copyFiles(worktreeConfig.copyFiles, options.repoRoot, worktreePath, (match) =>
      log(pc.dim(`  Copied ${match}`))
    );
  }

  // Symlink files/dirs if configured (shared with main repo to save disk).
  // Runs after copyFiles so a shared path already copied is left untouched,
  // and before postCreate so shared deps/caches are in place first.
  if (worktreeConfig.linkFiles?.length) {
    log(pc.dim('Linking files...'));
    await linkFiles(
      worktreeConfig.linkFiles,
      options.repoRoot,
      worktreePath,
      (match) => log(pc.dim(`  Linked ${match}`)),
      (match) => log(pc.dim(`  Skipped ${match} (already exists)`))
    );
  }

  if (!worktreeConfig.postCreate) {
    return { path: worktreePath };
  }

  if (options.postCreate === 'skip') {
    return { path: worktreePath, pendingPostCreate: worktreeConfig.postCreate };
  }

  runPostCreate(worktreeConfig.postCreate, worktreePath, log);
  return { path: worktreePath };
}

/**
 * Run a postCreate command in a worktree. A failure is reported, not thrown:
 * the worktree itself is ready.
 */
export function runPostCreate(
  command: string,
  worktreePath: string,
  log: (message: string) => void = (message) => console.log(message)
): boolean {
  log(pc.dim(`Running: ${command}`));
  try {
    execSync(command, { cwd: worktreePath, stdio: 'inherit' });
    log(pc.green('✓ Post-create command completed'));
    return true;
  } catch {
    log(pc.yellow('⚠ Post-create command failed'));
    return false;
  }
}
