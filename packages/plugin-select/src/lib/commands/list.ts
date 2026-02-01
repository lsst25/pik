import { Command } from 'commander';
import { BlockSelector } from '@lsst/pik-core';
import pc from 'picocolors';
import { relative } from 'path';
import { loadConfig } from '@lsst/pik-core';
import { Scanner } from '../scanner.js';
import { requireSelectConfig } from '../validation/requireSelectConfig.js';
import '../types.js'; // Import for type augmentation

interface ListOptions {
  json?: boolean;
}

export const listCommand = new Command('list')
  .alias('ls')
  .description('List all selectors and their current state')
  .option('--json', 'Output in JSON format')
  .action(async (options: ListOptions) => {
    const config = await loadConfig();
    const selectConfig = requireSelectConfig(config, options);

    const scanner = new Scanner(selectConfig);
    const results = await scanner.scan();

    if (options.json) {
      const jsonOutput = results.flatMap((file) =>
        file.selectors.map((selector) => ({
          name: selector.name,
          file: relative(process.cwd(), file.path),
          line: selector.line,
          activeOption: selector.getActiveOptionName(),
          isBlock: selector instanceof BlockSelector,
          options: selector.options.map((o) => ({ name: o.name, isActive: o.isActive })),
        }))
      );
      console.log(JSON.stringify(jsonOutput, null, 2));
      return;
    }

    if (results.length === 0) {
      console.log(pc.yellow('No selectors found'));
      return;
    }

    for (const file of results) {
      const relativePath = relative(process.cwd(), file.path);
      console.log(pc.cyan(relativePath));

      for (const selector of file.selectors) {
        const activeOptionName = selector.getActiveOptionName();
        const activeLabel = activeOptionName
          ? pc.green(activeOptionName)
          : pc.yellow('none');

        const blockIndicator = selector instanceof BlockSelector ? pc.dim(' [block]') : '';
        console.log(`  ${pc.bold(selector.name)}${blockIndicator}: ${activeLabel}`);

        for (const option of selector.options) {
          const marker = option.isActive ? pc.green('●') : pc.dim('○');
          console.log(`    ${marker} ${option.name}`);
        }
      }

      console.log();
    }
  });
