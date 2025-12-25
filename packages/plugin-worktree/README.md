# @lsst/pik-plugin-worktree

Git worktree management plugin for pik - easily create, list, and remove git worktrees.

## Installation

This plugin is included with `@lsst/pik` by default.

```bash
npm install -g @lsst/pik
```

## Usage

```bash
# Interactive create (default)
pik worktree

# Create with specific name
pik worktree create my-feature

# Create new branch
pik worktree create my-feature -n -b feature/new-thing

# List all worktrees
pik worktree list

# Remove a worktree
pik worktree remove
```

## Configuration

Add to your `pik.config.ts`:

```typescript
import { defineConfig } from '@lsst/pik';

export default defineConfig({
  worktree: {
    // Directory where worktrees are created (relative to repo root)
    baseDir: '../',

    // Files to copy to new worktrees
    copyFiles: ['.env.local', '.env.development'],

    // Command to run after creating worktree
    postCreate: 'npm install',
  },
});
```

## Commands

| Command | Alias | Description |
|---------|-------|-------------|
| `pik worktree` | `wt` | Interactive worktree creation |
| `pik worktree create [name]` | `add` | Create a new worktree |
| `pik worktree list` | `ls` | List all worktrees |
| `pik worktree remove [path]` | `rm` | Remove a worktree |

### Create Options

| Option | Description |
|--------|-------------|
| `-b, --branch <branch>` | Branch to checkout or create |
| `-n, --new` | Create a new branch |

### Remove Options

| Option | Description |
|--------|-------------|
| `-f, --force` | Force removal even if dirty |
| `-D, --delete-branch` | Also delete the branch |

## License

MIT
