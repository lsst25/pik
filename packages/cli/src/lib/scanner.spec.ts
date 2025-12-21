import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { Scanner } from './scanner.js';

describe('Scanner', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `pik-scanner-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('should find files with pik selectors', async () => {
    const fileContent = `
// @pik:select Environment
const env = 'DEV'; // @pik:option DEV
// const env = 'LOCAL'; // @pik:option LOCAL
    `.trim();

    await writeFile(join(testDir, 'config.ts'), fileContent);

    const scanner = new Scanner({ include: ['*.ts'] });
    const results = await scanner.scan(testDir);

    expect(results).toHaveLength(1);
    expect(results[0].selectors).toHaveLength(1);
    expect(results[0].selectors[0].name).toBe('Environment');
  });

  it('should return empty array when no selectors found', async () => {
    await writeFile(join(testDir, 'empty.ts'), 'const x = 1;');

    const scanner = new Scanner({ include: ['*.ts'] });
    const results = await scanner.scan(testDir);

    expect(results).toHaveLength(0);
  });

  it('should scan multiple files', async () => {
    const file1 = `
// @pik:select Theme
const theme = 'dark'; // @pik:option dark
    `.trim();

    const file2 = `
// @pik:select Mode
const mode = 'dev'; // @pik:option dev
    `.trim();

    await writeFile(join(testDir, 'theme.ts'), file1);
    await writeFile(join(testDir, 'mode.ts'), file2);

    const scanner = new Scanner({ include: ['*.ts'] });
    const results = await scanner.scan(testDir);

    expect(results).toHaveLength(2);
  });

  it('should respect include patterns', async () => {
    await writeFile(join(testDir, 'included.ts'), '// @pik:select A\nconst a = 1; // @pik:option a');
    await writeFile(join(testDir, 'excluded.js'), '// @pik:select B\nconst b = 1; // @pik:option b');

    const scanner = new Scanner({ include: ['*.ts'] });
    const results = await scanner.scan(testDir);

    expect(results).toHaveLength(1);
    expect(results[0].selectors[0].name).toBe('A');
  });
});
