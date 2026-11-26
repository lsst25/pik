import { Command } from 'commander';
import { select, Separator } from '@inquirer/prompts';
import pc from 'picocolors';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import {
  loadConfig,
  findLocalConfig,
  loadGlobalConfig,
  isValidPlugin,
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
 * - External plugins from the `plugins` array of the local config and of the
 *   global config (`~/.config/pik/config.*`) are added directly; for the same
 *   command, the local plugin wins
 */
async function getEnabledPlugins(): Promise<PikPlugin[]> {
  const config = await loadConfig();

  // A global config with registered projects makes the select plugin usable from
  // any directory, even with no local pik config present.
  const globalConfig = await loadGlobalConfig();
  const hasGlobalSelectors = Boolean(globalConfig?.projects?.length);

  const enabledPlugins: PikPlugin[] = [];

  // Add built-in plugins that have config keys (or, for select, are reachable globally)
  for (const plugin of builtinPlugins) {
    const enabledLocally = config ? plugin.command in config : false;
    const enabledGlobally =
      plugin.command === selectPlugin.command && hasGlobalSelectors;

    if (enabledLocally || enabledGlobally) {
      enabledPlugins.push(plugin);
    }
  }

  // Add external plugins: local first, then global. Outside a project the global
  // config file can also be the "local" config, so skip commands already added.
  const externalPlugins = [
    ...(Array.isArray(config?.plugins) ? config.plugins : []),
    ...(globalConfig?.plugins ?? []),
  ];
  const commands = new Set(enabledPlugins.map((plugin) => plugin.command));

  for (const plugin of externalPlugins) {
    if (!isValidPlugin(plugin)) {
      console.error(pc.red('Invalid plugin in config.plugins array'));
      console.error(
        pc.dim('Each plugin must have: name, description, command, register'),
      );
      continue;
    }
    if (commands.has(plugin.command)) {
      continue;
    }
    commands.add(plugin.command);
    enabledPlugins.push(plugin);
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
  .action(async () => {
    const cwd = process.cwd();
    const fileName = 'pik.config.mjs';
    const configPath = resolve(cwd, fileName);

    const existingConfig = await findLocalConfig(cwd);
    if (existingConfig) {
      console.log(pc.yellow(`Config file already exists: ${existingConfig}`));
      return;
    }

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
