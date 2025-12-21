import { Command } from 'commander';
import { writeFile } from 'fs/promises';
import { extname, relative } from 'path';
import { select } from '@inquirer/prompts';
import pc from 'picocolors';
import { SingleSwitcher, type Selector } from '@lsst/pik-core';
import { loadConfig } from '../config.js';
import { Scanner, type FileResult } from '../scanner.js';

interface SelectorChoice {
  file: FileResult;
  selector: Selector;
}

function isExitPromptError(error: unknown): boolean {
  return error instanceof Error && error.name === 'ExitPromptError';
}

export const switchCommand = new Command('switch')
  .alias('sw')
  .description('Interactively switch options')
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

    // Flatten all selectors with their file info
    const choices: SelectorChoice[] = [];
    for (const file of results) {
      for (const selector of file.selectors) {
        choices.push({ file, selector });
      }
    }

    let selectedChoice: SelectorChoice;
    let selectedOption: string;

    // Select which selector to switch
    try {
      selectedChoice = await select({
        message: 'Select a selector to switch',
        choices: choices.map((choice) => {
          const relativePath = relative(process.cwd(), choice.file.path);
          const activeOption = choice.selector.options.find((o) => o.isActive);
          const current = activeOption ? pc.dim(` (${activeOption.name})`) : '';

          return {
            name: `${choice.selector.name}${current} ${pc.dim(`- ${relativePath}`)}`,
            value: choice,
          };
        }),
      });
    } catch (error) {
      if (isExitPromptError(error)) {
        return;
      }
      throw error;
    }

    // Select which option to activate
    try {
      selectedOption = await select({
        message: `Select option for ${pc.bold(selectedChoice.selector.name)}`,
        choices: selectedChoice.selector.options.map((option) => ({
          name: option.isActive ? `${option.name} ${pc.green('(current)')}` : option.name,
          value: option.name,
        })),
      });
    } catch (error) {
      if (isExitPromptError(error)) {
        return;
      }
      throw error;
    }

    // Apply the change
    const extension = extname(selectedChoice.file.path);
    const switcher = SingleSwitcher.forExtension(extension);
    const newContent = switcher.switch(
      selectedChoice.file.content,
      selectedChoice.selector,
      selectedOption
    );

    await writeFile(selectedChoice.file.path, newContent);

    const relativePath = relative(process.cwd(), selectedChoice.file.path);
    console.log(
      pc.green(
        `✓ Set ${pc.bold(selectedChoice.selector.name)} to ${pc.bold(selectedOption)} in ${relativePath}`
      )
    );
  });
