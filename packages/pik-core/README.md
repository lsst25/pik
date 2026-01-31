# @lsst/pik-core

Core library for pik - provides parsing, switching, config loading, and plugin types.

## Installation

```bash
npm install @lsst/pik-core
```

## Parsing and Switching

Parse and switch `@pik` config markers in source files:

```typescript
import { Parser, SingleSwitcher } from '@lsst/pik-core';

const content = `
// @pik:select Environment
// const env = 'DEV';    // @pik:option DEV
const env = 'LOCAL';     // @pik:option LOCAL
`;

// Parse content
const parser = Parser.forFilePath('config.ts');
const { selectors } = parser.parse(content);

// Switch option
const switcher = SingleSwitcher.forFilePath('config.ts');
const newContent = switcher.switch(content, selectors[0], 'DEV');
```

## Config Loading

Load pik configuration from project files:

```typescript
import { loadConfig, defineConfig } from '@lsst/pik-core';

// Load config (looks for pik.config.ts, .pikrc, etc.)
const config = await loadConfig();

// Type-safe config definition
export default defineConfig({
  select: { include: ['src/**/*.ts'] },
  worktree: { baseDir: '../' },
});
```

## Creating Plugins

Create custom plugins using the `PikPlugin` interface:

```typescript
import type { Command } from 'commander';
import type { PikPlugin } from '@lsst/pik-core';

interface MyPluginConfig {
  apiKey: string;
}

export function myPlugin(config: MyPluginConfig): PikPlugin {
  return {
    name: 'My Plugin',
    description: 'Does something cool',
    command: 'my',
    aliases: ['m'],

    register(program: Command) {
      program
        .command('my')
        .alias('m')
        .description('My custom command')
        .action(() => {
          console.log(`Using: ${config.apiKey}`);
        });
    },
  };
}
```

## API

### Parser

```typescript
// Create parser for file path
const parser = Parser.forFilePath('src/config.ts');

// Parse content
const result = parser.parse(content);
// result.selectors: Selector[]
// result.content: string
```

### SingleSwitcher

```typescript
// Create switcher for file path
const switcher = SingleSwitcher.forFilePath('src/config.ts');

// Switch to option (deactivates all others)
const newContent = switcher.switch(content, selector, 'optionName');
```

### CommentStyle

```typescript
import { CommentStyle } from '@lsst/pik-core';

// Get comment style for file path
const style = CommentStyle.fromFilePath('script.py'); // { lineComment: '#' }

// Register custom style
CommentStyle.register('custom', new CommentStyle(';;'));
```

### isValidPlugin

```typescript
import { isValidPlugin } from '@lsst/pik-core';

// Validate a plugin object
if (isValidPlugin(obj)) {
  // obj is PikPlugin
}
```

## Types

```typescript
interface Selector {
  name: string;
  line: number;
  options: Option[];
}

interface Option {
  name: string;
  line: number;
  content: string;
  isActive: boolean;
}

interface PikPlugin {
  name: string;
  description: string;
  command: string;
  aliases?: string[];
  register: (program: Command) => void;
}

interface PikConfig {
  plugins?: PikPlugin[];
  [pluginName: string]: unknown;
}
```

## License

MIT
