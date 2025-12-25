# Pik

A developer toolkit with extensible plugins for common development tasks.

## Installation

### CLI

```bash
npm install -g @lsst/pik
```

### Neovim Plugin

See [pik.nvim](https://github.com/lsst25/pik.nvim)

## Configuration

Create a `pik.config.ts` (or `.pik.config.ts`) in your project root:

```typescript
export default {
  // Enable select plugin
  select: {
    include: ["src/**/*.ts", "*.env"],
  },

  // Enable worktree plugin
  worktree: {
    baseDir: "../",
    copyFiles: [".env.local"],
    postCreate: "npm install",
  },
};
```

Plugins are enabled by adding their configuration key. If a plugin key is missing, that plugin won't be available.

## Built-in Plugins

### Select Plugin

Switch config options in source files using comment markers.

#### Usage

1. Add markers to your code:

**Inline style** - marker on the same line:

```typescript
// @pik:select Environment
const API_URL = "https://dev.example.com"; // @pik:option Development
// const API_URL = "https://staging.example.com"; // @pik:option Staging
// const API_URL = "https://example.com"; // @pik:option Production
```

**Standalone style** - marker on its own line, content on the next line:

```html
<!-- @pik:select Viewer -->
<!-- @pik:option Develop -->
<script src="https://dev.example.com/viewer.js"></script>
<!-- @pik:option Local -->
<!-- <script src="http://localhost:3000/viewer.js"></script> -->
```

2. Run:

```bash
pik select              # Interactive mode
pik select list         # List all selectors
pik select set Environment Production  # Set directly
```

#### Supported File Types

- JavaScript/TypeScript (`.js`, `.ts`, `.jsx`, `.tsx`, `.mjs`, `.mts`) - `//` comments
- HTML (`.html`, `.htm`) - `//` and `<!-- -->` comments
- Shell (`.sh`, `.bash`, `.zsh`) - `#` comments
- Python (`.py`) - `#` comments
- YAML (`.yaml`, `.yml`) - `#` comments
- Env files (`.env`) - `#` comments

### Worktree Plugin

Manage git worktrees with automatic setup.

#### Usage

```bash
pik worktree              # Interactive mode
pik worktree create       # Create a new worktree
pik worktree list         # List all worktrees
pik worktree remove       # Remove a worktree
```

#### Configuration

```typescript
export default {
  worktree: {
    baseDir: "../",                    // Where to create worktrees
    copyFiles: [".env.local", ".pik.config.*"],  // Files to copy
    postCreate: "npm install",         // Run after creation
  },
};
```

## External Plugins

You can use third-party or custom plugins:

```typescript
import { myPlugin } from "pik-plugin-my";
import { localPlugin } from "./my-local-plugin.js";

export default {
  // External plugins with their config
  plugins: [
    myPlugin({ apiKey: "xxx", timeout: 5000 }),
    localPlugin({ enabled: true }),
  ],

  // Built-in plugins
  select: { include: ["src/**/*.ts"] },
};
```

### Creating a Plugin

```typescript
import type { Command } from "commander";
import type { PikPlugin } from "@lsst/pik-core";

interface MyPluginConfig {
  apiKey: string;
}

export function myPlugin(config: MyPluginConfig): PikPlugin {
  return {
    name: "My Plugin",
    description: "Does something cool",
    command: "my",

    register(program: Command) {
      program
        .command("my")
        .description("My custom command")
        .action(() => {
          console.log(`Using: ${config.apiKey}`);
        });
    },
  };
}
```

## Packages

| Package | Description |
|---------|-------------|
| [`@lsst/pik`](https://www.npmjs.com/package/@lsst/pik) | CLI tool (install this globally) |
| [`@lsst/pik-core`](https://www.npmjs.com/package/@lsst/pik-core) | Core library for parsing, switching, and plugin API |
| [`@lsst/pik-plugin-select`](https://www.npmjs.com/package/@lsst/pik-plugin-select) | Select plugin - switch config options in source files |
| [`@lsst/pik-plugin-worktree`](https://www.npmjs.com/package/@lsst/pik-plugin-worktree) | Worktree plugin - manage git worktrees |

## License

MIT
