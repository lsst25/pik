import type { Command } from 'commander';
import type { PikPlugin } from '@lsst/pik-core';
import { listCommand } from './commands/list.js';
import { setCommand } from './commands/set.js';
import { switchCommand } from './commands/switch.js';

export const selectPlugin: PikPlugin = {
  name: 'Select',
  description: 'Switch config options using @pik markers',
  command: 'select',
  aliases: ['sel'],

  register(program: Command) {
    const selectCmd = program
      .command('select')
      .alias('sel')
      .description('Switch config options using @pik markers');

    // Add subcommands
    selectCmd.addCommand(listCommand);
    selectCmd.addCommand(setCommand);
    selectCmd.addCommand(switchCommand);

    // Default action: run interactive switch
    selectCmd.action(async () => {
      await switchCommand.parseAsync([], { from: 'user' });
    });

    // Add backward-compatible top-level aliases (hidden from help)
    // This allows `pik list` instead of `pik select list`
    program.addCommand(listCommand.copyInheritedSettings(program), { hidden: true });
    program.addCommand(setCommand.copyInheritedSettings(program), { hidden: true });
    program.addCommand(switchCommand.copyInheritedSettings(program), { hidden: true });
  },
};
