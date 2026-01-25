import { readFile } from 'fs/promises';
import { glob } from 'glob';
import { Parser, type Selector } from '@lsst/pik-core';
import type { SelectConfig } from './types.js';

export interface FileResult {
  path: string;
  selectors: Selector[];
  content: string;
}

export class Scanner {
  constructor(private readonly config: SelectConfig) {}

  async scan(cwd: string = process.cwd()): Promise<FileResult[]> {
    const files = await glob(this.config.include, {
      cwd,
      absolute: true,
      nodir: true,
    });

    const results: FileResult[] = [];

    for (const filePath of files) {
      const content = await readFile(filePath, 'utf-8');
      const parser = Parser.forFilePath(filePath);
      const { selectors } = parser.parse(content);

      if (selectors.length > 0) {
        results.push({ path: filePath, selectors, content });
      }
    }

    return results;
  }
}
