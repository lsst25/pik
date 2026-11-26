import { Command } from 'commander';
import { input, select, confirm } from '@inquirer/prompts';
import pc from 'picocolors';
import { addWorktree, runPostCreate } from '../add.js';
import {
  getCurrentBranch,
  getRepoRoot,
  listBranches,
  branchExists,
  listWorktrees,
} from '../git.js';
import '../types.js';

interface CreateOptions {
  branch?: string;
  new?: boolean;
  yes?: boolean;
  baseDir?: string;
  from?: string;
}

export const createCommand = new Command('create')
  .alias('add')
  .description('Create a new worktree')
  .argument('[name]', 'Name for the worktree directory')
  .option('-b, --branch <branch>', 'Branch to checkout (or create with -n)')
  .option('-n, --new', 'Create a new branch')
  .option('-y, --yes', 'Skip confirmations (for programmatic use)')
  .option('--from <ref>', 'Start point of the new branch (with -n; default: current branch)')
  .option(
    '-d, --base-dir <dir>',
    'Directory to create the worktree in (overrides config baseDir; relative to cwd)'
  )
  .action(async (name: string | undefined, options: CreateOptions) => {
    try {
      const repoRoot = await getRepoRoot();
      const currentBranch = await getCurrentBranch(repoRoot);
      const branches = await listBranches(repoRoot);
      const existingWorktrees = await listWorktrees(repoRoot);

      // Determine branch
      let branch = options.branch;
      let isNewBranch = options.new ?? false;

      if (!branch) {
        const branchAction = await select({
          message: 'What do you want to do?',
          choices: [
            { name: 'Create a new branch', value: 'new' },
            { name: 'Checkout existing branch', value: 'existing' },
          ],
        });

        if (branchAction === 'new') {
          isNewBranch = true;
          branch = await input({
            message: 'New branch name:',
            validate: async (value) => {
              if (!value.trim()) return 'Branch name is required';
              if (await branchExists(value, repoRoot)) return 'Branch already exists';
              return true;
            },
          });
        } else {
          // Filter out branches that already have worktrees
          const worktreeBranches = new Set(
            existingWorktrees.map((w) => w.branch).filter(Boolean)
          );
          const availableBranches = branches.filter(
            (b) => !worktreeBranches.has(b)
          );

          if (availableBranches.length === 0) {
            console.log(pc.yellow('All branches already have worktrees'));
            return;
          }

          branch = await select({
            message: 'Select branch:',
            choices: availableBranches.map((b) => ({
              name: b === currentBranch ? `${b} (current)` : b,
              value: b,
            })),
          });
        }
      }

      // Determine worktree name/path
      let worktreeName = name;
      if (!worktreeName) {
        const defaultName = branch.replace(/\//g, '-');
        worktreeName = await input({
          message: 'Worktree directory name:',
          default: defaultName,
          validate: (value) => {
            if (!value.trim()) return 'Name is required';
            return true;
          },
        });
      }

      if (options.from && !isNewBranch) {
        throw new Error('--from needs --new: it is the start point of the new branch');
      }

      // Create the worktree; the postCreate command comes back so it can be confirmed.
      const { path: worktreePath, pendingPostCreate } = await addWorktree({
        repoRoot,
        name: worktreeName,
        branch,
        newBranch: isNewBranch,
        from: options.from ?? (isNewBranch ? currentBranch : undefined),
        baseDir: options.baseDir,
        postCreate: 'skip',
      });

      if (pendingPostCreate) {
        const shouldRun =
          options.yes ||
          (await confirm({
            message: `Run "${pendingPostCreate}"?`,
            default: true,
          }));

        if (shouldRun) {
          runPostCreate(pendingPostCreate, worktreePath);
        }
      }

      console.log();
      console.log(pc.green('✓ Worktree ready!'));
      console.log(pc.dim(`  cd ${worktreePath}`));
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'ExitPromptError') {
          process.exit(0);
        }
        console.error(pc.red(error.message));
      }
      process.exit(1);
    }
  });
