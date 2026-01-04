// Types
export type { Option, Selector, ParseResult, PikPlugin } from './lib/types/index.js';
export { CommentStyle } from './lib/types/index.js';

// Config
export {
  defineConfig,
  loadConfig,
  isValidPlugin,
  type PikConfig,
} from './lib/config.js';
export { CONFIG_FILES } from './lib/config-files.js';

// Parser
export { Parser } from './lib/parser.js';

// Switchers
export { Switcher } from './lib/switcher.js';
export { SingleSwitcher } from './lib/single-switcher.js';

// Base class (for extension)
export { CommentManipulator } from './lib/comment-manipulator.js';
