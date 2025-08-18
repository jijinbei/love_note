// ES Module Loader - プラグインの動的読み込み

import { LoveNotePlugin, PluginDescriptor } from './types';
import { JSXTranspiler, JSXTransformOptions } from './JSXTranspiler';

export class ESModuleLoader {
  private loadedModules = new Map<string, any>();
  private moduleCache = new Map<string, string>();
  private jsxTranspiler: JSXTranspiler;

  constructor() {
    this.jsxTranspiler = new JSXTranspiler();
  }

  /**
   * 単一JSファイルからプラグインを読み込み
   */
  async loadFromFile(file: File): Promise<PluginDescriptor> {
    try {
      const content = await this.readFileContent(file);
      const pluginId = this.generatePluginId(file.name);

      // ファイル拡張子からTypeScriptサポートを判定
      const isTypeScript = this.isTypeScriptFile(file.name);
      
      // ファイル拡張子からJSXサポートを判定
      const isJSX = this.isJSXFile(file.name);

      return await this.loadFromCode(
        content,
        pluginId,
        file.name,
        isTypeScript,
        isJSX
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to load plugin from file: ${errorMessage}`);
    }
  }

  /**
   * コードからプラグインを読み込み
   */
  async loadFromCode(
    code: string,
    pluginId: string,
    fileName?: string,
    enableTypeScript?: boolean,
    enableJSX?: boolean
  ): Promise<PluginDescriptor> {
    try {
      // コードの基本的な検証
      this.validateCode(code);

      // JSXトランスパイルを実行
      const processedCode = await this.processCode(code, enableTypeScript, enableJSX);

      // ES Moduleとして実行
      const module = await this.executeModule(processedCode, pluginId);

      // export default オブジェクトを取得
      const plugin = this.extractPlugin(module);

      // プラグイン名の自動生成
      const name = plugin.name || this.generatePluginName(fileName || pluginId);

      const descriptor: PluginDescriptor = {
        id: pluginId,
        name,
        version: plugin.version || '1.0.0',
        description: plugin.description,
        author: plugin.author,
        source: 'file',
        path: fileName || 'inline',
        module: plugin,
        status: 'loaded',
        loadedAt: new Date(),
      };

      // キャッシュに保存
      this.loadedModules.set(pluginId, module);
      this.moduleCache.set(pluginId, code);

      return descriptor;
    } catch (error) {
      const descriptor: PluginDescriptor = {
        id: pluginId,
        name: this.generatePluginName(fileName || pluginId),
        version: '1.0.0',
        source: 'file',
        path: fileName || 'inline',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        loadedAt: new Date(),
      };

      return descriptor;
    }
  }

  /**
   * プラグインをリロード
   */
  async reloadPlugin(pluginId: string): Promise<PluginDescriptor> {
    const cachedCode = this.moduleCache.get(pluginId);
    if (!cachedCode) {
      throw new Error(`Plugin ${pluginId} not found in cache`);
    }

    // 古いモジュールを削除
    this.unloadPlugin(pluginId);

    // リロード時はTypeScript判定なし（元のファイル拡張子情報が不明のため）
    return await this.loadFromCode(cachedCode, pluginId);
  }

  /**
   * プラグインをアンロード
   */
  unloadPlugin(pluginId: string): void {
    this.loadedModules.delete(pluginId);
    // キャッシュは保持（リロード用）
  }

  /**
   * ファイル内容を読み取り
   */
  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * コードの前処理（JSXトランスパイル等）
   */
  private async processCode(
    code: string,
    enableTypeScript?: boolean,
    enableJSX?: boolean
  ): Promise<string> {
    try {
      // 拡張子ベースでJSX/TypeScriptを判定
      const hasJSX = enableJSX || this.jsxTranspiler.containsJSX(code);
      const hasTypeScript = enableTypeScript || false;

      if (hasJSX || hasTypeScript) {
        if (hasJSX && enableJSX) {
          console.log('JSX file detected, transpiling...');
        } else if (hasJSX) {
          console.log('JSX syntax detected in code, transpiling...');
        }
        if (hasTypeScript) {
          console.log('TypeScript file detected, transpiling...');
        }

        const result = await this.jsxTranspiler.transpile(code, {
          react: {
            version: '19',
            runtime: 'classic',
          },
          typescript: hasTypeScript,
          sourceMaps: false,
        });

        if (result.error) {
          console.error('Transpilation error:', result.error.message);
          if (result.error.snippet) {
            console.error('Error location:\n', result.error.snippet);
          }
          throw new Error(`Transpilation Error: ${result.error.message}`);
        }

        console.log('Transpilation successful');
        return result.code;
      }

      return code;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Code processing failed: ${errorMessage}`);
    }
  }

