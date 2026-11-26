// Plugin export
export { worktreePlugin } from './lib/plugin.js';

// Worktree setup (for reuse by other plugins)
export {
  addWorktree,
  runPostCreate,
  type AddWorktreeOptions,
  type AddWorktreeResult,
} from './lib/add.js';
export { resolveWorktreePath, type WorktreePathOptions } from './lib/path.js';

// Types
export type { WorktreeConfig } from './lib/types.js';

// Git utilities (for potential reuse)
export {
  getGit,
  getRepoRoot,
  getCurrentBranch,
  isClean,
  listWorktrees,
  createWorktree,
  removeWorktree,
  listBranches,
  branchExists,
  deleteBranch,
  isWorktree,
  type Worktree,
} from './lib/git.js';
