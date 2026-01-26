import { describe, it, expect } from 'vitest';
import { CommentStyle } from './comment-style.js';

describe('CommentStyle', () => {
  describe('fromFilePath', () => {
    it('should return hash comment for .env file', () => {
      const style = CommentStyle.fromFilePath('/path/to/.env');
      expect(style.lineComment).toBe('#');
    });

    it('should return hash comment for .env.local file', () => {
      const style = CommentStyle.fromFilePath('/path/to/.env.local');
      expect(style.lineComment).toBe('#');
    });

    it('should return hash comment for .env.development file', () => {
      const style = CommentStyle.fromFilePath('/path/to/.env.development');
      expect(style.lineComment).toBe('#');
    });

    it('should return hash comment for .env.production file', () => {
      const style = CommentStyle.fromFilePath('.env.production');
      expect(style.lineComment).toBe('#');
    });

    it('should return hash comment for .env.test file', () => {
      const style = CommentStyle.fromFilePath('/project/.env.test');
      expect(style.lineComment).toBe('#');
    });

    it('should return slash comment for regular .js file', () => {
      const style = CommentStyle.fromFilePath('/path/to/file.js');
      expect(style.lineComment).toBe('//');
    });

    it('should return slash comment for regular .ts file', () => {
      const style = CommentStyle.fromFilePath('src/index.ts');
      expect(style.lineComment).toBe('//');
    });

    it('should return hash comment for .yml file', () => {
      const style = CommentStyle.fromFilePath('/config/app.yml');
      expect(style.lineComment).toBe('#');
    });

    it('should return hash comment for .sh file', () => {
      const style = CommentStyle.fromFilePath('scripts/build.sh');
      expect(style.lineComment).toBe('#');
    });

    it('should handle Windows-style paths', () => {
      const style = CommentStyle.fromFilePath('C:\\projects\\app\\.env.local');
      expect(style.lineComment).toBe('#');
    });

    it('should return default style for file without extension', () => {
      const style = CommentStyle.fromFilePath('/path/to/Makefile');
      expect(style.lineComment).toBe('//');
    });

    it('should not match files that just contain env in the name', () => {
      const style = CommentStyle.fromFilePath('/path/to/environment.ts');
      expect(style.lineComment).toBe('//');
    });
  });
});
