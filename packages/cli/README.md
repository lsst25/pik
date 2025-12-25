# @lsst/pik

A developer toolkit with extensible plugins for common development tasks.

## Installation

```bash
npm install -g @lsst/pik
```

## Plugins

### Select Plugin

Switch config options in source files using `@pik` markers.

#### 1. Add markers to your files

```typescript
// @pik:select Environment
// const env = 'DEV';     // @pik:option DEV
const env = 'LOCAL';      // @pik:option LOCAL
```

#### 2. Create a config file

Create `pik.config.ts` in your project root:

```typescript
import { defineConfig } from '@lsst/pik';

export default defineConfig({
  select: {
    include: ['src/**/*.ts', '.env'],
  },
});
```

#### 3. Run commands

```bash
# Interactive mode
pik select

# List all selectors
pik select list

# Set a specific option
pik select set Environment DEV
```

## Commands

| Command | Alias | Description |
|---------|-------|-------------|
| `pik select` | `sel` | Interactive selection mode |
| `pik select list` | `ls` | Show all selectors and their state |
| `pik select set <selector> <option>` | - | Set an option directly |

## Marker Syntax

- `@pik:select <name>` - Defines a selector group
- `@pik:option <name>` - Marks an option within a selector

Commented lines are inactive, uncommented lines are active.

## Supported Comment Styles

| Extensions | Comment Style |
|------------|---------------|
| `.ts`, `.js`, `.tsx`, `.jsx` | `//` |
| `.sh`, `.bash`, `.zsh`, `.py`, `.yaml`, `.yml`, `.env` | `#` |

## License

MIT
