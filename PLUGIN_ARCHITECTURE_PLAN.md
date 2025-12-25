# Pik Plugin Architecture Migration Plan

## Overview

Transform pik from a single-purpose config switcher into an extensible developer toolkit with a plugin architecture.

---

## Phase 1: Migrate to Plugin Architecture

### Current Structure
```
packages/
  cli/        → @lsst/pik (commands: switch, list, set)
  pik-core/   → @lsst/pik-core (parser, switcher logic)
```

### Target Structure
```
packages/
  cli/            → @lsst/pik (plugin loader + main menu)
  pik-core/       → @lsst/pik-core (shared utilities + existing logic)
  plugin-select/  → @lsst/pik-plugin-select (config switching)
```

### Steps

1. **Add Plugin Interface to `pik-core`**
   ```typescript
   // packages/pik-core/src/plugin.ts
   export interface PikPlugin {
     name: string;
     description: string;
     command: string;
     aliases?: string[];
     run: (args: string[]) => Promise<void>;
   }
   ```

2. **Create `plugin-select` package**
   - Move command logic from `cli/src/lib/commands/` to `plugin-select`
   - Implement PikPlugin interface
   - Commands become subcommands: `pik select`, `pik select list`, `pik select set`

3. **Refactor CLI as Plugin Loader**
   - Load plugins dynamically or via explicit imports
   - `pik` with no args → interactive menu showing available plugins
   - `pik <plugin>` → run that plugin
   - Extract reusable utilities to `pik-core`:
     - Config file loading
     - Interactive prompts helpers
     - Terminal output styling

4. **Update pik.nvim**
   - Update to use `pik select --json` instead of `pik list --json`

### Command Mapping

| Before | After |
|--------|-------|
| `pik` | `pik` (menu) or `pik select` |
| `pik switch` | `pik select` |
| `pik list` | `pik select list` |
| `pik set X Y` | `pik select set X Y` |

---

## Phase 2: Add Worktree Plugin

### Naming Options

| Name | Command | Pros | Cons |
|------|---------|------|------|
| `worktree` | `pik worktree` | Descriptive, git terminology | Long |
| `branch` | `pik branch` | Short, familiar | Conflicts with git concept |
| `workspace` | `pik workspace` | Clear meaning | Long, overloaded term |
| `tree` | `pik tree` | Short | Ambiguous |
| `work` | `pik work` | Short, action-oriented | Vague |
| `clone` | `pik clone` | Describes action | Conflicts with git clone |
| `fork` | `pik fork` | Short, implies copy | GitHub connotation |
| `spawn` | `pik spawn` | Action-oriented, unique | Gaming connotation |
| `split` | `pik split` | Describes branching | Could imply file splitting |

**Recommendation**: `worktree` or `work` - explicit and short respectively.

### Target Structure
```
packages/
  cli/             → @lsst/pik
  pik-core/        → @lsst/pik-core
  plugin-select/   → @lsst/pik-plugin-select
  plugin-worktree/ → @lsst/pik-plugin-worktree (or chosen name)
```

### Plugin Functionality

```bash
pik worktree                    # Interactive: choose branch, name, options
pik worktree <name>             # Quick create from current branch
pik worktree <name> -b <branch> # Create from specific branch
pik worktree list               # List existing worktrees
pik worktree remove <name>      # Remove worktree
```

### Features to Implement

1. **Create worktree**
   - `git worktree add`
   - Copy untracked files (configurable list)
   - Run `npm install` / `pnpm install` / `yarn`
   - Copy `.env` files (optional, configurable)

2. **Configuration** (`pik.config.ts`)
   ```typescript
   export default {
     select: {
       include: ["src/**/*.ts"],
     },
     worktree: {
       copyUntracked: [".env.local", ".env.development"],
       postCreate: "npm install",
       baseDir: "../",  // where to create worktrees
     },
   };
   ```

3. **List worktrees**
   - Show existing worktrees with status
   - Current branch, clean/dirty state

4. **Remove worktree**
   - `git worktree remove`
   - Optionally delete branch

---

## Phase 3: Future Plugins (Ideas)

| Plugin | Command | Description |
|--------|---------|-------------|
| `plugin-env` | `pik env` | Manage .env files, switch environments |
| `plugin-clean` | `pik clean` | Clean node_modules, build artifacts, caches |
| `plugin-deps` | `pik deps` | Analyze/update dependencies |
| `plugin-scaffold` | `pik new` | Generate boilerplate (components, etc.) |

---

## Technical Considerations

### Plugin Discovery

**Option A: Explicit imports (simpler)**
```typescript
// packages/cli/src/plugins.ts
import selectPlugin from '@lsst/pik-plugin-select';
import worktreePlugin from '@lsst/pik-plugin-worktree';

export const plugins = [selectPlugin, worktreePlugin];
```

**Option B: Dynamic discovery (extensible)**
```typescript
// Scan node_modules for @lsst/pik-plugin-* packages
// Allow user plugins via config
```

**Recommendation**: Start with Option A, migrate to B if needed.

### Shared Utilities (`@lsst/pik-core`)

```typescript
// Config loading
export { loadConfig, defineConfig } from './config';

// Terminal UI
export { createSpinner, confirm, select, input } from './prompts';
export { colors, log, error, success } from './output';

// Git utilities
export { getRepoRoot, getCurrentBranch, isClean } from './git';

// File utilities
export { copyFiles, findFiles } from './files';
```

### Versioning Strategy

- All packages versioned together (NX release handles this)
- Breaking changes bump major version for all
- Plugins depend on compatible `@lsst/pik-core` version

---

## Migration Checklist

### Phase 1
- [x] Add plugin interface to pik-core
- [x] Create plugin-select package
- [x] Move select/list/set commands to plugin-select
- [x] Refactor CLI as plugin loader
- [x] Add main menu when running `pik` without args
- [x] Move config loading to pik-core (unified config per plugin)
- [x] Add backward-compatible aliases for pik.nvim
- [x] Update README
- [x] Test everything works
- [ ] Publish new versions

### Phase 2
- [ ] Decide on plugin name (worktree/work/etc.)
- [ ] Create plugin-worktree package
- [ ] Implement create worktree command
- [ ] Implement list command
- [ ] Implement remove command
- [ ] Add configuration options
- [ ] Update README
- [ ] Publish

---

## Open Questions

1. Should `pik select` still work as shorthand for `pik select switch`?
2. Should plugins be peer dependencies or bundled?
3. Should there be a `pik plugin add` command for future extensibility?
4. What's the best name for the worktree plugin?
