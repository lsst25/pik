import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';
import { pathToFileURL } from 'url';

/**
 * A project opted into cross-project ("global") switch visibility.
 *
 * - A bare string is a path to the project root; every selector in it becomes global.
 * - An object form can restrict which selectors surface and override the display label.
 */
export type GlobalProjectEntry =
  | string
  | {
      /** Absolute or `~`-relative path to the project root. */
      path: string;
      /** Label used to namespace this project's selectors. Defaults to the directory name. */
      name?: string;
      /**
       * Restrict which selectors surface globally. When omitted, every selector in the
       * project is global. When provided, only the named selectors are — plus any
       * selector carrying an in-file `@pik:global` annotation (the two opt-ins compose).
       */
      selectors?: string[];
    };

/**
 * User-level global pik config, loaded from `~/.config/pik/config.*`.
 */
export interface GlobalConfig {
  /** Projects whose switches may be listed and set from any directory. */
  projects?: GlobalProjectEntry[];
}

/**
 * Helper for type-safe global config definition.
 */
export function defineGlobalConfig(config: GlobalConfig): GlobalConfig {
  return config;
}

/**
 * Expand a leading `~` / `~/` to the user's home directory.
 */
export function expandHome(filePath: string): string {
  if (filePath === '~') {
    return homedir();
  }
  if (filePath.startsWith('~/')) {
    return join(homedir(), filePath.slice(2));
  }
  return filePath;
}

/**
 * Directory holding the global config, honoring `$XDG_CONFIG_HOME` (default `~/.config/pik`).
 */
export function globalConfigDir(): string {
  const base = process.env.XDG_CONFIG_HOME || join(homedir(), '.config');
  return join(base, 'pik');
}

const CONFIG_FILES = [
  'config.js',
  'config.mjs',
  'config.cjs',
  'config.json',
  'config.ts',
  'config.mts',
];

/**
 * Load the user-level global pik config (`~/.config/pik/config.*`).
 *
 * Accepts either a bare `{ projects: [...] }` or a wrapped `{ global: { projects: [...] } }`
 * shape. Returns `null` when no global config exists.
 */
export async function loadGlobalConfig(): Promise<GlobalConfig | null> {
  const dir = globalConfigDir();

  for (const file of CONFIG_FILES) {
    const filePath = join(dir, file);

    if (!existsSync(filePath)) {
      continue;
    }

    let raw: unknown;

    if (file.endsWith('.json')) {
      raw = JSON.parse(await readFile(filePath, 'utf-8'));
    } else {
      const mod = await import(pathToFileURL(filePath).href);
      raw = mod.default ?? mod;
    }

    return normalize(raw);
  }

  return null;
}

function normalize(raw: unknown): GlobalConfig | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const obj = raw as Record<string, unknown>;
  // Support both `{ global: { projects } }` and a bare `{ projects }`.
  const source = (obj.global ?? obj) as Record<string, unknown>;
  const projects = Array.isArray(source.projects)
    ? (source.projects as GlobalProjectEntry[])
    : [];

  return { projects };
}
