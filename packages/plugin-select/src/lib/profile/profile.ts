import { writeFile, readFile } from 'fs/promises';
import { Parser, type BaseSelector } from '@lsst/pik-core';
import type { FileResult } from '../scanner.js';
import type { ProfileMapping } from '../types.js';
import type { ProfileStatus, SelectorMappingStatus } from '../types/profile-status.js';

/**
 * Result of finding a selector by name
 */
export interface FoundSelector {
  file: FileResult;
  selector: BaseSelector;
}

/**
 * Result of applying a single selector change
 */
export interface ApplyResult {
  selectorName: string;
  optionName: string;
  filePath: string;
  success: boolean;
  error?: string;
}

/**
 * Represents a profile that maps selector names to option names
 */
export class Profile {
  constructor(
    public readonly name: string,
    public readonly mapping: ProfileMapping
  ) {}

  /**
   * Find a selector by name across scan results
   */
  static findSelector(results: FileResult[], selectorName: string): FoundSelector | null {
    for (const file of results) {
      const selector = file.selectors.find((s) => s.name === selectorName);
      if (selector) {
        return { file, selector };
      }
    }
    return null;
  }

  /**
   * Compute the status of this profile against scan results
   */
  computeStatus(results: FileResult[]): ProfileStatus {
    const mappings: SelectorMappingStatus[] = [];

    for (const [selectorName, expectedOption] of Object.entries(this.mapping)) {
      const found = Profile.findSelector(results, selectorName);

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
      name: this.name,
      mappings,
      isFullyActive: matchedCount === totalCount && totalCount > 0,
      isPartiallyActive: matchedCount > 0 && matchedCount < totalCount,
      matchedCount,
      totalCount,
    };
  }

  /**
   * Apply this profile to the scanned files
   */
  async apply(results: FileResult[]): Promise<ApplyResult[]> {
    const applyResults: ApplyResult[] = [];

    // Group changes by file to minimize re-reads
    const changesByFile = new Map<
      string,
      Array<{ selectorName: string; optionName: string; selector: BaseSelector }>
    >();

    for (const [selectorName, optionName] of Object.entries(this.mapping)) {
      const found = Profile.findSelector(results, selectorName);

      if (!found) {
        applyResults.push({
          selectorName,
          optionName,
          filePath: '',
          success: false,
          error: `Selector "${selectorName}" not found`,
        });
        continue;
      }

      const optionExists = found.selector.optionExists(optionName);

      if (!optionExists) {
        const availableOptions = found.selector.options.map((o) => o.name).join(', ');
        applyResults.push({
          selectorName,
          optionName,
          filePath: found.file.path,
          success: false,
          error: `Option "${optionName}" not found. Available: ${availableOptions}`,
        });
        continue;
      }

      const existing = changesByFile.get(found.file.path);
      if (existing) {
        existing.push({
          selectorName,
          optionName,
          selector: found.selector,
        });
      } else {
        changesByFile.set(found.file.path, [
          {
            selectorName,
            optionName,
            selector: found.selector,
          },
        ]);
      }
    }

    // Apply changes file by file
    for (const [filePath, changes] of changesByFile) {
      let content = await readFile(filePath, 'utf-8');

      for (const change of changes) {
        try {
          // Re-parse the content to get fresh selector positions after each change
          const parser = Parser.forFilePath(filePath);
          const { selectors } = parser.parse(content);
          const freshSelector = selectors.find((s) => s.name === change.selectorName);

          if (!freshSelector) {
            applyResults.push({
              selectorName: change.selectorName,
              optionName: change.optionName,
              filePath,
              success: false,
              error: `Selector "${change.selectorName}" not found after previous changes`,
            });
            continue;
          }

          content = freshSelector.switchTo(content, change.optionName, filePath);

          applyResults.push({
            selectorName: change.selectorName,
            optionName: change.optionName,
            filePath,
            success: true,
          });
        } catch (error) {
          applyResults.push({
            selectorName: change.selectorName,
            optionName: change.optionName,
            filePath,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      await writeFile(filePath, content);
    }

    return applyResults;
  }

  /**
   * Compute statuses for multiple profiles
   */
  static computeAllStatuses(
    profiles: Record<string, ProfileMapping>,
    results: FileResult[]
  ): ProfileStatus[] {
    return Object.entries(profiles).map(([name, mapping]) =>
      new Profile(name, mapping).computeStatus(results)
    );
  }
}
