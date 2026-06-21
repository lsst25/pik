import { Command } from 'commander';
import { BlockSelector, loadConfig } from '@lsst/pik-core';
import pc from 'picocolors';
import { relative } from 'path';
import { Scanner, type FileResult } from '../scanner.js';
import { collectGlobalSelectors } from '../global-selectors.js';
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

    // Local scan is best-effort: when the current directory has no select config we
    // simply contribute no local selectors, so global-only usage works from anywhere.
    let localResults: FileResult[] = [];
    if (config?.select) {
      const scanner = new Scanner(config.select);
      localResults = await scanner.scan();
    }

    const globalItems = await collectGlobalSelectors();

    if (options.json) {
      const localJson = localResults.flatMap((file) =>
        file.selectors.map((selector) => ({
          name: selector.name,
          file: relative(process.cwd(), file.path),
          line: selector.line,
          activeOption: selector.getActiveOptionName(),
          isBlock: selector instanceof BlockSelector,
          global: false,
          project: null as string | null,
          options: selector.options.map((o) => ({ name: o.name, isActive: o.isActive })),
        }))
      );

      // Global selectors are namespaced `project:selector` so they never collide with
      // local names and so `set` can route the write back to the owning project.
      const globalJson = globalItems.map((item) => ({
        name: `${item.project}:${item.selector.name}`,
        file: item.file,
        line: item.selector.line,
        activeOption: item.selector.getActiveOptionName(),
        isBlock: item.selector instanceof BlockSelector,
        global: true,
        project: item.project as string | null,
        options: item.selector.options.map((o) => ({ name: o.name, isActive: o.isActive })),
      }));

      console.log(JSON.stringify([...localJson, ...globalJson], null, 2));
      return;
    }

    if (localResults.length === 0 && globalItems.length === 0) {
      console.log(pc.yellow('No selectors found'));
      return;
    }

    for (const file of localResults) {
      const relativePath = relative(process.cwd(), file.path);
      console.log(pc.cyan(relativePath));
      printSelectors(file.selectors);
      console.log();
    }

    if (globalItems.length > 0) {
      console.log(pc.magenta('Global'));
      for (const item of globalItems) {
        const activeOptionName = item.selector.getActiveOptionName();
        const activeLabel = activeOptionName
          ? pc.green(activeOptionName)
          : pc.yellow('none');
        const blockIndicator =
          item.selector instanceof BlockSelector ? pc.dim(' [block]') : '';
        const name = `${item.project}:${item.selector.name}`;
        console.log(
          `  ${pc.bold(name)}${blockIndicator}: ${activeLabel} ${pc.dim(`- ${item.file}`)}`
        );
        for (const option of item.selector.options) {
          const marker = option.isActive ? pc.green('●') : pc.dim('○');
          console.log(`    ${marker} ${option.name}`);
        }
      }
      console.log();
    }
  });

function printSelectors(selectors: FileResult['selectors']): void {
  for (const selector of selectors) {
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
}
