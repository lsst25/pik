import { Command } from 'commander';
import pc from 'picocolors';
import { relative } from 'path';
import { loadConfig } from '../config.js';
import { Scanner } from '../scanner.js';

export const listCommand = new Command('list')
  .alias('ls')
  .description('List all selectors and their current state')
  .action(async () => {
    const config = await loadConfig();

    if (!config) {
      console.error(pc.red('No pik.config.ts found'));
      process.exit(1);
    }

    const scanner = new Scanner(config);
    const results = await scanner.scan();

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
