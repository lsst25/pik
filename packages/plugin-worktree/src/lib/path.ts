import { basename, resolve } from 'path';

export interface WorktreePathOptions {
  /** Base dir from the CLI flag; relative paths resolve against `cwd` */
  baseDir?: string;
  /** Base dir from the config; relative paths resolve against the repo root */
  configBaseDir?: string;
  /** Working directory for a relative CLI base dir (default: process.cwd()) */
  cwd?: string;
}

/**
 * Absolute path of a new worktree: `<baseDir>/<repoName>-<worktreeName>`.
 * The CLI flag wins over the config; the default base dir is '../'.
 */
export function resolveWorktreePath(
  repoRoot: string,
  worktreeName: string,
  options: WorktreePathOptions = {}
): string {
  const dirName = `${basename(repoRoot)}-${worktreeName}`;

  if (options.baseDir) {
    return resolve(options.cwd ?? process.cwd(), options.baseDir, dirName);
  }

  return resolve(repoRoot, options.configBaseDir ?? '../', dirName);
}
