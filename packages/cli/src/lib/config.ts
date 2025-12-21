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

const CONFIG_FILE = 'pik.config.ts';

export async function loadConfig(cwd: string = process.cwd()): Promise<PikConfig | null> {
  const configPath = resolve(cwd, CONFIG_FILE);

  if (!existsSync(configPath)) {
    return null;
  }

  const configUrl = pathToFileURL(configPath).href;
  const module = await import(configUrl);

  return module.default as PikConfig;
}
