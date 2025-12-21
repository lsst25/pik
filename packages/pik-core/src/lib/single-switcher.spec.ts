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
  });
});
