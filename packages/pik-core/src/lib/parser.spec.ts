import { describe, it, expect } from 'vitest';
import { Parser } from './parser.js';

describe('Parser', () => {
  describe('parse', () => {
    it('should parse a single selector with options', () => {
      const content = `
// @pik:select Environment
// const env = DEV;    // @pik:option DEV
const env = LOCAL;     // @pik:option LOCAL
`.trim();

      const parser = Parser.forExtension('ts');
      const result = parser.parse(content);

      expect(result.selectors).toHaveLength(1);
      expect(result.selectors[0].name).toBe('Environment');
      expect(result.selectors[0].line).toBe(1);
      expect(result.selectors[0].options).toHaveLength(2);
    });

    it('should detect active and inactive options', () => {
      const content = `
// @pik:select Environment
// const env = DEV;    // @pik:option DEV
const env = LOCAL;     // @pik:option LOCAL
`.trim();

      const parser = Parser.forExtension('ts');
      const result = parser.parse(content);

      const [devOption, localOption] = result.selectors[0].options;

      expect(devOption.name).toBe('DEV');
      expect(devOption.isActive).toBe(false);

      expect(localOption.name).toBe('LOCAL');
      expect(localOption.isActive).toBe(true);
    });

    it('should parse multiple selectors', () => {
      const content = `
// @pik:select Environment
// const env = DEV;    // @pik:option DEV
const env = LOCAL;     // @pik:option LOCAL

// @pik:select Theme
const theme = 'dark';   // @pik:option dark
// const theme = 'light'; // @pik:option light
`.trim();

      const parser = Parser.forExtension('ts');
      const result = parser.parse(content);

      expect(result.selectors).toHaveLength(2);
      expect(result.selectors[0].name).toBe('Environment');
      expect(result.selectors[1].name).toBe('Theme');
    });

    it('should handle hash comments for shell files', () => {
      const content = `
# @pik:select Mode
# export MODE=development  # @pik:option development
export MODE=production     # @pik:option production
`.trim();

      const parser = Parser.forExtension('sh');
      const result = parser.parse(content);

      expect(result.selectors).toHaveLength(1);
      expect(result.selectors[0].options[0].isActive).toBe(false);
      expect(result.selectors[0].options[1].isActive).toBe(true);
    });

    it('should handle JS comments in HTML files', () => {
      const content = `
<script type="module">
  // @pik:select Api
  ...api.DEV, // @pik:option Develop
  // ...api.LOCAL, // @pik:option Local
</script>
`.trim();

      const parser = Parser.forExtension('html');
      const result = parser.parse(content);

      expect(result.selectors).toHaveLength(1);
      expect(result.selectors[0].name).toBe('Api');
      expect(result.selectors[0].options[0].name).toBe('Develop');
      expect(result.selectors[0].options[0].isActive).toBe(true);
      expect(result.selectors[0].options[1].name).toBe('Local');
      expect(result.selectors[0].options[1].isActive).toBe(false);
    });

    it('should preserve original content in result', () => {
      const content = '// @pik:select Test\nconst x = 1; // @pik:option A';

      const parser = Parser.forExtension('ts');
      const result = parser.parse(content);

      expect(result.content).toBe(content);
    });
  });
});
