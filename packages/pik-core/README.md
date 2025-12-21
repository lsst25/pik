# @lsst25/pik-core

Core library for parsing and switching `@pik` config markers in source files.

## Installation

```bash
npm install @lsst25/pik-core
```

## Usage

```typescript
import { Parser, SingleSwitcher } from '@lsst25/pik-core';

const content = `
// @pik:select Environment
// const env = 'DEV';    // @pik:option DEV
const env = 'LOCAL';     // @pik:option LOCAL
`;

// Parse content
const parser = Parser.forExtension('ts');
const { selectors } = parser.parse(content);

// Switch option
const switcher = SingleSwitcher.forExtension('ts');
const newContent = switcher.switch(content, selectors[0], 'DEV');
```

## API

### Parser

```typescript
// Create parser for file extension
const parser = Parser.forExtension('ts');

// Parse content
const result = parser.parse(content);
// result.selectors: Selector[]
// result.content: string
```

### SingleSwitcher

```typescript
// Create switcher for file extension
const switcher = SingleSwitcher.forExtension('ts');

// Switch to option (deactivates all others)
const newContent = switcher.switch(content, selector, 'optionName');
```

### CommentStyle

```typescript
import { CommentStyle } from '@lsst25/pik-core';

// Get comment style for extension
const style = CommentStyle.fromExtension('py'); // { lineComment: '#' }

// Register custom style
CommentStyle.register('custom', new CommentStyle(';;'));
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
```

## License

MIT
