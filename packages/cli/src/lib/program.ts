import { Command } from 'commander';
import pkg from '../../package.json' with { type: 'json' };
import { listCommand } from './commands/list.js';
import { setCommand } from './commands/set.js';
import { switchCommand } from './commands/switch.js';

export const program = new Command()
  .name(pkg.name)
  .description(pkg.description)
  .version(pkg.version);

program.addCommand(listCommand);
program.addCommand(setCommand);
program.addCommand(switchCommand);

// Default command: interactive switch
program.action(async () => {
  await switchCommand.parseAsync([]);
});
