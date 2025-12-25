// Plugin export
export { worktreePlugin } from './lib/plugin.js';

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
