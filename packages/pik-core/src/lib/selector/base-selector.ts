import type { BaseOption } from '../types/base-option.js';

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
