import type { BaseSelector } from '@lsst/pik-core';
import type { FileResult } from './scanner.js';
import type { ProfileMapping, ProfilesConfig } from './types.js';
import type { ProfileStatus, SelectorMappingStatus } from './types/profile-status.js';

/**
 * Result of finding a selector by name
 */
export interface FoundSelector {
  file: FileResult;
  selector: BaseSelector;
}

/**
 * Find a selector by name across all scanned files
 */
export function findSelectorByName(
  results: FileResult[],
  selectorName: string
): FoundSelector | null {
  for (const file of results) {
    const selector = file.selectors.find((s) => s.name === selectorName);
    if (selector) {
      return { file, selector };
    }
  }
  return null;
}

/**
 * Compute the status of a single profile
 */
export function computeProfileStatus(
  profileName: string,
  mapping: ProfileMapping,
  results: FileResult[]
): ProfileStatus {
  const mappings: SelectorMappingStatus[] = [];

  for (const [selectorName, expectedOption] of Object.entries(mapping)) {
    const found = findSelectorByName(results, selectorName);

    if (!found) {
      mappings.push({
        selectorName,
        expectedOption,
        currentOption: null,
        filePath: '',
        isMatched: false,
        error: `Selector "${selectorName}" not found`,
      });
      continue;
    }

    const currentOption = found.selector.getActiveOptionName();
    const optionExists = found.selector.optionExists(expectedOption);

    if (!optionExists) {
      mappings.push({
        selectorName,
        expectedOption,
        currentOption,
        filePath: found.file.path,
        isMatched: false,
        error: `Option "${expectedOption}" not found in selector "${selectorName}"`,
      });
      continue;
    }

    mappings.push({
      selectorName,
      expectedOption,
      currentOption,
      filePath: found.file.path,
      isMatched: currentOption === expectedOption,
    });
  }

  const matchedCount = mappings.filter((m) => m.isMatched).length;
  const totalCount = mappings.length;

  return {
    name: profileName,
    mappings,
    isFullyActive: matchedCount === totalCount && totalCount > 0,
    isPartiallyActive: matchedCount > 0 && matchedCount < totalCount,
    matchedCount,
    totalCount,
  };
}

/**
 * Compute status for all profiles
 */
export function computeAllProfileStatuses(
  profiles: ProfilesConfig,
  results: FileResult[]
): ProfileStatus[] {
  return Object.entries(profiles).map(([name, mapping]) =>
    computeProfileStatus(name, mapping, results)
  );
}
