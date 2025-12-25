import type { Command } from 'commander';

/**
 * Plugin interface for pik CLI plugins.
 */
export interface PikPlugin {
  /** Display name of the plugin */
  name: string;

  /** Short description shown in help and menu */
  description: string;

  /** Command name used to invoke the plugin (e.g., "select", "worktree") */
  command: string;

  /** Alternative command names */
  aliases?: string[];

  /**
   * Register the plugin's commands with the CLI.
   * @param program - The commander program or command to attach to
   */
  register: (program: Command) => void;
}
