import { Command } from 'commander';
import pc from 'picocolors';
import { relative } from 'path';
import { loadConfig } from '@lsst/pik-core';
import { Scanner } from '../scanner.js';
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

    if (!config?.select) {
      if (options.json) {
        console.log(JSON.stringify({ error: 'No pik config found or missing "select" section' }));
      } else {
        console.error(pc.red('No pik config found or missing "select" section'));
      }
      process.exit(1);
    }

    const scanner = new Scanner(config.select);
    const results = await scanner.scan();

    if (options.json) {
      const jsonOutput = results.flatMap((file) =>
        file.selectors.map((selector) => ({
          name: selector.name,
          file: relative(process.cwd(), file.path),
          line: selector.line,
          activeOption: selector.options.find((o) => o.isActive)?.name ?? null,
          options: selector.options.map((o) => ({
            name: o.name,
            isActive: o.isActive,
          })),
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
        const activeOption = selector.options.find((o) => o.isActive);
        const activeLabel = activeOption
          ? pc.green(activeOption.name)
          : pc.yellow('none');

        console.log(`  ${pc.bold(selector.name)}: ${activeLabel}`);

        for (const option of selector.options) {
          const marker = option.isActive ? pc.green('●') : pc.dim('○');
          console.log(`    ${marker} ${option.name}`);
        }
      }

      console.log();
    }
  });
