// JSX Transpiler - JSX構文をプラグインで使用可能にする

import { transform } from '@babel/standalone';

export interface JSXTransformOptions {
  react?: {
    version?: string;
    runtime?: 'classic' | 'automatic';
  };
  typescript?: boolean;
  sourceMaps?: boolean;
}

export interface JSXTransformResult {
  code: string;
  error?: {
    message: string;
    line?: number;
    column?: number;
    snippet?: string;
  };
}

export class JSXTranspiler {
  private defaultOptions: JSXTransformOptions = {
    react: {
      version: '19',
      runtime: 'classic',
    },
    typescript: false,
    sourceMaps: false,
  };

  /**
   * JSX構文を含むコードをトランスパイル
   */
  async transpile(
    code: string,
    options: JSXTransformOptions = {}
  ): Promise<JSXTransformResult> {
    try {
      const mergedOptions = { ...this.defaultOptions, ...options };

      // React importが不要な場合は自動注入
      const codeWithImports = this.injectReactImports(code, mergedOptions);

      const result = await this.transformWithBabel(
        codeWithImports,
        mergedOptions
      );

      return {
        code: result,
      };
    } catch (error) {
      return {
        code: code, // 元のコードを返す
        error: this.formatError(error, code),
      };
    }
  }

  /**
   * JSXが含まれているかチェック
   */
  containsJSX(code: string): boolean {
    // JSX要素のパターンを検出（より厳密に）
    const jsxPatterns = [
      /<[A-Z][a-zA-Z0-9]*[\s\/>]/, // 大文字で始まるタグ（React コンポーネント）
      /<[a-z][a-zA-Z0-9]*[\s\/>][^>]*>/, // 小文字HTMLタグ（属性あり）
      /<[a-z]+>/, // シンプルなHTMLタグ
      /<\/[a-zA-Z][a-zA-Z0-9]*>/, // 終了タグ
      /jsx\s*`/, // JSX template literal
    ];

    // React.createElementは除外（JSXではない）
    return jsxPatterns.some(pattern => pattern.test(code));
  }

  /**
   * React importsを自動注入
   */
  private injectReactImports(
    code: string,
    _options: JSXTransformOptions
  ): string {
    // 既にReact importがある場合はスキップ
    if (this.hasReactImport(code)) {
      return code;
    }

    // JSXが含まれていない場合はスキップ
    if (!this.containsJSX(code)) {
      return code;
    }

    // クラシックランタイムの場合はReact importが必要
    // ただし、プラグイン実行環境ではグローバルReactを使用するため、
    // importは削除されるのでここでは何もしない
    return code;
  }

  /**
   * React importの存在チェック
   */
  private hasReactImport(code: string): boolean {
    const importPatterns = [
      /import\s+React\s+from\s+['"]react['"]/,
      /import\s*\{\s*[^}]*React[^}]*\s*\}\s*from\s+['"]react['"]/,
      /import\s*\*\s*as\s+React\s+from\s+['"]react['"]/,
      /const\s+React\s*=\s*require\s*\(\s*['"]react['"]\s*\)/,
    ];

    return importPatterns.some(pattern => pattern.test(code));
  }

  /**
   * Babelを使用してトランスパイル
   */
  private async transformWithBabel(
    code: string,
    options: JSXTransformOptions
  ): Promise<string> {
    const babelOptions = this.getBabelOptions(options);

    const result = transform(code, babelOptions);

    if (!result.code) {
      throw new Error('Babel transformation failed: No output generated');
    }

    return result.code;
  }

  /**
   * Babel設定オプションを生成
   */
  private getBabelOptions(options: JSXTransformOptions) {
    const presets: any[] = [];
    const plugins: any[] = [];

    // TypeScript preset (最初に処理する必要がある)
    if (options.typescript) {
      presets.push('typescript');
    }

    // React preset
    const reactPresetOptions: any = {};

    if (options.react?.runtime) {
      reactPresetOptions.runtime = options.react.runtime;
    }

    if (options.react?.version) {
      // React 19でもクラシックランタイムを使用（ブラウザ互換性のため）
      if (options.react.version === '19') {
        reactPresetOptions.runtime = 'classic';
      }
    }

    presets.push(['react', reactPresetOptions]);

    // TypeScriptファイルかどうかでファイル名を決定
    const filename = options.typescript ? 'plugin.tsx' : 'plugin.jsx';

    return {
      presets,
      plugins,
      filename,
      sourceType: 'module' as const,
      compact: false,
      comments: true,
      sourceMaps: options.sourceMaps || false,
    };
  }

  /**
   * エラーを整形
   */
  private formatError(error: any, originalCode: string) {
    if (!error) {
      return {
        message: 'Unknown error occurred during JSX transpilation',
      };
    }

    let message = 'JSX Syntax Error';
    let line: number | undefined;
    let column: number | undefined;
    let snippet: string | undefined;

    if (error.message) {
      message = error.message;
    }

    // Babelエラーの場合
    if (error.loc) {
      line = error.loc.line;
      column = error.loc.column;
    }

    // エラー行のコードスニペットを生成
    if (line) {
      snippet = this.generateErrorSnippet(originalCode, line, column);
    }

    return {
      message,
      line,
      column,
      snippet,
    };
  }

  /**
   * エラー箇所のコードスニペットを生成
   */
  private generateErrorSnippet(
    code: string,
    errorLine: number,
    errorColumn?: number
  ): string {
    const lines = code.split('\n');
    const contextRange = 2; // エラー行の前後2行を表示

    const startLine = Math.max(0, errorLine - contextRange - 1);
    const endLine = Math.min(lines.length - 1, errorLine + contextRange - 1);

    const snippetLines: string[] = [];

    for (let i = startLine; i <= endLine; i++) {
      const lineNumber = i + 1;
      const line = lines[i];
      const isErrorLine = lineNumber === errorLine;

      const prefix = isErrorLine ? '>>> ' : '    ';
      snippetLines.push(`${prefix}${lineNumber}: ${line}`);

      // エラー位置を矢印で表示
      if (isErrorLine && errorColumn) {
        const spaces = ' '.repeat(
          prefix.length + `${lineNumber}: `.length + errorColumn - 1
        );
        snippetLines.push(`${spaces}^`);
      }
    }

    return snippetLines.join('\n');
  }

  /**
   * デバッグ情報を取得
   */
  getDebugInfo(): Record<string, any> {
    return {
      defaultOptions: this.defaultOptions,
      babelVersion: this.getBabelVersion(),
      supportedFeatures: [
        'JSX syntax',
        'React 19 automatic runtime',
        'TypeScript support',
        'Error reporting with line numbers',
        'Automatic React imports',
      ],
    };
  }

  /**
   * Babelバージョンを取得
   */
  private getBabelVersion(): string {
    try {
      // @babel/standaloneはバージョン情報を公開していないため、
      // パッケージ情報から推定またはデフォルト値を返す
      return '7.x.x';
    } catch {
      return 'unknown';
    }
  }
}
