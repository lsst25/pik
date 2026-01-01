import { Command } from 'commander';
import { input, select, confirm } from '@inquirer/prompts';
import pc from 'picocolors';
import { resolve, basename } from 'path';
import { execSync } from 'child_process';
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { glob } from 'glob';
import { loadConfig } from '@lsst/pik-core';
import {
  createWorktree,
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
}

export const createCommand = new Command('create')
  .alias('add')
  .description('Create a new worktree')
  .argument('[name]', 'Name for the worktree directory')
  .option('-b, --branch <branch>', 'Branch to checkout (or create with -n)')
  .option('-n, --new', 'Create a new branch')
  .option('-y, --yes', 'Skip confirmations (for programmatic use)')
  .action(async (name: string | undefined, options: CreateOptions) => {
    try {
      const repoRoot = await getRepoRoot();
      const config = await loadConfig(repoRoot);
      const worktreeConfig = config?.worktree ?? {};

      const currentBranch = await getCurrentBranch(repoRoot);
      const branches = await listBranches(repoRoot);
      const existingWorktrees = await listWorktrees(repoRoot);
      const existingPaths = new Set(existingWorktrees.map((w) => w.path));

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

      // Calculate path
      const baseDir = worktreeConfig.baseDir ?? '../';
      const repoName = basename(repoRoot);
      const worktreePath = resolve(repoRoot, baseDir, `${repoName}-${worktreeName}`);

      if (existingPaths.has(worktreePath) || existsSync(worktreePath)) {
        console.error(pc.red(`Path already exists: ${worktreePath}`));
        process.exit(1);
      }

      // Create worktree
      console.log(pc.dim(`Creating worktree at ${worktreePath}...`));
      await createWorktree(
        worktreePath,
        branch,
        { newBranch: isNewBranch, baseBranch: currentBranch },
        repoRoot
      );
      console.log(pc.green(`✓ Created worktree for branch ${pc.bold(branch)}`));

      // Copy files if configured
      if (worktreeConfig.copyFiles?.length) {
        console.log(pc.dim('Copying files...'));
        for (const pattern of worktreeConfig.copyFiles) {
          const files = await glob(pattern, { cwd: repoRoot, nodir: true });
          for (const file of files) {
            const src = resolve(repoRoot, file);
            const dest = resolve(worktreePath, file);
            const destDir = resolve(dest, '..');

            if (!existsSync(destDir)) {
              mkdirSync(destDir, { recursive: true });
            }

            if (existsSync(src)) {
              copyFileSync(src, dest);
              console.log(pc.dim(`  Copied ${file}`));
            }
          }
        }
      }

      // Run post-create command if configured
      if (worktreeConfig.postCreate) {
        const shouldRun =
          options.yes ||
          (await confirm({
            message: `Run "${worktreeConfig.postCreate}"?`,
            default: true,
          }));

        if (shouldRun) {
          console.log(pc.dim(`Running: ${worktreeConfig.postCreate}`));
          try {
            execSync(worktreeConfig.postCreate, {
              cwd: worktreePath,
              stdio: 'inherit',
            });
            console.log(pc.green('✓ Post-create command completed'));
          } catch {
            console.log(pc.yellow('⚠ Post-create command failed'));
          }
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
