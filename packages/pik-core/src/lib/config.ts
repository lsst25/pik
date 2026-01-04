import { pathToFileURL } from 'url';
import { existsSync } from 'fs';
import { resolve } from 'path';
import type { PikPlugin } from './types/plugin.js';
import { CONFIG_FILES } from './config-files.js';

/**
 * Base config interface - plugins extend this via declaration merging
 */
export interface PikConfig {
  /**
   * External plugins to load.
   * Each plugin should be a factory function call that returns a PikPlugin:
   * @example
   * ```ts
   * import { myPlugin } from 'pik-plugin-my';
   *
   * export default {
   *   plugins: [
   *     myPlugin({ someOption: 'value' }),
   *   ],
   * }
   * ```
   */
  plugins?: PikPlugin[];
  [pluginName: string]: unknown;
}

/**
 * Helper function for type-safe config definition
 */
export function defineConfig<T extends PikConfig>(config: T): T {
  return config;
}

/**
 * Load pik config from the current directory
 */
export async function loadConfig(cwd: string = process.cwd()): Promise<PikConfig | null> {
  for (const configFile of CONFIG_FILES) {
    const configPath = resolve(cwd, configFile);

    if (existsSync(configPath)) {
      const configUrl = pathToFileURL(configPath).href;
      const module = await import(configUrl);
      return module.default as PikConfig;
    }
  }

  return null;
}

/**
 * Validate that an object satisfies the PikPlugin interface
 */
export function isValidPlugin(obj: unknown): obj is PikPlugin {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const plugin = obj as Record<string, unknown>;

  return (
    typeof plugin.name === 'string' &&
    typeof plugin.description === 'string' &&
    typeof plugin.command === 'string' &&
    typeof plugin.register === 'function'
  );
}
