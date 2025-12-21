# pik.nvim

Neovim plugin for [pik](https://www.npmjs.com/package/@lsst/pik) - a tool for switching config options in source files.

## Requirements

- Neovim >= 0.9.0
- [telescope.nvim](https://github.com/nvim-telescope/telescope.nvim)
- `pik` CLI installed globally (`npm install -g @lsst/pik`)

## Installation

### Using lazy.nvim

```lua
{
  "lsst25/pik",
  config = function()
    require("pik").setup({
      cli_path = "pik", -- path to pik CLI (optional)
    })
    require("telescope").load_extension("pik")
  end,
  dependencies = {
    "nvim-telescope/telescope.nvim",
  },
}
```

### Manual Installation

Clone the repository and add the nvim package to your runtimepath:

```lua
vim.opt.runtimepath:append("/path/to/pik/packages/nvim")

require("pik").setup()
require("telescope").load_extension("pik")
```

## Usage

### Commands

- `:Pik` - Open the pik selector picker

### Telescope

```vim
:Telescope pik
```

### Lua API

```lua
-- Open selector picker
require("pik").switch()

-- List all selectors (returns table)
local selectors, err = require("pik").list_selectors()

-- Set a specific option
local success, result = require("pik").set_option("SelectorName", "OptionName")
```

### Keymaps

```lua
vim.keymap.set("n", "<leader>ps", ":Telescope pik<CR>", { desc = "Pik switch" })
```

## How it works

1. Select a selector from the list (shows current active option)
2. Select an option to activate
3. The file is updated and reloaded automatically
