import { describe, it, expect } from 'vitest';
import { Parser } from './parser.js';
import { Selector, BlockSelector } from './types/index.js';

describe('Parser', () => {
  describe('forFilePath', () => {
    it('should parse .env files with hash comments', () => {
      const content = `
# @pik:select API
# API_URL=http://localhost:3000  # @pik:option Local
API_URL=https://api.example.com  # @pik:option Production
`.trim();

      const parser = Parser.forFilePath('/project/.env');
      const result = parser.parse(content);

      expect(result.selectors).toHaveLength(1);
      expect(result.selectors[0].name).toBe('API');
      const selector = result.selectors[0] as Selector;
      expect(selector.options[0].isActive).toBe(false);
      expect(selector.options[1].isActive).toBe(true);
    });

    it('should parse .env.local files with hash comments', () => {
      const content = `
# @pik:select Database
# DB_HOST=localhost  # @pik:option Local
DB_HOST=db.example.com  # @pik:option Production
`.trim();

      const parser = Parser.forFilePath('/project/.env.local');
      const result = parser.parse(content);

      expect(result.selectors).toHaveLength(1);
      const selector = result.selectors[0] as Selector;
      expect(selector.options[0].isActive).toBe(false);
      expect(selector.options[1].isActive).toBe(true);
    });

    it('should parse .env.development files with hash comments', () => {
      const content = `
# @pik:select Mode
DEBUG=true  # @pik:option Debug
# DEBUG=false  # @pik:option NoDebug
`.trim();

      const parser = Parser.forFilePath('.env.development');
      const result = parser.parse(content);

      expect(result.selectors).toHaveLength(1);
      const selector = result.selectors[0] as Selector;
      expect(selector.options[0].isActive).toBe(true);
    });

    it('should parse regular .ts files with slash comments', () => {
      const content = `
// @pik:select Env
const env = 'dev'; // @pik:option Dev
// const env = 'prod'; // @pik:option Prod
`.trim();

      const parser = Parser.forFilePath('/project/src/config.ts');
      const result = parser.parse(content);

      expect(result.selectors).toHaveLength(1);
      const selector = result.selectors[0] as Selector;
      expect(selector.options[0].isActive).toBe(true);
      expect(selector.options[1].isActive).toBe(false);
    });
  });

  describe('parse', () => {
    it('should parse a single selector with options', () => {
      const content = `
// @pik:select Environment
// const env = DEV;    // @pik:option DEV
const env = LOCAL;     // @pik:option LOCAL
`.trim();

      const parser = Parser.forFilePath('test.ts');
      const result = parser.parse(content);

      expect(result.selectors).toHaveLength(1);
      expect(result.selectors[0].name).toBe('Environment');
      expect(result.selectors[0].line).toBe(1);
      const selector = result.selectors[0] as Selector;
      expect(selector.options).toHaveLength(2);
    });

    it('should detect active and inactive options', () => {
      const content = `
// @pik:select Environment
// const env = DEV;    // @pik:option DEV
const env = LOCAL;     // @pik:option LOCAL
`.trim();

      const parser = Parser.forFilePath('test.ts');
      const result = parser.parse(content);

      const selector = result.selectors[0] as Selector;
      const [devOption, localOption] = selector.options;

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

      const parser = Parser.forFilePath('test.ts');
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

      const parser = Parser.forFilePath('test.sh');
      const result = parser.parse(content);

      expect(result.selectors).toHaveLength(1);
      const selector = result.selectors[0] as Selector;
      expect(selector.options[0].isActive).toBe(false);
      expect(selector.options[1].isActive).toBe(true);
    });

    it('should handle JS comments in HTML files', () => {
      const content = `
<script type="module">
  // @pik:select Api
  ...api.DEV, // @pik:option Develop
  // ...api.LOCAL, // @pik:option Local
</script>
`.trim();

      const parser = Parser.forFilePath('test.html');
      const result = parser.parse(content);

      expect(result.selectors).toHaveLength(1);
      expect(result.selectors[0].name).toBe('Api');
      const selector = result.selectors[0] as Selector;
      expect(selector.options[0].name).toBe('Develop');
      expect(selector.options[0].isActive).toBe(true);
      expect(selector.options[1].name).toBe('Local');
      expect(selector.options[1].isActive).toBe(false);
    });

    it('should handle HTML block comments', () => {
      const content = `
<!-- @pik:select Theme -->
<link rel="stylesheet" href="dark.css"> <!-- @pik:option Dark -->
<!-- <link rel="stylesheet" href="light.css"> --> <!-- @pik:option Light -->
`.trim();

      const parser = Parser.forFilePath('test.html');
      const result = parser.parse(content);

      expect(result.selectors).toHaveLength(1);
      expect(result.selectors[0].name).toBe('Theme');
      const selector = result.selectors[0] as Selector;
      expect(selector.options).toHaveLength(2);
      expect(selector.options[0].name).toBe('Dark');
      expect(selector.options[0].isActive).toBe(true);
      expect(selector.options[1].name).toBe('Light');
      expect(selector.options[1].isActive).toBe(false);
    });

    it('should handle mixed JS and HTML comments in HTML files', () => {
      const content = `
<!-- @pik:select Stylesheet -->
<link rel="stylesheet" href="main.css"> <!-- @pik:option Main -->
<!-- <link rel="stylesheet" href="alt.css"> --> <!-- @pik:option Alt -->

<script>
  // @pik:select Api
  const api = 'prod'; // @pik:option Prod
  // const api = 'dev'; // @pik:option Dev
</script>
`.trim();

      const parser = Parser.forFilePath('test.html');
      const result = parser.parse(content);

      expect(result.selectors).toHaveLength(2);
      expect(result.selectors[0].name).toBe('Stylesheet');
      expect(result.selectors[1].name).toBe('Api');
    });

    it('should preserve original content in result', () => {
      const content = '// @pik:select Test\nconst x = 1; // @pik:option A';

      const parser = Parser.forFilePath('test.ts');
      const result = parser.parse(content);

      expect(result.content).toBe(content);
    });

    it('should handle standalone HTML block comment markers', () => {
      const content = `
<!-- @pik:select Viewer -->
<!-- @pik:option DevelopV2 -->
<script src="https://assets.develop.expivi.net/viewer/v2/viewer.js"></script>
<!-- @pik:option Local -->
<!-- <script src="http://localhost:3000/viewer.js"></script> -->
`.trim();

      const parser = Parser.forFilePath('test.html');
      const result = parser.parse(content);

      expect(result.selectors).toHaveLength(1);
      expect(result.selectors[0].name).toBe('Viewer');
      const selector = result.selectors[0] as Selector;
      expect(selector.options).toHaveLength(2);

      const [developV2, local] = selector.options;

      // DevelopV2: marker on line 2, content on line 3
      expect(developV2.name).toBe('DevelopV2');
      expect(developV2.line).toBe(2);
      expect(developV2.contentLine).toBe(3);
      expect(developV2.isActive).toBe(true);
      expect(developV2.content).toContain('assets.develop.expivi.net');

      // Local: marker on line 4, content on line 5
      expect(local.name).toBe('Local');
      expect(local.line).toBe(4);
      expect(local.contentLine).toBe(5);
      expect(local.isActive).toBe(false);
      expect(local.content).toContain('localhost:3000');
    });

    it('should handle standalone line comment markers', () => {
      const content = `
# @pik:select Mode
# @pik:option Production
export MODE=production
# @pik:option Development
# export MODE=development
`.trim();

      const parser = Parser.forFilePath('test.sh');
      const result = parser.parse(content);

      expect(result.selectors).toHaveLength(1);
      const selector = result.selectors[0] as Selector;
      const [prod, dev] = selector.options;

      expect(prod.name).toBe('Production');
      expect(prod.line).toBe(2);
      expect(prod.contentLine).toBe(3);
      expect(prod.isActive).toBe(true);

      expect(dev.name).toBe('Development');
      expect(dev.line).toBe(4);
      expect(dev.contentLine).toBe(5);
      expect(dev.isActive).toBe(false);
    });

    it('should set contentLine same as line for inline markers', () => {
      const content = `
// @pik:select Env
const env = 'dev'; // @pik:option Dev
`.trim();

      const parser = Parser.forFilePath('test.ts');
      const result = parser.parse(content);

      const selector = result.selectors[0] as Selector;
      const option = selector.options[0];
      expect(option.line).toBe(2);
      expect(option.contentLine).toBe(2);
    });

    it('should parse block options with block-start and block-end', () => {
      const content = `
// @pik:select Environment
// @pik:block-start Development
API_URL=http://localhost
DEBUG=true
PORT=3000
// @pik:block-end
// @pik:block-start Production
// API_URL=https://api.example.com
// DEBUG=false
// PORT=443
// @pik:block-end
`.trim();

      const parser = Parser.forFilePath('test.ts');
      const result = parser.parse(content);

      expect(result.selectors).toHaveLength(1);
      expect(result.selectors[0].name).toBe('Environment');
      expect(result.selectors[0]).toBeInstanceOf(BlockSelector);
      const selector = result.selectors[0] as BlockSelector;
      expect(selector.options).toHaveLength(2);

      const [dev, prod] = selector.options;

      expect(dev.name).toBe('Development');
      expect(dev.startLine).toBe(2);
      expect(dev.endLine).toBe(6);
      expect(dev.contentLines).toEqual([3, 4, 5]);
      expect(dev.isActive).toBe(true);

      expect(prod.name).toBe('Production');
      expect(prod.startLine).toBe(7);
      expect(prod.endLine).toBe(11);
      expect(prod.contentLines).toEqual([8, 9, 10]);
      expect(prod.isActive).toBe(false);
    });

    it('should detect active block based on first content line', () => {
      const content = `
# @pik:select Config
# @pik:block-start Dev
# URL=localhost
# PORT=3000
# @pik:block-end
# @pik:block-start Prod
URL=prod.com
PORT=443
# @pik:block-end
`.trim();

      const parser = Parser.forFilePath('test.sh');
      const result = parser.parse(content);

      const selector = result.selectors[0] as BlockSelector;
      const [dev, prod] = selector.options;

      expect(dev.isActive).toBe(false);
      expect(prod.isActive).toBe(true);
    });

    it('should handle empty blocks', () => {
      const content = `
// @pik:select Empty
// @pik:block-start A
// @pik:block-end
// @pik:block-start B
// @pik:block-end
`.trim();

      const parser = Parser.forFilePath('test.ts');
      const result = parser.parse(content);

      const selector = result.selectors[0] as BlockSelector;
      expect(selector.options).toHaveLength(2);
      expect(selector.options[0].contentLines).toEqual([]);
      expect(selector.options[0].isActive).toBe(false);
    });

    it('should handle single-line blocks', () => {
      const content = `
// @pik:select Single
// @pik:block-start A
const x = 1;
// @pik:block-end
// @pik:block-start B
// const x = 2;
// @pik:block-end
`.trim();

      const parser = Parser.forFilePath('test.ts');
      const result = parser.parse(content);

      const selector = result.selectors[0] as BlockSelector;
      const [a, b] = selector.options;

      expect(a.contentLines).toEqual([3]);
      expect(a.isActive).toBe(true);

      expect(b.contentLines).toEqual([6]);
      expect(b.isActive).toBe(false);
    });

    it('should handle block options with HTML comments', () => {
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
      const result = parser.parse(content);

      const selector = result.selectors[0] as BlockSelector;
      expect(selector.options).toHaveLength(2);

      const [dev, prod] = selector.options;

      expect(dev.name).toBe('Dev');
      expect(dev.isActive).toBe(true);

      expect(prod.name).toBe('Prod');
      expect(prod.isActive).toBe(false);
    });

    it('should create Selector for single-line options and BlockSelector for block options', () => {
      const content = `
// @pik:select Env
const env = 'dev'; // @pik:option Dev
// const env = 'prod'; // @pik:option Prod
`.trim();

      const parser = Parser.forFilePath('test.ts');
      const result = parser.parse(content);

      expect(result.selectors[0]).toBeInstanceOf(Selector);
      expect(result.selectors[0]).not.toBeInstanceOf(BlockSelector);
      const selector = result.selectors[0] as Selector;
      expect(selector.options).toHaveLength(2);
    });
  });
});
