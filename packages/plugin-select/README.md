# @lsst/pik-plugin-select

Select plugin for pik - switch config options in source files using `@pik` markers.

## Installation

This plugin is included with `@lsst/pik` by default.

```bash
npm install -g @lsst/pik
```

## Usage

### 1. Add markers to your files

```typescript
// @pik:select Environment
const API_URL = "https://dev.example.com"; // @pik:option DEV
// const API_URL = "https://example.com"; // @pik:option PROD
```

### 2. Configure in `pik.config.ts`

```typescript
import { defineConfig } from '@lsst/pik';

export default defineConfig({
  select: {
    include: ['src/**/*.ts', '.env'],
  },
});
```

### 3. Run commands

```bash
pik select              # Interactive mode
pik select list         # List all selectors
pik select set <name> <option>  # Set directly
```

## Marker Syntax

- `@pik:select <name>` - Defines a selector group
- `@pik:option <name>` - Marks an option within a selector

## Supported File Types

| Extensions | Comment Style |
|------------|---------------|
| `.ts`, `.js`, `.tsx`, `.jsx`, `.mts`, `.mjs` | `//` |
| `.html`, `.htm` | `<!-- -->` |
| `.sh`, `.bash`, `.zsh`, `.py`, `.yaml`, `.yml`, `.env` | `#` |

## License

MIT
