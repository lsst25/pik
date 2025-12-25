# @lsst/pik

A developer toolkit with extensible plugins for common development tasks.

## Installation

```bash
npm install -g @lsst/pik
```

## Configuration

Create `pik.config.ts` in your project root:

```typescript
export default {
  // Enable select plugin
  select: {
    include: ['src/**/*.ts', '.env'],
  },

  // Enable worktree plugin
  worktree: {
    baseDir: '../',
    copyFiles: ['.env.local'],
    postCreate: 'npm install',
  },
};
```

Plugins are only available when their configuration key is present.

## Built-in Plugins

### Select Plugin

Switch config options in source files using `@pik` markers.

#### 1. Add markers to your files

```typescript
// @pik:select Environment
// const env = 'DEV';     // @pik:option DEV
const env = 'LOCAL';      // @pik:option LOCAL
```

#### 2. Run commands

```bash
pik select              # Interactive mode
pik select list         # List all selectors
pik select set Environment DEV  # Set directly
```

### Worktree Plugin

Manage git worktrees with automatic setup.

```bash
pik worktree              # Interactive mode
pik worktree create       # Create a new worktree
pik worktree list         # List all worktrees
pik worktree remove       # Remove a worktree
```

## External Plugins

Add third-party or custom plugins:

```typescript
import { myPlugin } from 'pik-plugin-my';

export default {
  plugins: [
    myPlugin({ apiKey: 'xxx' }),
  ],
  select: { include: ['src/**/*.ts'] },
};
```

## Commands

### Select

| Command | Alias | Description |
|---------|-------|-------------|
| `pik select` | `sel` | Interactive selection mode |
| `pik select list` | `ls` | Show all selectors and their state |
| `pik select set <selector> <option>` | - | Set an option directly |

### Worktree

| Command | Alias | Description |
|---------|-------|-------------|
| `pik worktree` | `wt` | Interactive worktree menu |
| `pik worktree create [name]` | `add` | Create a new worktree |
| `pik worktree list` | `ls` | List all worktrees |
| `pik worktree remove [path]` | `rm` | Remove a worktree |

## Marker Syntax

- `@pik:select <name>` - Defines a selector group
- `@pik:option <name>` - Marks an option within a selector

Commented lines are inactive, uncommented lines are active.

## Supported Comment Styles

| Extensions | Comment Style |
|------------|---------------|
| `.ts`, `.js`, `.tsx`, `.jsx`, `.mts`, `.mjs` | `//` |
| `.html`, `.htm` | `//` and `<!-- -->` |
| `.sh`, `.bash`, `.zsh`, `.py`, `.yaml`, `.yml`, `.env` | `#` |

## License

MIT
