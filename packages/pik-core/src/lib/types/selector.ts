import type { BaseOption } from './base-option.js';
import type { Option } from './option.js';
import type { BlockOption } from './block-option.js';
import { SingleSwitcher } from '../single-switcher.js';
import { BlockSwitcher } from '../block-switcher.js';

/**
 * Base class for selectors
 */
export abstract class BaseSelector {
  /** Options for this selector */
  abstract readonly options: BaseOption[];

  constructor(
    /** Selector name (e.g., "Environment") */
    public readonly name: string,
    /** Line number where the selector is defined (1-based) */
    public readonly line: number
  ) {}

  /**
   * Get the name of the currently active option, or null if none is active
   */
  getActiveOptionName(): string | null {
    return this.options.find((o) => o.isActive)?.name ?? null;
  }

  /**
   * Check if an option with the given name exists
   */
  optionExists(name: string): boolean {
    return this.options.some((o) => o.name === name);
  }

  /**
   * Switch to a specific option, returning the modified content
   */
  abstract switchTo(content: string, optionName: string, filePath: string): string;
}

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
