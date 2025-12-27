import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import type { PikPlugin } from '@lsst/pik-core';

// Mock the config and plugins before importing program
vi.mock('@lsst/pik-core', async () => {
  const actual = await vi.importActual<typeof import('@lsst/pik-core')>('@lsst/pik-core');
  return {
    ...actual,
    loadConfig: vi.fn(),
  };
});

vi.mock('@lsst/pik-plugin-select', () => ({
  selectPlugin: {
    name: 'Select',
    description: 'Mock select plugin',
    command: 'select',
    register: vi.fn(),
  },
}));

vi.mock('@lsst/pik-plugin-worktree', () => ({
  worktreePlugin: {
    name: 'Worktree',
    description: 'Mock worktree plugin',
    command: 'worktree',
    register: vi.fn(),
  },
}));

describe('program', () => {
  let loadConfigMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetModules();
    const pikCore = await import('@lsst/pik-core');
    loadConfigMock = pikCore.loadConfig as ReturnType<typeof vi.fn>;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initializeProgram', () => {
    it('should return empty array when no config exists', async () => {
      loadConfigMock.mockResolvedValue(null);

      const { initializeProgram } = await import('./program.js');
      const plugins = await initializeProgram();

      expect(plugins).toEqual([]);
    });

    it('should load built-in plugins when their config keys exist', async () => {
      loadConfigMock.mockResolvedValue({
        select: { include: ['*.ts'] },
      });

      const { initializeProgram } = await import('./program.js');
      const plugins = await initializeProgram();

      expect(plugins).toHaveLength(1);
      expect(plugins[0].command).toBe('select');
    });

    it('should load multiple built-in plugins when configured', async () => {
      loadConfigMock.mockResolvedValue({
        select: { include: ['*.ts'] },
        worktree: { baseDir: '../' },
      });

      const { initializeProgram } = await import('./program.js');
      const plugins = await initializeProgram();

      expect(plugins).toHaveLength(2);
      expect(plugins.map((p) => p.command)).toContain('select');
      expect(plugins.map((p) => p.command)).toContain('worktree');
    });

    it('should load external plugins from plugins array', async () => {
      const externalPlugin: PikPlugin = {
        name: 'External Plugin',
        description: 'Test external plugin',
        command: 'external',
        register: vi.fn(),
      };

      loadConfigMock.mockResolvedValue({
        plugins: [externalPlugin],
      });

      const { initializeProgram } = await import('./program.js');
      const plugins = await initializeProgram();

      expect(plugins).toHaveLength(1);
      expect(plugins[0].name).toBe('External Plugin');
      expect(plugins[0].command).toBe('external');
    });

    it('should combine built-in and external plugins', async () => {
      const externalPlugin: PikPlugin = {
        name: 'External Plugin',
        description: 'Test external plugin',
        command: 'external',
        register: vi.fn(),
      };

      loadConfigMock.mockResolvedValue({
        plugins: [externalPlugin],
        select: { include: ['*.ts'] },
      });

      const { initializeProgram } = await import('./program.js');
      const plugins = await initializeProgram();

      expect(plugins).toHaveLength(2);
      expect(plugins.map((p) => p.command)).toContain('select');
      expect(plugins.map((p) => p.command)).toContain('external');
    });

    it('should register external plugins with the program', async () => {
      const registerFn = vi.fn();
      const externalPlugin: PikPlugin = {
        name: 'External Plugin',
        description: 'Test external plugin',
        command: 'external',
        register: registerFn,
      };

      loadConfigMock.mockResolvedValue({
        plugins: [externalPlugin],
      });

      const { initializeProgram } = await import('./program.js');
      await initializeProgram();

      expect(registerFn).toHaveBeenCalledTimes(1);
      expect(registerFn).toHaveBeenCalledWith(expect.any(Command));
    });

    it('should skip invalid plugins and log error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const invalidPlugin = {
        name: 'Invalid',
        // missing description, command, register
      };

      loadConfigMock.mockResolvedValue({
        plugins: [invalidPlugin],
      });

      const { initializeProgram } = await import('./program.js');
      const plugins = await initializeProgram();

      expect(plugins).toHaveLength(0);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should load multiple external plugins', async () => {
      const plugin1: PikPlugin = {
        name: 'Plugin 1',
        description: 'First plugin',
        command: 'first',
        register: vi.fn(),
      };
      const plugin2: PikPlugin = {
        name: 'Plugin 2',
        description: 'Second plugin',
        command: 'second',
        register: vi.fn(),
      };

      loadConfigMock.mockResolvedValue({
        plugins: [plugin1, plugin2],
      });

      const { initializeProgram } = await import('./program.js');
      const plugins = await initializeProgram();

      expect(plugins).toHaveLength(2);
      expect(plugins[0].command).toBe('first');
      expect(plugins[1].command).toBe('second');
    });

    it('should handle plugin factory pattern (function returning plugin)', async () => {
      // This simulates: myPlugin({ config: 'value' }) in the config
      const pluginFactory = (config: { apiKey: string }): PikPlugin => ({
        name: 'Factory Plugin',
        description: `Plugin with key: ${config.apiKey}`,
        command: 'factory',
        register: vi.fn(),
      });

      const factoryPlugin = pluginFactory({ apiKey: 'test-key' });

      loadConfigMock.mockResolvedValue({
        plugins: [factoryPlugin],
      });

      const { initializeProgram } = await import('./program.js');
      const plugins = await initializeProgram();

      expect(plugins).toHaveLength(1);
      expect(plugins[0].name).toBe('Factory Plugin');
      expect(plugins[0].description).toBe('Plugin with key: test-key');
    });
  });
});
