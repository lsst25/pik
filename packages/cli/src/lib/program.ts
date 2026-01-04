import { Command } from 'commander';
import { select, Separator } from '@inquirer/prompts';
import pc from 'picocolors';
import { existsSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import {
  loadConfig,
  isValidPlugin,
  CONFIG_FILES,
  type PikPlugin,
} from '@lsst/pik-core';
import { selectPlugin } from '@lsst/pik-plugin-select';
import { worktreePlugin } from '@lsst/pik-plugin-worktree';
import { killportPlugin } from './plugins/killport.js';
import pkg from '../../package.json' with { type: 'json' };

const builtinPlugins: PikPlugin[] = [
  selectPlugin,
  worktreePlugin,
  killportPlugin,
];

/**
 * Get plugins that are enabled in the config.
 * - Built-in plugins are enabled if their command key exists in config
 * - External plugins from the `plugins` array are added directly
 */
async function getEnabledPlugins(): Promise<PikPlugin[]> {
  const config = await loadConfig();

  if (!config) {
    // No config - no plugins enabled
    return [];
  }

  const enabledPlugins: PikPlugin[] = [];

  // Add built-in plugins that have config keys
  for (const plugin of builtinPlugins) {
    if (plugin.command in config) {
      enabledPlugins.push(plugin);
    }
  }

  // Add external plugins from config
  if (config.plugins && Array.isArray(config.plugins)) {
    for (const plugin of config.plugins) {
      if (isValidPlugin(plugin)) {
        enabledPlugins.push(plugin);
      } else {
        console.error(pc.red('Invalid plugin in config.plugins array'));
        console.error(
          pc.dim('Each plugin must have: name, description, command, register'),
        );
      }
    }
  }

  return enabledPlugins;
}

export const program = new Command()
  .name(pkg.name)
  .description(pkg.description)
  .version(pkg.version);

const DEFAULT_CONFIG = `export default {
  // Select plugin - switch between options in files
  select: {
    include: ['.env*'], // Files to scan for @pik markers
  },

  // Worktree plugin - manage git worktrees
  // worktree: {
  //   baseDir: '../',              // Where to create worktrees (relative to repo root)
  //   copyFiles: ['.env', '.npmrc'], // Files to copy to new worktrees
  //   postCreate: 'npm install',     // Command to run after creating worktree
  // },

  // Killport plugin - kill processes on specific ports
  // killport: {
  //   defaultPort: 3000, // Default port number for interactive prompt
  // },
};
`;

program
  .command('init')
  .description('Create a default pik config file')
  .action(() => {
    const cwd = process.cwd();

    for (const configFile of CONFIG_FILES) {
      const configPath = resolve(cwd, configFile);
      if (existsSync(configPath)) {
        console.log(pc.yellow(`Config file already exists: ${configFile}`));
        return;
      }
    }

    const fileName = CONFIG_FILES[0];
    const configPath = resolve(cwd, fileName);
    writeFileSync(configPath, DEFAULT_CONFIG, 'utf-8');

    console.log(pc.green('✓') + ' Created ' + pc.bold(fileName));
    console.log(pc.dim('Edit the config file to enable plugins'));
  });

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
      console.log(
        pc.dim('Add plugin config to pik.config.ts to enable plugins.'),
      );
      console.log(pc.dim('Example: { select: {}, worktree: {} }'));
      return;
    }

    if (plugins.length === 1) {
      // Single plugin - run its default command
      console.clear();
      const plugin = plugins[0];
      const cmd = program.commands.find((c) => c.name() === plugin.command);
      if (cmd) {
        await cmd.parseAsync([], { from: 'user' });
      }
    } else {
      // Multiple plugins - show selection menu in a loop
      const EXIT_VALUE = Symbol('exit');

      while (true) {
        console.clear();
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

        const cmd = program.commands.find(
          (c) => c.name() === selectedPlugin.command,
        );
        if (cmd) {
          await cmd.parseAsync([], { from: 'user' });
        }
      }
    }
  });

  return plugins;
}
