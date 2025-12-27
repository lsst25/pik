import { Command } from 'commander';
import { select, confirm } from '@inquirer/prompts';
import pc from 'picocolors';
import { relative } from 'path';
import { listWorktrees, removeWorktree, getRepoRoot, deleteBranch } from '../git.js';

interface RemoveOptions {
  force?: boolean;
  deleteBranch?: boolean;
}

export const removeCommand = new Command('remove')
  .alias('rm')
  .description('Remove a worktree')
  .argument('[path]', 'Path to the worktree to remove')
  .option('-f, --force', 'Force removal even if worktree is dirty')
  .option('-D, --delete-branch', 'Also delete the branch')
  .action(async (pathArg: string | undefined, options: RemoveOptions) => {
    try {
      const repoRoot = await getRepoRoot();
      const worktrees = await listWorktrees(repoRoot);

      // Filter out main worktree
      const removableWorktrees = worktrees.filter((w) => !w.isMain);

      if (removableWorktrees.length === 0) {
        console.log(pc.yellow('No removable worktrees found'));
        return;
      }

      let targetPath = pathArg;
      let targetWorktree = removableWorktrees.find((w) => w.path === targetPath);

      if (!targetPath) {
        // Interactive selection
        const selected = await select({
          message: 'Select worktree to remove:',
          choices: removableWorktrees.map((wt) => {
            const relativePath = relative(process.cwd(), wt.path) || wt.path;
            return {
              name: `${relativePath} (${wt.branch || 'detached'})`,
              value: wt,
            };
          }),
        });

        targetWorktree = selected;
        targetPath = selected.path;
      }

      if (!targetWorktree) {
        // Try to find by relative path
        targetWorktree = removableWorktrees.find((w) => {
          const rel = relative(process.cwd(), w.path);
          return rel === targetPath || w.path.endsWith(targetPath!);
        });

        if (!targetWorktree) {
          console.error(pc.red(`Worktree not found: ${targetPath}`));
          process.exit(1);
        }
      }

      const relativePath = relative(process.cwd(), targetWorktree.path);
      const shouldRemove = await confirm({
        message: `Remove worktree ${pc.bold(relativePath)}?`,
        default: false,
      });

      if (!shouldRemove) {
        console.log(pc.dim('Cancelled'));
        return;
      }

      // Remove worktree
      console.log(pc.dim('Removing worktree...'));
      await removeWorktree(targetWorktree.path, options.force, repoRoot);
      console.log(pc.green(`✓ Removed worktree ${relativePath}`));

      // Optionally delete branch
      if (options.deleteBranch && targetWorktree.branch) {
        const shouldDeleteBranch = await confirm({
          message: `Also delete branch ${pc.bold(targetWorktree.branch)}?`,
          default: false,
        });

        if (shouldDeleteBranch) {
          try {
            await deleteBranch(targetWorktree.branch, true, repoRoot);
            console.log(pc.green(`✓ Deleted branch ${targetWorktree.branch}`));
          } catch (error) {
            if (error instanceof Error) {
              console.log(pc.yellow(`⚠ Could not delete branch: ${error.message}`));
            }
          }
        }
      }
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
