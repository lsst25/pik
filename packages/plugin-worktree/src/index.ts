// Plugin export
export { worktreePlugin } from './lib/plugin.js';

// Types
export type { WorktreeConfig } from './lib/types.js';

// Git utilities (for potential reuse)
export {
  git,
  getRepoRoot,
  getCurrentBranch,
  isClean,
  listWorktrees,
  createWorktree,
  removeWorktree,
  listBranches,
  branchExists,
  type Worktree,
} from './lib/git.js';
