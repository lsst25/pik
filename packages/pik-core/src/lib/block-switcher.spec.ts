import { describe, it, expect } from 'vitest';
import { Parser } from './parser.js';
import { BlockSwitcher } from './block-switcher.js';

describe('BlockSwitcher', () => {
  describe('switch', () => {
    it('should switch from one block to another', () => {
      const content = `
// @pik:select Environment
// @pik:block-start Development
API_URL=http://localhost
DEBUG=true
// @pik:block-end
// @pik:block-start Production
// API_URL=https://api.example.com
// DEBUG=false
// @pik:block-end
`.trim();

      const parser = Parser.forFilePath('test.ts');
      const switcher = BlockSwitcher.forFilePath('test.ts');

      const result = parser.parse(content);
      const newContent = switcher.switch(content, result.selectors[0], 'Production');

      const lines = newContent.split('\n');

      // Development block should be commented
      expect(lines[2]).toBe('// API_URL=http://localhost');
      expect(lines[3]).toBe('// DEBUG=true');

      // Production block should be uncommented
      expect(lines[6]).toBe('API_URL=https://api.example.com');
      expect(lines[7]).toBe('DEBUG=false');
    });

    it('should comment out all other blocks when switching', () => {
      const content = `
// @pik:select Size
// @pik:block-start Small
width=100
height=100
// @pik:block-end
// @pik:block-start Medium
// width=200
// height=200
// @pik:block-end
// @pik:block-start Large
// width=300
// height=300
// @pik:block-end
`.trim();

      const parser = Parser.forFilePath('test.ts');
      const switcher = BlockSwitcher.forFilePath('test.ts');

      const result = parser.parse(content);
      const newContent = switcher.switch(content, result.selectors[0], 'Large');

      const lines = newContent.split('\n');

      // Small should be commented
      expect(lines[2]).toBe('// width=100');
      expect(lines[3]).toBe('// height=100');

      // Medium should be commented
      expect(lines[6]).toBe('// width=200');
      expect(lines[7]).toBe('// height=200');

      // Large should be uncommented
      expect(lines[10]).toBe('width=300');
      expect(lines[11]).toBe('height=300');
    });

    it('should throw error for non-existent block option', () => {
      const content = `
// @pik:select Environment
// @pik:block-start Dev
API_URL=localhost
// @pik:block-end
`.trim();

      const parser = Parser.forFilePath('test.ts');
      const switcher = BlockSwitcher.forFilePath('test.ts');

      const result = parser.parse(content);

      expect(() => {
        switcher.switch(content, result.selectors[0], 'INVALID');
      }).toThrow('Block option "INVALID" not found in selector "Environment"');
    });

    it('should preserve indentation when commenting', () => {
      const content = `
// @pik:select Environment
// @pik:block-start Dev
    const url = 'localhost';
    const debug = true;
// @pik:block-end
// @pik:block-start Prod
//     const url = 'prod.com';
//     const debug = false;
// @pik:block-end
`.trim();

      const parser = Parser.forFilePath('test.ts');
      const switcher = BlockSwitcher.forFilePath('test.ts');

      const result = parser.parse(content);
      const newContent = switcher.switch(content, result.selectors[0], 'Prod');

      const lines = newContent.split('\n');

      // Dev should be commented with preserved indentation
      expect(lines[2]).toBe("    // const url = 'localhost';");
      expect(lines[3]).toBe('    // const debug = true;');

      // Prod should be uncommented with preserved indentation
      expect(lines[6]).toBe("    const url = 'prod.com';");
      expect(lines[7]).toBe('    const debug = false;');
    });

    it('should work with hash comments', () => {
      const content = `
# @pik:select Config
# @pik:block-start Dev
URL=localhost
PORT=3000
# @pik:block-end
# @pik:block-start Prod
# URL=prod.com
# PORT=443
# @pik:block-end
`.trim();

      const parser = Parser.forFilePath('test.sh');
      const switcher = BlockSwitcher.forFilePath('test.sh');

      const result = parser.parse(content);
      const newContent = switcher.switch(content, result.selectors[0], 'Prod');

      const lines = newContent.split('\n');

      // Dev should be commented
      expect(lines[2]).toBe('# URL=localhost');
      expect(lines[3]).toBe('# PORT=3000');

      // Prod should be uncommented
      expect(lines[6]).toBe('URL=prod.com');
      expect(lines[7]).toBe('PORT=443');
    });

    it('should work with HTML block comments', () => {
      const content = `
<!-- @pik:select Scripts -->
<!-- @pik:block-start Dev -->
<script src="dev1.js"></script>
<script src="dev2.js"></script>
<!-- @pik:block-end -->
<!-- @pik:block-start Prod -->
<!-- <script src="prod1.js"></script> -->
<!-- <script src="prod2.js"></script> -->
<!-- @pik:block-end -->
`.trim();

      const parser = Parser.forFilePath('test.html');
      const switcher = BlockSwitcher.forFilePath('test.html');

      const result = parser.parse(content);
      const newContent = switcher.switch(content, result.selectors[0], 'Prod');

      const lines = newContent.split('\n');

      // Dev should be commented with block style
      expect(lines[2]).toContain('<!-- <script src="dev1.js"></script>');
      expect(lines[3]).toContain('<!-- <script src="dev2.js"></script>');

      // Prod should be uncommented
      expect(lines[6]).toBe('<script src="prod1.js"></script>');
      expect(lines[7]).toBe('<script src="prod2.js"></script>');
    });

    it('should handle switching to already active block', () => {
      const content = `
// @pik:select Env
// @pik:block-start Dev
URL=localhost
// @pik:block-end
// @pik:block-start Prod
// URL=prod.com
// @pik:block-end
`.trim();

      const parser = Parser.forFilePath('test.ts');
      const switcher = BlockSwitcher.forFilePath('test.ts');

      const result = parser.parse(content);
      const newContent = switcher.switch(content, result.selectors[0], 'Dev');

      const lines = newContent.split('\n');

      // Dev should remain uncommented
      expect(lines[2]).toBe('URL=localhost');

      // Prod should remain commented
      expect(lines[5]).toBe('// URL=prod.com');
    });

    it('should handle blocks with multiple lines of different content', () => {
      const content = `
# @pik:select Database
# @pik:block-start SQLite
DB_TYPE=sqlite
DB_PATH=./data.db
# @pik:block-end
# @pik:block-start Postgres
# DB_TYPE=postgres
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=myapp
# @pik:block-end
`.trim();

      const parser = Parser.forFilePath('.env');
      const switcher = BlockSwitcher.forFilePath('.env');

      const result = parser.parse(content);
      const newContent = switcher.switch(content, result.selectors[0], 'Postgres');

      const lines = newContent.split('\n');

      // SQLite block should be commented
      expect(lines[2]).toBe('# DB_TYPE=sqlite');
      expect(lines[3]).toBe('# DB_PATH=./data.db');

      // Postgres block should be uncommented
      expect(lines[6]).toBe('DB_TYPE=postgres');
      expect(lines[7]).toBe('DB_HOST=localhost');
      expect(lines[8]).toBe('DB_PORT=5432');
      expect(lines[9]).toBe('DB_NAME=myapp');
    });

    it('should handle empty blocks gracefully', () => {
      const content = `
// @pik:select Empty
// @pik:block-start A
// @pik:block-end
// @pik:block-start B
// @pik:block-end
`.trim();

      const parser = Parser.forFilePath('test.ts');
      const switcher = BlockSwitcher.forFilePath('test.ts');

      const result = parser.parse(content);

      // Should not throw when switching between empty blocks
      expect(() => {
        switcher.switch(content, result.selectors[0], 'B');
      }).not.toThrow();
    });
  });
});
