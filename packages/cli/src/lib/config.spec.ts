import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { loadConfig, defineConfig } from './config.js';

describe('config', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `pik-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('defineConfig', () => {
    it('should return the config as-is', () => {
      const config = defineConfig({ include: ['*.ts'] });
      expect(config).toEqual({ include: ['*.ts'] });
    });
  });

  describe('loadConfig', () => {
    it('should return null when no config file exists', async () => {
      const config = await loadConfig(testDir);
      expect(config).toBeNull();
    });

    it('should load config from pik.config.ts', async () => {
      const configContent = `
        export default { include: ['src/**/*.ts'] };
      `;
      await writeFile(join(testDir, 'pik.config.ts'), configContent);

      const config = await loadConfig(testDir);
      expect(config).toEqual({ include: ['src/**/*.ts'] });
    });

    it('should load config from pik.config.mts', async () => {
      const configContent = `
        export default { include: ['lib/**/*.ts'] };
      `;
      await writeFile(join(testDir, 'pik.config.mts'), configContent);

      const config = await loadConfig(testDir);
      expect(config).toEqual({ include: ['lib/**/*.ts'] });
    });

    it('should prefer pik.config.mts over pik.config.ts', async () => {
      await writeFile(join(testDir, 'pik.config.mts'), `export default { include: ['mts'] };`);
      await writeFile(join(testDir, 'pik.config.ts'), `export default { include: ['ts'] };`);

      const config = await loadConfig(testDir);
      expect(config).toEqual({ include: ['mts'] });
    });

    it('should load config from .pik.config.mts (hidden)', async () => {
      const configContent = `
        export default { include: ['hidden/**/*.ts'] };
      `;
      await writeFile(join(testDir, '.pik.config.mts'), configContent);

      const config = await loadConfig(testDir);
      expect(config).toEqual({ include: ['hidden/**/*.ts'] });
    });
  });
});
