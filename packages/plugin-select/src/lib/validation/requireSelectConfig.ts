import pc from 'picocolors';
import type { PikConfig } from '@lsst/pik-core';
import type { SelectConfig } from '../types.js';

/**
 * Validates that config has a select section.
 * Exits with error if not found.
 *
 * @returns The select config (type-narrowed)
 */
export function requireSelectConfig(
  config: PikConfig | null,
  options?: { json?: boolean }
): SelectConfig {
  if (!config?.select) {
    const message = 'No pik config found or missing "select" section';
    if (options?.json) {
      console.log(JSON.stringify({ error: message }));
    } else {
      console.error(pc.red(message));
    }
    process.exit(1);
  }
  return config.select;
}
