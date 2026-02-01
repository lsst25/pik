import { Command } from 'commander';
import { writeFile, readFile } from 'fs/promises';
import { relative } from 'path';
import { select, Separator } from '@inquirer/prompts';
import pc from 'picocolors';
import { SingleSwitcher, BlockSwitcher, loadConfig, Parser } from '@lsst/pik-core';
import { Scanner } from '../scanner.js';
import {
  computeAllProfileStatuses,
  findSelectorByName,
  getAllOptions,
  hasBlockOptions,
} from '../profile-utils.js';
import { requireSelectConfig } from '../validation/requireSelectConfig.js';
import type { ProfileMapping } from '../types.js';
import '../types.js';

function isExitPromptError(error: unknown): boolean {
  return error instanceof Error && error.name === 'ExitPromptError';
}

interface ApplyResult {
  selectorName: string;
  optionName: string;
  filePath: string;
  success: boolean;
  error?: string;
}

export const profileCommand = new Command('profile')
  .description('Apply a profile to switch multiple selectors at once')
  .argument('[name]', 'Profile name to apply')
  .action(async (profileName?: string) => {
    const config = await loadConfig();
    const selectConfig = requireSelectConfig(config);

    const profiles = selectConfig.profiles;

    if (!profiles || Object.keys(profiles).length === 0) {
      console.error(pc.red('No profiles configured'));
      process.exit(1);
    }

    const scanner = new Scanner(selectConfig);
    const results = await scanner.scan();

    // If no profile name provided, show interactive picker
    if (!profileName) {
      const statuses = computeAllProfileStatuses(profiles, results);

      try {
        profileName = await select({
          message: 'Select a profile to apply',
          choices: [
            ...statuses.map((status) => {
              let statusIndicator: string;
              if (status.isFullyActive) {
                statusIndicator = pc.green('●');
              } else if (status.isPartiallyActive) {
                statusIndicator = pc.yellow('●');
              } else {
                statusIndicator = pc.dim('○');
              }

              const countInfo = pc.dim(`(${status.matchedCount}/${status.totalCount})`);

              return {
                name: `${statusIndicator} ${status.name} ${countInfo}`,
                value: status.name,
              };
            }),
            new Separator(),
            { name: pc.dim('← Cancel'), value: '' },
          ],
        });
      } catch (error) {
        if (isExitPromptError(error)) {
          process.exit(0);
        }
        throw error;
      }

      if (!profileName) {
        return;
      }
    }

    // Validate profile exists
    const profileMapping = profiles[profileName];
    if (!profileMapping) {
      const availableProfiles = Object.keys(profiles).join(', ');
      console.error(pc.red(`Profile "${profileName}" not found`));
      console.error(pc.dim(`Available profiles: ${availableProfiles}`));
      process.exit(1);
    }

    // Apply the profile
    const applyResults = await applyProfile(profileMapping, results);

    // Report results
    const successes = applyResults.filter((r) => r.success);
    const failures = applyResults.filter((r) => !r.success);

    for (const result of successes) {
      const relativePath = relative(process.cwd(), result.filePath);
      console.log(
        pc.green(
          `✓ Set ${pc.bold(result.selectorName)} to ${pc.bold(result.optionName)} in ${relativePath}`
        )
      );
    }

    for (const result of failures) {
      console.error(pc.red(`✗ ${result.selectorName}: ${result.error}`));
    }

    if (failures.length > 0) {
      console.log();
      console.log(
        pc.yellow(`Applied ${successes.length}/${applyResults.length} selector(s) from profile "${profileName}"`)
      );
      process.exit(1);
    } else {
      console.log();
      console.log(pc.green(`✓ Applied profile "${profileName}" (${successes.length} selector(s))`));
    }
  });

async function applyProfile(
  mapping: ProfileMapping,
  results: import('../scanner.js').FileResult[]
): Promise<ApplyResult[]> {
  const applyResults: ApplyResult[] = [];

  // Group changes by file to minimize re-reads
  const changesByFile = new Map<
    string,
    Array<{ selectorName: string; optionName: string; selector: import('@lsst/pik-core').Selector }>
  >();

  for (const [selectorName, optionName] of Object.entries(mapping)) {
    const found = findSelectorByName(results, selectorName);

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

    const allOptions = getAllOptions(found.selector);
    const optionExists = allOptions.some((o) => o.name === optionName);

    if (!optionExists) {
      const availableOptions = allOptions.map((o) => o.name).join(', ');
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

        if (hasBlockOptions(freshSelector)) {
          const switcher = BlockSwitcher.forFilePath(filePath);
          content = switcher.switch(content, freshSelector, change.optionName);
        } else {
          const switcher = SingleSwitcher.forFilePath(filePath);
          content = switcher.switch(content, freshSelector, change.optionName);
        }

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
