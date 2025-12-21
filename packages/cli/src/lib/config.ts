import { pathToFileURL } from 'url';
import { existsSync } from 'fs';
import { resolve } from 'path';

export interface PikConfig {
  /** File patterns to scan for @pik markers */
  include: string[];
}

export function defineConfig(config: PikConfig): PikConfig {
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
