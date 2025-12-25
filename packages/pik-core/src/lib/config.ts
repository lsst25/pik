import { pathToFileURL } from 'url';
import { existsSync } from 'fs';
import { resolve } from 'path';

/**
 * Base config interface - plugins extend this via declaration merging
 */
export interface PikConfig {
  [pluginName: string]: unknown;
}

/**
 * Helper function for type-safe config definition
 */
export function defineConfig<T extends PikConfig>(config: T): T {
  return config;
}

const CONFIG_FILES = [
  'pik.config.mts',
  'pik.config.ts',
  'pik.config.mjs',
  'pik.config.js',
  '.pik.config.mts',
  '.pik.config.ts',
  '.pik.config.mjs',
  '.pik.config.js',
];

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
