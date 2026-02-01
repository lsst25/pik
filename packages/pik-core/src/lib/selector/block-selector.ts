import type { BlockOption } from '../types/block-option.js';
import { BlockSwitcher } from '../block-switcher.js';
import { BaseSelector } from './base-selector.js';

/**
 * Selector with multi-line block options
 */
export class BlockSelector extends BaseSelector {
  readonly options: BlockOption[] = [];

  constructor(name: string, line: number) {
    super(name, line);
  }

  switchTo(content: string, optionName: string, filePath: string): string {
    const switcher = BlockSwitcher.forFilePath(filePath);
    return switcher.switch(content, this, optionName);
  }
}
