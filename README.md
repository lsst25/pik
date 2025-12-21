# Pik

A tool for switching config options in source files using comment markers.

## Installation

### CLI

```bash
npm install -g @lsst/pik
```

### Neovim Plugin

Using [lazy.nvim](https://github.com/folke/lazy.nvim):

```lua
{
  "lsst25/pik",
  dependencies = { "nvim-telescope/telescope.nvim" },
  build = "npm install -g @lsst/pik",
  config = function()
    require("pik").setup()
    require("telescope").load_extension("pik")
  end,
  keys = {
    { "<leader>ps", "<cmd>Telescope pik<cr>", desc = "Pik switch" },
  },
}
```

## Usage

### 1. Add markers to your code

```typescript
// @pik:select Environment
const API_URL = "https://dev.example.com"; // @pik:option Development
// const API_URL = "https://staging.example.com"; // @pik:option Staging
// const API_URL = "https://example.com"; // @pik:option Production
```

### 2. Create a config file

Create `pik.config.mts` in your project root:

```typescript
export default {
  include: ["src/**/*.ts", "*.html"],
};
```

### 3. Switch options

**CLI:**
```bash
pik switch        # Interactive mode
pik list          # List all selectors
pik set Environment Production  # Set directly
```

**Neovim:**
Press `<leader>ps` to open the Telescope picker.

## Supported File Types

- JavaScript/TypeScript (`.js`, `.ts`, `.jsx`, `.tsx`, `.mjs`, `.mts`)
- HTML (`.html`, `.htm`) - for script tags
- Shell (`.sh`, `.bash`, `.zsh`)
- Python (`.py`)
- YAML (`.yaml`, `.yml`)
- Env files (`.env`)

## Packages

- [`@lsst/pik`](https://www.npmjs.com/package/@lsst/pik) - CLI tool
- [`@lsst/pik-core`](https://www.npmjs.com/package/@lsst/pik-core) - Core library

## License

MIT
