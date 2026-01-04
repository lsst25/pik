/**
 * List of config file names to check (in order of precedence)
 */
export const CONFIG_FILES = [
  '.pik.config.js',
  'pik.config.mts',
  'pik.config.ts',
  'pik.config.mjs',
  'pik.config.js',
  '.pik.config.mts',
  '.pik.config.ts',
  '.pik.config.mjs',
] as const;
