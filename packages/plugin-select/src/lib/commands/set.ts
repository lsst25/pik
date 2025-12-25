import { Command } from 'commander';
import { writeFile } from 'fs/promises';
import { extname, relative } from 'path';
import pc from 'picocolors';
import { SingleSwitcher, loadConfig } from '@lsst/pik-core';
import { Scanner } from '../scanner.js';
import '../types.js'; // Import for type augmentation

export const setCommand = new Command('set')
  .description('Set a specific option for a selector')
  .argument('<selector>', 'Selector name')
  .argument('<option>', 'Option to activate')
  .action(async (selectorName: string, optionName: string) => {
    const config = await loadConfig();

    if (!config?.select) {
      console.error(pc.red('No pik config found or missing "select" section'));
      process.exit(1);
    }

    const scanner = new Scanner(config.select);
    const results = await scanner.scan();

    let found = false;

    for (const file of results) {
      const selector = file.selectors.find((s) => s.name === selectorName);

      if (selector) {
        found = true;
        const extension = extname(file.path);
        const switcher = SingleSwitcher.forExtension(extension);

        try {
          const newContent = switcher.switch(file.content, selector, optionName);
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
