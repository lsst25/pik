import { execFileSync, spawn } from 'child_process';

export interface Worktree {
  path: string;
  branch: string;
  commit: string;
  isBare: boolean;
  isMain: boolean;
}

export interface GitError extends Error {
  stderr?: string;
}

/**
 * Execute a git command and return stdout
 */
export function git(args: string[], cwd?: string): string {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    const err = error as { stderr?: Buffer; message: string };
    const gitError: GitError = new Error(
      err.stderr?.toString().trim() || err.message
    );
    gitError.stderr = err.stderr?.toString();
    throw gitError;
  }
}

/**
 * Execute a git command asynchronously with live output
 */
export function gitAsync(
  args: string[],
  cwd?: string
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const proc = spawn('git', args, {
      cwd,
      stdio: ['inherit', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
      process.stdout.write(data);
    });

    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
      process.stderr.write(data);
    });

    proc.on('close', (code) => {
      resolve({ code: code ?? 0, stdout, stderr });
    });
  });
}

/**
 * Get the root directory of the git repository
 */
export function getRepoRoot(cwd?: string): string {
  return git(['rev-parse', '--show-toplevel'], cwd);
}

/**
 * Get the current branch name
 */
export function getCurrentBranch(cwd?: string): string {
  return git(['rev-parse', '--abbrev-ref', 'HEAD'], cwd);
}

/**
 * Check if working directory is clean
 */
export function isClean(cwd?: string): boolean {
  const status = git(['status', '--porcelain'], cwd);
  return status === '';
}

/**
 * List all worktrees
 */
export function listWorktrees(cwd?: string): Worktree[] {
  const output = git(['worktree', 'list', '--porcelain'], cwd);
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
export function createWorktree(
  path: string,
  branch: string,
  options?: { newBranch?: boolean; baseBranch?: string },
  cwd?: string
): void {
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

  git(args, cwd);
}

/**
 * Remove a worktree
 */
export function removeWorktree(path: string, force?: boolean, cwd?: string): void {
  const args = ['worktree', 'remove'];
  if (force) {
    args.push('--force');
  }
  args.push(path);
  git(args, cwd);
}

/**
 * Get list of local branches
 */
export function listBranches(cwd?: string): string[] {
  const output = git(['branch', '--format=%(refname:short)'], cwd);
  return output.split('\n').filter(Boolean);
}

/**
 * Check if a branch exists
 */
export function branchExists(branch: string, cwd?: string): boolean {
  try {
    git(['rev-parse', '--verify', branch], cwd);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if path is inside a git worktree
 */
export function isWorktree(path: string): boolean {
  try {
    const gitDir = git(['rev-parse', '--git-dir'], path);
    // If .git is a file (not directory), it's a worktree
    return gitDir.includes('.git/worktrees/');
  } catch {
    return false;
  }
}
