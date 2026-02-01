import { Command } from 'commander';
import { writeFile } from 'fs/promises';
import { relative } from 'path';
import { select, Separator } from '@inquirer/prompts';
import pc from 'picocolors';
import { loadConfig, BlockSelector, type BaseSelector } from '@lsst/pik-core';
import { Scanner, type FileResult } from '../scanner.js';
import { requireSelectConfig } from '../validation/requireSelectConfig.js';
import '../types.js'; // Import for type augmentation

interface SelectorChoice {
  file: FileResult;
  selector: BaseSelector;
}

const BACK_VALUE = Symbol('back');

function isExitPromptError(error: unknown): boolean {
  return error instanceof Error && error.name === 'ExitPromptError';
}

export const switchCommand = new Command('switch')
  .alias('sw')
  .description('Interactively switch options')
  .action(async () => {
    const config = await loadConfig();
    const selectConfig = requireSelectConfig(config);

    const scanner = new Scanner(selectConfig);
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

    // Main loop for navigation
    while (true) {
      let selectedChoice: SelectorChoice | typeof BACK_VALUE;

      // Select which selector to switch
      try {
        selectedChoice = await select({
          message: 'Select a selector to switch',
          choices: [
            ...choices.map((choice) => {
              const relativePath = relative(process.cwd(), choice.file.path);
              const activeOptionName = choice.selector.getActiveOptionName();
              const current = activeOptionName ? pc.dim(` (${activeOptionName})`) : '';
              const blockIndicator = choice.selector instanceof BlockSelector ? pc.dim(' [block]') : '';

              return {
                name: `${choice.selector.name}${blockIndicator}${current} ${pc.dim(`- ${relativePath}`)}`,
                value: choice as SelectorChoice | typeof BACK_VALUE,
              };
            }),
            new Separator(),
            { name: pc.dim('← Back'), value: BACK_VALUE },
          ],
        });
      } catch (error) {
        if (isExitPromptError(error)) {
          process.exit(0);
        }
        throw error;
      }

      if (selectedChoice === BACK_VALUE) {
        return;
      }

      // Select which option to activate
      let selectedOption: string | typeof BACK_VALUE;

      try {
        selectedOption = await select({
          message: `Select option for ${pc.bold(selectedChoice.selector.name)}`,
          choices: [
            ...selectedChoice.selector.options.map((option) => ({
              name: option.isActive ? `${option.name} ${pc.green('(current)')}` : option.name,
              value: option.name as string | typeof BACK_VALUE,
            })),
            new Separator(),
            { name: pc.dim('← Back'), value: BACK_VALUE },
          ],
        });
      } catch (error) {
        if (isExitPromptError(error)) {
          process.exit(0);
        }
        throw error;
      }

      if (selectedOption === BACK_VALUE) {
        continue; // Go back to selector selection
      }

      // Apply the change
      const newContent = selectedChoice.selector.switchTo(
        selectedChoice.file.content,
        selectedOption,
        selectedChoice.file.path
      );
      await writeFile(selectedChoice.file.path, newContent);

      const relativePath = relative(process.cwd(), selectedChoice.file.path);
      console.log(
        pc.green(
          `✓ Set ${pc.bold(selectedChoice.selector.name)} to ${pc.bold(selectedOption)} in ${relativePath}`
        )
      );

      return;
    }
  });
