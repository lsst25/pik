import { Command } from 'commander';
import pc from 'picocolors';
import { relative } from 'path';
import { listWorktrees, getRepoRoot } from '../git.js';

interface ListOptions {
  json?: boolean;
}

export const listCommand = new Command('list')
  .alias('ls')
  .description('List all worktrees')
  .option('--json', 'Output in JSON format')
  .action(async (options: ListOptions) => {
    try {
      const repoRoot = getRepoRoot();
      const worktrees = listWorktrees(repoRoot);

      if (options.json) {
        console.log(JSON.stringify(worktrees, null, 2));
        return;
      }

      if (worktrees.length === 0) {
        console.log(pc.yellow('No worktrees found'));
        return;
      }

      console.log(pc.bold('Worktrees:\n'));

      for (const wt of worktrees) {
        const relativePath = relative(process.cwd(), wt.path) || '.';
        const branchDisplay = wt.branch || pc.dim('(detached)');
        const mainLabel = wt.isMain ? pc.cyan(' [main]') : '';

        console.log(`  ${pc.green(relativePath)}${mainLabel}`);
        console.log(`    Branch: ${branchDisplay}`);
        console.log(`    Commit: ${pc.dim(wt.commit?.slice(0, 7) || 'unknown')}`);
        console.log();
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(pc.red(error.message));
      }
      process.exit(1);
    }
  });
