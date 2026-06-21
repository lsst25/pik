import { Command } from 'commander';
import { writeFile } from 'fs/promises';
import { relative } from 'path';
import pc from 'picocolors';
import { loadConfig } from '@lsst/pik-core';
import { Scanner } from '../scanner.js';
import { collectGlobalSelectors } from '../global-selectors.js';
import '../types.js'; // Import for type augmentation

export const setCommand = new Command('set')
  .description('Set a specific option for a selector')
  .argument('<selector>', 'Selector name (use "project:selector" for a global switch)')
  .argument('<option>', 'Option to activate')
  .action(async (selectorName: string, optionName: string) => {
    // Global form: "project:selector" routes the write to the owning project.
    const colonIdx = selectorName.indexOf(':');
    if (colonIdx > 0) {
      const projectLabel = selectorName.slice(0, colonIdx);
      const bareName = selectorName.slice(colonIdx + 1);
      const handled = await trySetGlobal(projectLabel, bareName, optionName);
      if (handled) {
        return;
      }
      // Not a known global project — fall back to treating the whole string as a local name.
    }

    await setLocal(selectorName, optionName);
  });

async function trySetGlobal(
  projectLabel: string,
  bareName: string,
  optionName: string
): Promise<boolean> {
  const items = await collectGlobalSelectors();
  const matches = items.filter(
    (item) => item.project === projectLabel && item.selector.name === bareName
  );

  if (matches.length === 0) {
    return false;
  }

  for (const item of matches) {
    try {
      const newContent = item.selector.switchTo(item.content, optionName, item.file);
      await writeFile(item.file, newContent);
      console.log(
        pc.green(
          `✓ Set ${pc.bold(`${projectLabel}:${bareName}`)} to ${pc.bold(optionName)} in ${item.file}`
        )
      );
    } catch (error) {
      if (error instanceof Error) {
        console.error(pc.red(error.message));
      }
      process.exit(1);
    }
  }

  return true;
}

async function setLocal(selectorName: string, optionName: string): Promise<void> {
  const config = await loadConfig();

  if (!config?.select) {
    console.error(pc.red(`Selector "${selectorName}" not found`));
    process.exit(1);
  }

  const scanner = new Scanner(config.select);
  const results = await scanner.scan();

  let found = false;

  for (const file of results) {
    const selector = file.selectors.find((s) => s.name === selectorName);

    if (selector) {
      found = true;

      try {
        const newContent = selector.switchTo(file.content, optionName, file.path);
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
}
