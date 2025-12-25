# Pik

A developer toolkit with extensible plugins for common development tasks.

## Installation

### CLI

```bash
npm install -g @lsst/pik
```

### Neovim Plugin

See [pik.nvim](https://github.com/lsst25/pik.nvim)

## Plugins

### Select Plugin

Switch config options in source files using comment markers.

#### Usage

1. Add markers to your code:

```typescript
// @pik:select Environment
const API_URL = "https://dev.example.com"; // @pik:option Development
// const API_URL = "https://staging.example.com"; // @pik:option Staging
// const API_URL = "https://example.com"; // @pik:option Production
```

2. Create a config file (`pik.config.ts`):

```typescript
import { defineConfig } from "@lsst/pik";

export default defineConfig({
  select: {
    include: ["src/**/*.ts", "*.html"],
  },
});
```

3. Switch options:

```bash
pik select              # Interactive mode
pik select list         # List all selectors
pik select set Environment Production  # Set directly
```

#### Supported File Types

- JavaScript/TypeScript (`.js`, `.ts`, `.jsx`, `.tsx`, `.mjs`, `.mts`)
- HTML (`.html`, `.htm`) - for script tags
- Shell (`.sh`, `.bash`, `.zsh`)
- Python (`.py`)
- YAML (`.yaml`, `.yml`)
- Env files (`.env`)

## Packages

- [`@lsst/pik`](https://www.npmjs.com/package/@lsst/pik) - CLI tool
- [`@lsst/pik-core`](https://www.npmjs.com/package/@lsst/pik-core) - Core library
- [`@lsst/pik-plugin-select`](https://www.npmjs.com/package/@lsst/pik-plugin-select) - Select plugin

## License

MIT
