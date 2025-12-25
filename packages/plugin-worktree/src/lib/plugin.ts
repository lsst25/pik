import type { Command } from 'commander';
import type { PikPlugin } from '@lsst/pik-core';
import { createCommand } from './commands/create.js';
import { listCommand } from './commands/list.js';
import { removeCommand } from './commands/remove.js';

export const worktreePlugin: PikPlugin = {
  name: 'Worktree',
  description: 'Manage git worktrees',
  command: 'worktree',
  aliases: ['wt'],

  register(program: Command) {
    const worktreeCmd = program
      .command('worktree')
      .alias('wt')
      .description('Manage git worktrees');

    // Add subcommands
    worktreeCmd.addCommand(createCommand);
    worktreeCmd.addCommand(listCommand);
    worktreeCmd.addCommand(removeCommand);

    // Default action: run create
    worktreeCmd.action(async () => {
      await createCommand.parseAsync([], { from: 'user' });
    });
  },
};
