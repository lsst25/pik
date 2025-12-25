/**
 * Configuration for the worktree plugin
 */
export interface WorktreeConfig {
  /** Directory where worktrees will be created (relative to repo root, default: '../') */
  baseDir?: string;
  /** Files to copy to new worktrees (supports globs) */
  copyFiles?: string[];
  /** Command to run after creating worktree (e.g., 'npm install') */
  postCreate?: string;
}

/**
 * Extend PikConfig to include worktree plugin config
 */
declare module '@lsst/pik-core' {
  interface PikConfig {
    worktree?: WorktreeConfig;
  }
}
