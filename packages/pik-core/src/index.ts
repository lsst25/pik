// Types
export type { Option, BlockOption, Selector, ParseResult, PikPlugin } from './lib/types/index.js';
export { CommentStyle } from './lib/types/index.js';

// Config
export {
  defineConfig,
  loadConfig,
  findLocalConfig,
  isValidPlugin,
  type PikConfig,
} from './lib/config.js';

// Parser
export { Parser } from './lib/parser.js';

// Switchers
export { Switcher } from './lib/switcher.js';
export { SingleSwitcher } from './lib/single-switcher.js';
export { BlockSwitcher } from './lib/block-switcher.js';

// Base class (for extension)
export { CommentManipulator } from './lib/comment-manipulator.js';
