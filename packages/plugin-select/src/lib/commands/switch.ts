import { Command } from 'commander';
import { writeFile } from 'fs/promises';
import { relative } from 'path';
import { select, Separator } from '@inquirer/prompts';
import pc from 'picocolors';
import { SingleSwitcher, BlockSwitcher, loadConfig, type Selector } from '@lsst/pik-core';
import { Scanner, type FileResult } from '../scanner.js';
import { requireSelectConfig } from '../validation/requireSelectConfig.js';
import '../types.js'; // Import for type augmentation

interface SelectorChoice {
  file: FileResult;
  selector: Selector;
}

const BACK_VALUE = Symbol('back');

function isExitPromptError(error: unknown): boolean {
  return error instanceof Error && error.name === 'ExitPromptError';
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
 * Get all options for a selector (works for both single and block options)
 */
function getAllOptions(selector: Selector): Array<{ name: string; isActive: boolean }> {
  if (hasBlockOptions(selector)) {
    return selector.blockOptions.map((b) => ({ name: b.name, isActive: b.isActive }));
  }
  return selector.options.map((o) => ({ name: o.name, isActive: o.isActive }));
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
              const activeOptionName = getActiveOptionName(choice.selector);
              const current = activeOptionName ? pc.dim(` (${activeOptionName})`) : '';
              const blockIndicator = hasBlockOptions(choice.selector) ? pc.dim(' [block]') : '';

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
      const allOptions = getAllOptions(selectedChoice.selector);

      try {
        selectedOption = await select({
          message: `Select option for ${pc.bold(selectedChoice.selector.name)}`,
          choices: [
            ...allOptions.map((option) => ({
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

      // Apply the change using the appropriate switcher
      let newContent: string;

      if (hasBlockOptions(selectedChoice.selector)) {
        const switcher = BlockSwitcher.forFilePath(selectedChoice.file.path);
        newContent = switcher.switch(
          selectedChoice.file.content,
          selectedChoice.selector,
          selectedOption
        );
      } else {
        const switcher = SingleSwitcher.forFilePath(selectedChoice.file.path);
        newContent = switcher.switch(
          selectedChoice.file.content,
          selectedChoice.selector,
          selectedOption
        );
      }

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
