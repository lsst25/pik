import { Command } from 'commander';
import { writeFile } from 'fs/promises';
import { relative } from 'path';
import pc from 'picocolors';
import { SingleSwitcher, BlockSwitcher, loadConfig, type Selector } from '@lsst/pik-core';
import { Scanner } from '../scanner.js';
import { requireSelectConfig } from '../validation/requireSelectConfig.js';
import '../types.js'; // Import for type augmentation

/**
 * Check if a selector uses block options
 */
function hasBlockOptions(selector: Selector): boolean {
  return selector.blockOptions.length > 0;
}

export const setCommand = new Command('set')
  .description('Set a specific option for a selector')
  .argument('<selector>', 'Selector name')
  .argument('<option>', 'Option to activate')
  .action(async (selectorName: string, optionName: string) => {
    const config = await loadConfig();
    const selectConfig = requireSelectConfig(config);

    const scanner = new Scanner(selectConfig);
    const results = await scanner.scan();

    let found = false;

    for (const file of results) {
      const selector = file.selectors.find((s) => s.name === selectorName);

      if (selector) {
        found = true;

        try {
          let newContent: string;

          if (hasBlockOptions(selector)) {
            const switcher = BlockSwitcher.forFilePath(file.path);
            newContent = switcher.switch(file.content, selector, optionName);
          } else {
            const switcher = SingleSwitcher.forFilePath(file.path);
            newContent = switcher.switch(file.content, selector, optionName);
          }

          await writeFile(file.path, newContent);

          const relativePath = relative(process.cwd(), file.path);
          console.log(
            pc.green(`✓ Set ${pc.bold(selectorName)} to ${pc.bold(optionName)} in ${relativePath}`)
          );
        } catch (error) {
          if (error instanceof Error) {
            console.error(pc.red(error.message));
          }
          process.exit(1);
        }
      }
    }

    if (!found) {
      console.error(pc.red(`Selector "${selectorName}" not found`));
      process.exit(1);
    }
  });
