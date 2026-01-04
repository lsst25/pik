import { cosmiconfig } from 'cosmiconfig';
import type { PikPlugin } from './types/plugin.js';

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
 * Load pik config by searching up the directory tree
 * Uses cosmiconfig to search for config files starting from cwd
 * Uses 'global' strategy to search up to home directory
 */
export async function loadConfig(
  cwd: string = process.cwd(),
): Promise<PikConfig | null> {
  const explorer = cosmiconfig('pik', {
    searchStrategy: 'global',
  });
  const result = await explorer.search(cwd);

  return result?.config ?? null;
}

/**
 * Check if a pik config file exists in the specified directory (not parent directories)
 * Returns the config file name if found, null otherwise
 */
export async function findLocalConfig(
  cwd: string = process.cwd(),
): Promise<string | null> {
  const explorer = cosmiconfig('pik', {
    searchStrategy: 'none',
  });
  const result = await explorer.search(cwd);

  if (result) {
    return result.filepath.split('/').pop() || null;
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