  /**
   * コードの基本的な検証
   */
  private validateCode(code: string): void {
    // 基本的な構文チェック
    if (!code.trim()) {
      throw new Error('Empty plugin code');
    }

    // export default の存在チェック
    if (!code.includes('export default')) {
      throw new Error('Plugin must have "export default" statement');
    }

    // 危険なパターンのチェック（基本的なもの）
    const dangerousPatterns = [
      /eval\s*\(/,
      /Function\s*\(/,
      /document\.write/,
      /innerHTML\s*=/,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        console.warn(`Potentially dangerous pattern detected: ${pattern}`);
      }
    }
  }

  /**
   * ES Moduleとしてコードを実行
   */
  private async executeModule(code: string, pluginId: string): Promise<any> {
    // ブラウザ環境では直接Function constructorを使用
    // ES Module importは複雑なセキュリティ制約があるため
    return this.executeWithFunction(code, pluginId);
  }

  /**
   * Function constructorを使用した実行（フォールバック）
   */
  private executeWithFunction(code: string, _pluginId: string): any {
    try {
      // ES Module構文をCommonJS風に変換
      let transformedCode = code;

      // export default を return に変換
      transformedCode = transformedCode.replace(
        /export\s+default\s+/,
        'return '
      );

      // import文を削除または置換（基本的なもののみ）
      transformedCode = transformedCode.replace(
        /import\s+.*?from\s+['"][^'"]*['"];?\s*/g,
        ''
      );

      // React環境を構築
      const React = window.React;
      const ReactDOM = window.ReactDOM;

      if (!React) {
        throw new Error(
          'React is not available globally. Please ensure React is loaded.'
        );
      }

      // React Hooksを直接利用可能にする
      const { useState, useEffect, useRef, useMemo, useCallback } = React;

      // Reactなどのグローバル変数が使用可能であることを前提とした実行環境を作成
      const func = new Function(
        'console',
        'React',
        'ReactDOM',
        'useState',
        'useEffect',
        'useRef',
        'useMemo',
        'useCallback',
        transformedCode
      );

      const result = func(
        console,
        React,
        ReactDOM,
        useState,
        useEffect,
        useRef,
        useMemo,
        useCallback
      );

      return { default: result };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to execute plugin code: ${errorMessage}`);
    }
  }

  /**
   * export default オブジェクトを抽出
   */
  private extractPlugin(module: any): LoveNotePlugin {
    const plugin = module.default;

    if (!plugin) {
      throw new Error('Plugin must export a default object');
    }

    if (typeof plugin !== 'object') {
      throw new Error('Plugin default export must be an object');
    }

    if (typeof plugin.onLoad !== 'function') {
      throw new Error('Plugin must have an onLoad function');
    }

    return plugin as LoveNotePlugin;
  }

  /**
   * プラグインIDを生成
   */
  private generatePluginId(fileName: string): string {
    const baseName = fileName.replace(/\.[^/.]+$/, ''); // 拡張子を削除
    const timestamp = Date.now();
    return `${baseName}-${timestamp}`;
  }

  /**
   * プラグイン名を生成
   */
  private generatePluginName(fileName: string): string {
    const baseName = fileName.replace(/\.[^/.]+$/, ''); // 拡張子を削除

    // kebab-case を Title Case に変換
    return baseName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * 読み込み済みモジュールを取得
   */
  getLoadedModule(pluginId: string): any {
    return this.loadedModules.get(pluginId);
  }

  /**
   * キャッシュされたコードを取得
   */
  getCachedCode(pluginId: string): string | undefined {
    return this.moduleCache.get(pluginId);
  }

  /**
   * ファイルがTypeScriptファイルかチェック
   */
  private isTypeScriptFile(fileName: string): boolean {
    const tsExtensions = ['.ts', '.tsx'];
    return tsExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  }

  /**
   * ファイルがJSXファイルかチェック
   */
  private isJSXFile(fileName: string): boolean {
    const jsxExtensions = ['.jsx', '.tsx'];
    return jsxExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  }

  /**
   * JSXサポート情報を取得
   */
  getJSXSupport(): {
    isEnabled: boolean;
    debugInfo: Record<string, any>;
  } {
    return {
      isEnabled: true,
      debugInfo: this.jsxTranspiler.getDebugInfo(),
    };
  }

  /**
   * カスタムJSXオプションでコードを処理
   */
  async processCodeWithOptions(
    code: string,
    jsxOptions?: JSXTransformOptions
  ): Promise<string> {
    if (!this.jsxTranspiler.containsJSX(code)) {
      return code;
    }

    const result = await this.jsxTranspiler.transpile(code, jsxOptions);

    if (result.error) {
      throw new Error(`JSX processing error: ${result.error.message}`);
    }

    return result.code;
  }
}
