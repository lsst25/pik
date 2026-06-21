import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir, homedir } from 'os';
import { join } from 'path';
import { expandHome, globalConfigDir, loadGlobalConfig } from './global-config.js';

describe('expandHome', () => {
  it('expands a bare ~', () => {
    expect(expandHome('~')).toBe(homedir());
  });

  it('expands a leading ~/', () => {
    expect(expandHome('~/projects/x')).toBe(join(homedir(), 'projects/x'));
  });

  it('leaves absolute and relative paths untouched', () => {
    expect(expandHome('/abs/path')).toBe('/abs/path');
    expect(expandHome('relative/path')).toBe('relative/path');
  });
});

describe('globalConfigDir', () => {
  const original = process.env.XDG_CONFIG_HOME;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.XDG_CONFIG_HOME;
    } else {
      process.env.XDG_CONFIG_HOME = original;
    }
  });

  it('honors XDG_CONFIG_HOME', () => {
    process.env.XDG_CONFIG_HOME = '/custom/xdg';
    expect(globalConfigDir()).toBe('/custom/xdg/pik');
  });

  it('defaults to ~/.config/pik', () => {
    delete process.env.XDG_CONFIG_HOME;
    expect(globalConfigDir()).toBe(join(homedir(), '.config', 'pik'));
  });
});

describe('loadGlobalConfig', () => {
  const original = process.env.XDG_CONFIG_HOME;
  let dir: string;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.XDG_CONFIG_HOME;
    } else {
      process.env.XDG_CONFIG_HOME = original;
    }
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  function withConfig(fileName: string, contents: string): void {
    dir = mkdtempSync(join(tmpdir(), 'pik-global-'));
    process.env.XDG_CONFIG_HOME = dir;
    mkdirSync(join(dir, 'pik'), { recursive: true });
    writeFileSync(join(dir, 'pik', fileName), contents);
  }

  it('returns null when no global config exists', async () => {
    dir = mkdtempSync(join(tmpdir(), 'pik-global-'));
    process.env.XDG_CONFIG_HOME = dir;
    expect(await loadGlobalConfig()).toBeNull();
  });

  it('loads a bare { projects } JSON config', async () => {
    withConfig('config.json', JSON.stringify({ projects: ['~/a', { path: '/b', selectors: ['X'] }] }));
    const config = await loadGlobalConfig();
    expect(config?.projects).toEqual(['~/a', { path: '/b', selectors: ['X'] }]);
  });

  it('unwraps a { global: { projects } } JSON config', async () => {
    withConfig('config.json', JSON.stringify({ global: { projects: ['/a'] } }));
    const config = await loadGlobalConfig();
    expect(config?.projects).toEqual(['/a']);
  });

  it('normalizes a config without projects to an empty array', async () => {
    withConfig('config.json', JSON.stringify({}));
    const config = await loadGlobalConfig();
    expect(config?.projects).toEqual([]);
  });
});
