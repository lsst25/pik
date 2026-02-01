import type { Option } from '../types/option.js';
import { SingleSwitcher } from '../single-switcher.js';
import { BaseSelector } from './base-selector.js';

/**
 * Selector with single-line options
 */
export class Selector extends BaseSelector {
  readonly options: Option[] = [];

  constructor(name: string, line: number) {
    super(name, line);
  }

  switchTo(content: string, optionName: string, filePath: string): string {
    const switcher = SingleSwitcher.forFilePath(filePath);
    return switcher.switch(content, this, optionName);
  }
}
