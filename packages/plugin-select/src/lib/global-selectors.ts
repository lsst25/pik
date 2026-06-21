import { basename, resolve } from 'path';
import {
  loadConfig,
  loadGlobalConfig,
  expandHome,
  type BaseSelector,
  type GlobalProjectEntry,
} from '@lsst/pik-core';
import { Scanner } from './scanner.js';
import './types.js'; // Augments PikConfig with `select`

export interface GlobalSelectorItem {
  /** Display label of the owning project (used as the `project:` namespace). */
  project: string;
  /** Absolute project root. */
  root: string;
  /** Absolute path of the file holding the selector. */
  file: string;
  /** File content (so callers can switch without re-reading). */
  content: string;
  /** The parsed selector. */
  selector: BaseSelector;
}

interface NormalizedEntry {
  path: string;
  name: string;
  /** undefined = whole project; array = only these names (annotations still apply). */
  selectors?: string[];
}

function normalizeEntry(entry: GlobalProjectEntry): NormalizedEntry {
  if (typeof entry === 'string') {
    const path = resolve(expandHome(entry));
    return { path, name: basename(path) };
  }

  const path = resolve(expandHome(entry.path));
  return {
    path,
    name: entry.name ?? basename(path),
    selectors: entry.selectors,
  };
}

/**
 * A selector is globally visible when it is opted in by either mechanism:
 *  - an in-file `@pik:global` annotation, or
 *  - the project's global-config entry (whole project, or named in `selectors`).
 */
function isOptedIn(selector: BaseSelector, entry: NormalizedEntry): boolean {
  if (selector.isGlobal) {
    return true;
  }
  if (entry.selectors === undefined) {
    return true;
  }
  return entry.selectors.includes(selector.name);
}

/**
 * Collect selectors that opted into cross-project visibility, by scanning each
 * project registered in the user-level global config (`~/.config/pik/config.*`).
 *
 * Returns an empty array when there is no global config or no opted-in selectors.
 */
export async function collectGlobalSelectors(): Promise<GlobalSelectorItem[]> {
  const globalConfig = await loadGlobalConfig();

  if (!globalConfig?.projects?.length) {
    return [];
  }

  const items: GlobalSelectorItem[] = [];

  for (const rawEntry of globalConfig.projects) {
    const entry = normalizeEntry(rawEntry);

    // Each project supplies its own `include` globs via its local pik config.
    const projectConfig = await loadConfig(entry.path);
    if (!projectConfig?.select) {
      continue;
    }

    const scanner = new Scanner(projectConfig.select);
    const results = await scanner.scan(entry.path);

    for (const file of results) {
      for (const selector of file.selectors) {
        if (isOptedIn(selector, entry)) {
          items.push({
            project: entry.name,
            root: entry.path,
            file: file.path,
            content: file.content,
            selector,
          });
        }
      }
    }
  }

  return items;
}
