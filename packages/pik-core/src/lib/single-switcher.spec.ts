import { describe, it, expect } from 'vitest';
import { Parser } from './parser.js';
import { SingleSwitcher } from './single-switcher.js';

describe('SingleSwitcher', () => {
  describe('switch', () => {
    it('should switch from one option to another', () => {
      const content = `
// @pik:select Environment
// const env = DEV;    // @pik:option DEV
const env = LOCAL;     // @pik:option LOCAL
`.trim();

      const parser = Parser.forExtension('ts');
      const switcher = SingleSwitcher.forExtension('ts');

      const result = parser.parse(content);
      const newContent = switcher.switch(content, result.selectors[0], 'DEV');

      expect(newContent).toContain('const env = DEV;');
      expect(newContent).toContain('// const env = LOCAL;');
    });

    it('should comment out all other options when switching', () => {
      const content = `
// @pik:select Size
const size = 'small';  // @pik:option small
// const size = 'medium'; // @pik:option medium
// const size = 'large';  // @pik:option large
`.trim();

      const parser = Parser.forExtension('ts');
      const switcher = SingleSwitcher.forExtension('ts');

      const result = parser.parse(content);
      const newContent = switcher.switch(content, result.selectors[0], 'large');

      const lines = newContent.split('\n');
      expect(lines[1]).toMatch(/^\/\/ const size = 'small'/);
      expect(lines[2]).toMatch(/^\/\/ const size = 'medium'/);
      expect(lines[3]).toMatch(/^const size = 'large'/);
    });

    it('should throw error for non-existent option', () => {
      const content = `
// @pik:select Environment
const env = LOCAL; // @pik:option LOCAL
`.trim();

      const parser = Parser.forExtension('ts');
      const switcher = SingleSwitcher.forExtension('ts');

      const result = parser.parse(content);

      expect(() => {
        switcher.switch(content, result.selectors[0], 'INVALID');
      }).toThrow('Option "INVALID" not found in selector "Environment"');
    });

    it('should preserve indentation when commenting', () => {
      const content = `
// @pik:select Environment
    const env = DEV;    // @pik:option DEV
    // const env = LOCAL; // @pik:option LOCAL
`.trim();

      const parser = Parser.forExtension('ts');
      const switcher = SingleSwitcher.forExtension('ts');

      const result = parser.parse(content);
      const newContent = switcher.switch(content, result.selectors[0], 'LOCAL');

      const lines = newContent.split('\n');
      expect(lines[1]).toBe('    // const env = DEV;    // @pik:option DEV');
      expect(lines[2]).toBe('    const env = LOCAL; // @pik:option LOCAL');
    });

    it('should work with hash comments', () => {
      const content = `
# @pik:select Mode
export MODE=development  # @pik:option development
# export MODE=production # @pik:option production
`.trim();

      const parser = Parser.forExtension('sh');
      const switcher = SingleSwitcher.forExtension('sh');

      const result = parser.parse(content);
      const newContent = switcher.switch(
        content,
        result.selectors[0],
        'production'
      );

      expect(newContent).toContain('# export MODE=development');
      expect(newContent).toContain('export MODE=production');
    });

    it('should work with HTML block comments', () => {
      const content = `
<!-- @pik:select Theme -->
<link rel="stylesheet" href="dark.css"> <!-- @pik:option Dark -->
<!-- <link rel="stylesheet" href="light.css"> --> <!-- @pik:option Light -->
`.trim();

      const parser = Parser.forExtension('html');
      const switcher = SingleSwitcher.forExtension('html');

      const result = parser.parse(content);
      const newContent = switcher.switch(content, result.selectors[0], 'Light');

      expect(newContent).toContain('<!-- <link rel="stylesheet" href="dark.css">');
      expect(newContent).toContain('<link rel="stylesheet" href="light.css">');
      expect(newContent).not.toContain('// <link');
    });

    it('should preserve HTML block comment style when switching', () => {
      const content = `
<!-- @pik:select Script -->
<!-- <script src="dev.js"></script> --> <!-- @pik:option Dev -->
<script src="prod.js"></script> <!-- @pik:option Prod -->
`.trim();

      const parser = Parser.forExtension('html');
      const switcher = SingleSwitcher.forExtension('html');

      const result = parser.parse(content);
      const newContent = switcher.switch(content, result.selectors[0], 'Dev');

      const lines = newContent.split('\n');
      // Active line should be uncommented
      expect(lines[1]).toBe('<script src="dev.js"></script> <!-- @pik:option Dev -->');
      // Inactive line should use block comment style
      expect(lines[2]).toContain('<!-- <script src="prod.js"></script>');
      expect(lines[2]).toContain('-->');
    });

    it('should switch standalone HTML block comment markers', () => {
      const content = `
<!-- @pik:select Viewer -->
<!-- @pik:option DevelopV2 -->
<script src="https://assets.develop.expivi.net/viewer/v2/viewer.js"></script>
<!-- @pik:option Local -->
<!-- <script src="http://localhost:3000/viewer.js"></script> -->
`.trim();

      const parser = Parser.forExtension('html');
      const switcher = SingleSwitcher.forExtension('html');

      const result = parser.parse(content);
      const newContent = switcher.switch(content, result.selectors[0], 'Local');

      const lines = newContent.split('\n');
      // Marker lines should be unchanged
      expect(lines[1]).toBe('<!-- @pik:option DevelopV2 -->');
      expect(lines[3]).toBe('<!-- @pik:option Local -->');
      // Content lines should be switched
      expect(lines[2]).toContain('<!-- <script src="https://assets.develop.expivi.net');
      expect(lines[4]).toBe('<script src="http://localhost:3000/viewer.js"></script>');
    });

    it('should switch standalone line comment markers', () => {
      const content = `
# @pik:select Mode
# @pik:option Production
export MODE=production
# @pik:option Development
# export MODE=development
`.trim();

      const parser = Parser.forExtension('sh');
      const switcher = SingleSwitcher.forExtension('sh');

      const result = parser.parse(content);
      const newContent = switcher.switch(
        content,
        result.selectors[0],
        'Development'
      );

      const lines = newContent.split('\n');
      // Marker lines should be unchanged
      expect(lines[1]).toBe('# @pik:option Production');
      expect(lines[3]).toBe('# @pik:option Development');
      // Content lines should be switched
      expect(lines[2]).toBe('# export MODE=production');
      expect(lines[4]).toBe('export MODE=development');
    });
  });
});
