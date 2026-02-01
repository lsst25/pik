import { Command } from 'commander';
import { relative } from 'path';
import pc from 'picocolors';
import { loadConfig } from '@lsst/pik-core';
import { Scanner } from '../scanner.js';
import { computeAllProfileStatuses } from '../profile-utils.js';
import { requireSelectConfig } from '../validation/requireSelectConfig.js';
import '../types.js';

interface ProfilesOptions {
  json?: boolean;
}

export const profilesCommand = new Command('profiles')
  .description('List all profiles and their status')
  .option('--json', 'Output in JSON format')
  .action(async (options: ProfilesOptions) => {
    const config = await loadConfig();
    const selectConfig = requireSelectConfig(config, options);

    const profiles = selectConfig.profiles;

    if (!profiles || Object.keys(profiles).length === 0) {
      if (options.json) {
        console.log(JSON.stringify({ error: 'No profiles configured' }));
      } else {
        console.log(pc.yellow('No profiles configured'));
      }
      return;
    }

    const scanner = new Scanner(selectConfig);
    const results = await scanner.scan();
    const statuses = computeAllProfileStatuses(profiles, results);

    if (options.json) {
      const jsonOutput = statuses.map((status) => ({
        name: status.name,
        isFullyActive: status.isFullyActive,
        isPartiallyActive: status.isPartiallyActive,
        matchedCount: status.matchedCount,
        totalCount: status.totalCount,
        mappings: status.mappings.map((m) => ({
          selectorName: m.selectorName,
          expectedOption: m.expectedOption,
          currentOption: m.currentOption,
          filePath: m.filePath ? relative(process.cwd(), m.filePath) : null,
          isMatched: m.isMatched,
          error: m.error,
        })),
      }));
      console.log(JSON.stringify(jsonOutput, null, 2));
      return;
    }

    for (const status of statuses) {
      // Status indicator
      let statusIndicator: string;
      if (status.isFullyActive) {
        statusIndicator = pc.green('●');
      } else if (status.isPartiallyActive) {
        statusIndicator = pc.yellow('●');
      } else {
        statusIndicator = pc.dim('○');
      }

      const countInfo = pc.dim(`(${status.matchedCount}/${status.totalCount})`);
      console.log(`${statusIndicator} ${pc.bold(status.name)} ${countInfo}`);

      for (const mapping of status.mappings) {
        const mappingIndicator = mapping.isMatched ? pc.green('✓') : pc.dim('○');
        const currentValue = mapping.currentOption ?? pc.dim('none');
        const expectedValue = mapping.expectedOption;

        if (mapping.error) {
          console.log(`  ${pc.red('✗')} ${mapping.selectorName}: ${pc.red(mapping.error)}`);
        } else if (mapping.isMatched) {
          console.log(`  ${mappingIndicator} ${mapping.selectorName}: ${pc.green(currentValue)}`);
        } else {
          console.log(
            `  ${mappingIndicator} ${mapping.selectorName}: ${currentValue} ${pc.dim(`→ ${expectedValue}`)}`
          );
        }
      }

      console.log();
    }
  });
