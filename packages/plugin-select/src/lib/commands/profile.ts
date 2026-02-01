import { Command } from 'commander';
import { relative } from 'path';
import { select, Separator } from '@inquirer/prompts';
import pc from 'picocolors';
import { loadConfig } from '@lsst/pik-core';
import { Scanner } from '../scanner.js';
import { Profile } from '../profile/index.js';
import { requireSelectConfig } from '../validation/requireSelectConfig.js';
import '../types.js';

function isExitPromptError(error: unknown): boolean {
  return error instanceof Error && error.name === 'ExitPromptError';
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
      const statuses = Profile.computeAllStatuses(profiles, results);

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
    const profile = new Profile(profileName, profileMapping);
    const applyResults = await profile.apply(results);

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
