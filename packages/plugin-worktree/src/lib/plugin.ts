import type { Command } from 'commander';
import { select, Separator } from '@inquirer/prompts';
import pc from 'picocolors';
import type { PikPlugin } from '@lsst/pik-core';
import { createCommand } from './commands/create.js';
import { listCommand } from './commands/list.js';
import { removeCommand } from './commands/remove.js';

const BACK_VALUE = Symbol('back');

type MenuAction = 'create' | 'list' | 'remove' | typeof BACK_VALUE;

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

    // Default action: show interactive menu
    worktreeCmd.action(async () => {
      while (true) {
        let action: MenuAction;

        try {
          action = await select({
            message: 'Worktree actions',
            choices: [
              { name: 'Create worktree', value: 'create' as MenuAction },
              { name: 'List worktrees', value: 'list' as MenuAction },
              { name: 'Remove worktree', value: 'remove' as MenuAction },
              new Separator(),
              { name: pc.dim('← Back'), value: BACK_VALUE as MenuAction },
            ],
          });
        } catch (error) {
          // Handle Ctrl+C
          if (error instanceof Error && error.name === 'ExitPromptError') {
            return;
          }
          throw error;
        }

        if (action === BACK_VALUE) {
          return;
        }

        switch (action) {
          case 'create':
            await createCommand.parseAsync([], { from: 'user' });
            break;
          case 'list':
            await listCommand.parseAsync([], { from: 'user' });
            break;
          case 'remove':
            await removeCommand.parseAsync([], { from: 'user' });
            break;
        }
      }
    });
  },
};
