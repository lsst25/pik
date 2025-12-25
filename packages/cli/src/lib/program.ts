import { Command } from 'commander';
import { select, Separator } from '@inquirer/prompts';
import pc from 'picocolors';
import { loadConfig, type PikPlugin } from '@lsst/pik-core';
import { selectPlugin } from '@lsst/pik-plugin-select';
import { worktreePlugin } from '@lsst/pik-plugin-worktree';
import pkg from '../../package.json' with { type: 'json' };

// List of all available plugins
const allPlugins: PikPlugin[] = [selectPlugin, worktreePlugin];

/**
 * Get plugins that are enabled in the config.
 * A plugin is enabled if its command key exists in the config (even as empty object).
 */
async function getEnabledPlugins(): Promise<PikPlugin[]> {
  const config = await loadConfig();

  if (!config) {
    // No config - no plugins enabled for interactive mode
    return [];
  }

  return allPlugins.filter((plugin) => plugin.command in config);
}

export const program = new Command()
  .name(pkg.name)
  .description(pkg.description)
  .version(pkg.version);

/**
 * Initialize the program by loading config and registering enabled plugins.
 */
export async function initializeProgram(): Promise<PikPlugin[]> {
  const plugins = await getEnabledPlugins();

  // Register only enabled plugins
  for (const plugin of plugins) {
    plugin.register(program);
  }

  // Default action: show main menu with enabled plugins
  program.action(async () => {
    if (plugins.length === 0) {
      console.log(pc.yellow('No plugins configured.'));
      console.log(pc.dim('Add plugin config to pik.config.ts to enable plugins.'));
      console.log(pc.dim('Example: { select: {}, worktree: {} }'));
      return;
    }

    if (plugins.length === 1) {
      // Single plugin - run its default command
      const plugin = plugins[0];
      const cmd = program.commands.find((c) => c.name() === plugin.command);
      if (cmd) {
        await cmd.parseAsync([], { from: 'user' });
      }
    } else {
      // Multiple plugins - show selection menu in a loop
      const EXIT_VALUE = Symbol('exit');

      while (true) {
        let selectedPlugin: PikPlugin | typeof EXIT_VALUE;

        try {
          selectedPlugin = await select({
            message: 'Select a tool',
            choices: [
              ...plugins.map((plugin) => ({
                name: `${pc.bold(plugin.name)} - ${plugin.description}`,
                value: plugin as PikPlugin | typeof EXIT_VALUE,
              })),
              new Separator(),
              { name: pc.dim('Exit'), value: EXIT_VALUE },
            ],
          });
        } catch (error) {
          // Handle Ctrl+C
          if (error instanceof Error && error.name === 'ExitPromptError') {
            return;
          }
          throw error;
        }

        if (selectedPlugin === EXIT_VALUE) {
          return;
        }

        const cmd = program.commands.find((c) => c.name() === selectedPlugin.command);
        if (cmd) {
          await cmd.parseAsync([], { from: 'user' });
        }
      }
    }
  });

  return plugins;
}
