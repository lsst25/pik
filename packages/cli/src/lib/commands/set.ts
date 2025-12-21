import { Command } from 'commander';
import { writeFile } from 'fs/promises';
import { extname, relative } from 'path';
import pc from 'picocolors';
import { SingleSwitcher } from '@lsst25/pik-core';
import { loadConfig } from '../config.js';
import { Scanner } from '../scanner.js';

export const setCommand = new Command('set')
  .description('Set a specific option for a selector')
  .argument('<selector>', 'Selector name')
  .argument('<option>', 'Option to activate')
  .action(async (selectorName: string, optionName: string) => {
    const config = await loadConfig();

    if (!config) {
      console.error(pc.red('No pik.config.ts found'));
      process.exit(1);
    }

    const scanner = new Scanner(config);
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
