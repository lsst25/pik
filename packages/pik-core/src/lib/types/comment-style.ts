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
    // HTML - supports both // (in script) and <!-- --> (in HTML)
    html: new CommentStyle('//', '<!--', '-->'),
    htm: new CommentStyle('//', '<!--', '-->'),
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

  /** Block comment opening (e.g., "<!--") */
  public readonly blockOpen?: string;
  /** Block comment closing (e.g., "-->") */
  public readonly blockClose?: string;

  constructor(
    /** Line comment prefix (e.g., "//", "#") */
    public readonly lineComment: string,
    blockOpen?: string,
    blockClose?: string
  ) {
    this.blockOpen = blockOpen;
    this.blockClose = blockClose;
  }

  /**
   * Check if this style supports block comments
   */
  get hasBlockComments(): boolean {
    return !!(this.blockOpen && this.blockClose);
  }

  /**
   * Get comment style for a file path.
   *
   * Handles dotfiles like `.env`, `.env.local`, `.env.development` correctly.
   */
  static fromFilePath(filePath: string): CommentStyle {
    const basename = filePath.split(/[/\\]/).pop() ?? '';

    // Handle .env files: .env, .env.local, .env.development, etc.
    if (basename === '.env' || basename.startsWith('.env.')) {
      return CommentStyle.styles['env'] ?? CommentStyle.defaultStyle;
    }

    // For regular files, extract extension and use fromExtension
    const lastDot = basename.lastIndexOf('.');
    if (lastDot > 0) {
      const ext = basename.slice(lastDot + 1).toLowerCase();
      return CommentStyle.styles[ext] ?? CommentStyle.defaultStyle;
    }

    return CommentStyle.defaultStyle;
  }

  /**
   * Register a custom comment style for an extension
   */
  static register(extension: string, style: CommentStyle): void {
    const ext = extension.replace(/^\./, '').toLowerCase();
    CommentStyle.styles[ext] = style;
  }
}
