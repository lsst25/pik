/**
 * Comment style configuration for different file types
 */
export class CommentStyle {
  private static readonly styles: Record<string, CommentStyle> = {
    // JavaScript/TypeScript
    js: new CommentStyle('//'),
    ts: new CommentStyle('//'),
    jsx: new CommentStyle('//'),
    tsx: new CommentStyle('//'),
    mjs: new CommentStyle('//'),
    mts: new CommentStyle('//'),
    // HTML (for script tags)
    html: new CommentStyle('//'),
    htm: new CommentStyle('//'),
    // Config files
    yaml: new CommentStyle('#'),
    yml: new CommentStyle('#'),
    // Shell
    sh: new CommentStyle('#'),
    bash: new CommentStyle('#'),
    zsh: new CommentStyle('#'),
    // Python
    py: new CommentStyle('#'),
    // Env files
    env: new CommentStyle('#'),
  };

  private static readonly defaultStyle = new CommentStyle('//');

  constructor(
    /** Line comment prefix (e.g., "//", "#") */
    public readonly lineComment: string
  ) {}

  /**
   * Get comment style for a file extension
   */
  static fromExtension(extension: string): CommentStyle {
    const ext = extension.replace(/^\./, '').toLowerCase();
    return CommentStyle.styles[ext] ?? CommentStyle.defaultStyle;
  }

  /**
   * Register a custom comment style for an extension
   */
  static register(extension: string, style: CommentStyle): void {
    const ext = extension.replace(/^\./, '').toLowerCase();
    CommentStyle.styles[ext] = style;
  }
}
