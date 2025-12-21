# @lsst25/pik

CLI tool for switching config options in source files using `@pik` markers.

## Installation

```bash
npm install -g @lsst25/pik
```

## Usage

### 1. Add markers to your files

```typescript
// @pik:select Environment
// const env = 'DEV';     // @pik:option DEV
const env = 'LOCAL';      // @pik:option LOCAL
```

### 2. Create a config file

Create `pik.config.ts` in your project root:

```typescript
import { defineConfig } from '@lsst25/pik';

export default defineConfig({
  include: ['src/**/*.ts', '.env'],
});
```

### 3. Run commands

```bash
# List all selectors and their current state
pik list

# Set a specific option
pik set Environment DEV

# Interactive mode
pik switch
```

## Commands

| Command | Alias | Description |
|---------|-------|-------------|
| `pik list` | `ls` | Show all selectors and their current state |
| `pik set <selector> <option>` | - | Set an option directly |
| `pik switch` | `sw` | Interactive selection mode |
| `pik` | - | Same as `pik switch` |

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
