import { simpleGit, SimpleGit } from 'simple-git';

export interface Worktree {
  path: string;
  branch: string;
  commit: string;
  isBare: boolean;
  isMain: boolean;
}

/**
 * Get a simple-git instance for the given directory
 */
export function getGit(cwd?: string): SimpleGit {
  return simpleGit(cwd);
}

/**
 * Get the root directory of the git repository
 */
export async function getRepoRoot(cwd?: string): Promise<string> {
  const git = getGit(cwd);
  return (await git.revparse(['--show-toplevel'])).trim();
}

/**
 * Get the current branch name
 */
export async function getCurrentBranch(cwd?: string): Promise<string> {
  const git = getGit(cwd);
  return (await git.revparse(['--abbrev-ref', 'HEAD'])).trim();
}

/**
 * Check if working directory is clean
 */
export async function isClean(cwd?: string): Promise<boolean> {
  const git = getGit(cwd);
  const status = await git.status();
  return status.isClean();
}

/**
 * List all worktrees
 */
export async function listWorktrees(cwd?: string): Promise<Worktree[]> {
  const git = getGit(cwd);
  const output = await git.raw(['worktree', 'list', '--porcelain']);
  if (!output) return [];

  const worktrees: Worktree[] = [];
  let current: Partial<Worktree> = {};

  for (const line of output.split('\n')) {
    if (line.startsWith('worktree ')) {
      if (current.path) {
        worktrees.push(current as Worktree);
      }
      current = { path: line.slice(9), isBare: false, isMain: false };
    } else if (line.startsWith('HEAD ')) {
      current.commit = line.slice(5);
    } else if (line.startsWith('branch ')) {
      current.branch = line.slice(7).replace('refs/heads/', '');
    } else if (line === 'bare') {
      current.isBare = true;
    } else if (line === '') {
      // Mark first worktree as main
      if (worktrees.length === 0 && current.path) {
        current.isMain = true;
      }
    }
  }

  if (current.path) {
    if (worktrees.length === 0) {
      current.isMain = true;
    }
    worktrees.push(current as Worktree);
  }

  return worktrees;
}

/**
 * Create a new worktree
 */
export async function createWorktree(
  path: string,
  branch: string,
  options?: { newBranch?: boolean; baseBranch?: string },
  cwd?: string
): Promise<void> {
  const git = getGit(cwd);
  const args = ['worktree', 'add'];

  if (options?.newBranch) {
    args.push('-b', branch);
    args.push(path);
    if (options.baseBranch) {
      args.push(options.baseBranch);
    }
  } else {
    args.push(path, branch);
  }

  await git.raw(args);
}

/**
 * Remove a worktree
 */
export async function removeWorktree(
  path: string,
  force?: boolean,
  cwd?: string
): Promise<void> {
  const git = getGit(cwd);
  const args = ['worktree', 'remove'];
  if (force) {
    args.push('--force');
  }
  args.push(path);
  await git.raw(args);
}

/**
 * Get list of local branches
 */
export async function listBranches(cwd?: string): Promise<string[]> {
  const git = getGit(cwd);
  const result = await git.branchLocal();
  return result.all;
}

/**
 * Check if a branch exists
 */
export async function branchExists(
  branch: string,
  cwd?: string
): Promise<boolean> {
  const git = getGit(cwd);
  try {
    await git.revparse(['--verify', branch]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete a branch
 */
export async function deleteBranch(
  branch: string,
  force?: boolean,
  cwd?: string
): Promise<void> {
  const git = getGit(cwd);
  if (force) {
    await git.branch(['-D', branch]);
  } else {
    await git.branch(['-d', branch]);
  }
}

/**
 * Check if path is inside a git worktree
 */
export async function isWorktree(path: string): Promise<boolean> {
  const git = getGit(path);
  try {
    const gitDir = await git.revparse(['--git-dir']);
    // If .git is a file (not directory), it's a worktree
    return gitDir.includes('.git/worktrees/');
  } catch {
    return false;
  }
}
