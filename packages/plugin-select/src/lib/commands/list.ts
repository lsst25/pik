import { Command } from 'commander';
import pc from 'picocolors';
import { relative } from 'path';
import { loadConfig, type Selector } from '@lsst/pik-core';
import { Scanner } from '../scanner.js';
import '../types.js'; // Import for type augmentation

interface ListOptions {
  json?: boolean;
}

/**
 * Check if a selector uses block options
 */
function hasBlockOptions(selector: Selector): boolean {
  return selector.blockOptions.length > 0;
}

/**
 * Get the active option name for a selector (works for both single and block options)
 */
function getActiveOptionName(selector: Selector): string | null {
  if (hasBlockOptions(selector)) {
    return selector.blockOptions.find((b) => b.isActive)?.name ?? null;
  }
  return selector.options.find((o) => o.isActive)?.name ?? null;
}

/**
 * Get all option names for a selector (works for both single and block options)
 */
function getAllOptions(selector: Selector): Array<{ name: string; isActive: boolean }> {
  if (hasBlockOptions(selector)) {
    return selector.blockOptions.map((b) => ({ name: b.name, isActive: b.isActive }));
  }
  return selector.options.map((o) => ({ name: o.name, isActive: o.isActive }));
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
          activeOption: getActiveOptionName(selector),
          isBlock: hasBlockOptions(selector),
          options: getAllOptions(selector),
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
        const activeOptionName = getActiveOptionName(selector);
        const activeLabel = activeOptionName
          ? pc.green(activeOptionName)
          : pc.yellow('none');

        const blockIndicator = hasBlockOptions(selector) ? pc.dim(' [block]') : '';
        console.log(`  ${pc.bold(selector.name)}${blockIndicator}: ${activeLabel}`);

        for (const option of getAllOptions(selector)) {
          const marker = option.isActive ? pc.green('●') : pc.dim('○');
          console.log(`    ${marker} ${option.name}`);
        }
      }

      console.log();
    }
  });
