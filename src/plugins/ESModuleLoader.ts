// ES Module Loader - プラグインの動的読み込み

import { LoveNotePlugin, PluginDescriptor } from './types';
import { JSXTranspiler, JSXTransformOptions } from './JSXTranspiler';

export function createESModuleLoader() {
  const loadedModules = new Map<string, any>();
  const moduleCache = new Map<string, string>();
  const jsxTranspiler = new JSXTranspiler();

  /**
   * ファイル内容を読み取り
   */
  async function readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * コードの基本的な検証
   */
  function validateCode(code: string): void {
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
   * プラグインIDを生成
   */
  function generatePluginId(fileName: string): string {
    const baseName = fileName.replace(/\.[^/.]+$/, ''); // 拡張子を削除
    const timestamp = Date.now();
    return `${baseName}-${timestamp}`;
  }

  /**
   * プラグイン名を生成
   */
  function generatePluginName(fileName: string): string {
    const baseName = fileName.replace(/\.[^/.]+$/, ''); // 拡張子を削除

    // kebab-case を Title Case に変換
    return baseName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * ファイルがTypeScriptファイルかチェック
   */
  function isTypeScriptFile(fileName: string): boolean {
    const tsExtensions = ['.ts', '.tsx'];
    return tsExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  }

  /**
   * ファイルがJSXファイルかチェック
   */
  function isJSXFile(fileName: string): boolean {
    const jsxExtensions = ['.jsx', '.tsx'];
    return jsxExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  }

  /**
   * コードの前処理（JSXトランスパイル等）
   */
  async function processCode(
    code: string,
    enableTypeScript?: boolean,
    enableJSX?: boolean
  ): Promise<string> {
    try {
      // 拡張子ベースでJSX/TypeScriptを判定
      const hasJSX = enableJSX || jsxTranspiler.containsJSX(code);
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

        const result = await jsxTranspiler.transpile(code, {
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
   * Function constructorを使用した実行（フォールバック）
   */
  function executeWithFunction(code: string, _pluginId: string): any {
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
   * ES Moduleとしてコードを実行
   */
  async function executeModule(code: string, pluginId: string): Promise<any> {
    // ブラウザ環境では直接Function constructorを使用
    // ES Module importは複雑なセキュリティ制約があるため
    return executeWithFunction(code, pluginId);
  }

  /**
   * export default オブジェクトを抽出
   */
  function extractPlugin(module: any): LoveNotePlugin {
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
   * 単一JSファイルからプラグインを読み込み
   */
  async function loadFromFile(file: File): Promise<PluginDescriptor> {
    try {
      const content = await readFileContent(file);
      const pluginId = generatePluginId(file.name);

      // ファイル拡張子からTypeScriptサポートを判定
      const enableTypeScript = isTypeScriptFile(file.name);

      // ファイル拡張子からJSXサポートを判定
      const enableJSX = isJSXFile(file.name);

      return await loadFromCode(
        content,
        pluginId,
        file.name,
        enableTypeScript,
        enableJSX
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
  async function loadFromCode(
    code: string,
    pluginId: string,
    fileName?: string,
    enableTypeScript?: boolean,
    enableJSX?: boolean
  ): Promise<PluginDescriptor> {
    try {
      // コードの基本的な検証
      validateCode(code);

      // JSXトランスパイルを実行
      const processedCode = await processCode(
        code,
        enableTypeScript,
        enableJSX
      );

      // ES Moduleとして実行
      const module = await executeModule(processedCode, pluginId);

      // export default オブジェクトを取得
      const plugin = extractPlugin(module);

      // プラグイン名の自動生成
      const name = plugin.name || generatePluginName(fileName || pluginId);

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
      loadedModules.set(pluginId, module);
      moduleCache.set(pluginId, code);

      return descriptor;
    } catch (error) {
      const descriptor: PluginDescriptor = {
        id: pluginId,
        name: generatePluginName(fileName || pluginId),
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
  async function reloadPlugin(pluginId: string): Promise<PluginDescriptor> {
    const cachedCode = moduleCache.get(pluginId);
    if (!cachedCode) {
      throw new Error(`Plugin ${pluginId} not found in cache`);
    }

    // 古いモジュールを削除
    unloadPlugin(pluginId);

    // リロード時はTypeScript判定なし（元のファイル拡張子情報が不明のため）
    return await loadFromCode(cachedCode, pluginId);
  }

  /**
   * プラグインをアンロード
   */
  function unloadPlugin(pluginId: string): void {
    loadedModules.delete(pluginId);
    // キャッシュは保持（リロード用）
  }

  return {
    loadFromFile,
    loadFromCode,
    reloadPlugin,
    unloadPlugin,
    getLoadedModule: (pluginId: string): any => {
      return loadedModules.get(pluginId);
    },
    getCachedCode: (pluginId: string): string | undefined => {
      return moduleCache.get(pluginId);
    },
    getJSXSupport: (): {
      isEnabled: boolean;
      debugInfo: Record<string, any>;
    } => {
      return {
        isEnabled: true,
        debugInfo: jsxTranspiler.getDebugInfo(),
      };
    },
    processCodeWithOptions: async (
      code: string,
      jsxOptions?: JSXTransformOptions
    ): Promise<string> => {
      if (!jsxTranspiler.containsJSX(code)) {
        return code;
      }

      const result = await jsxTranspiler.transpile(code, jsxOptions);

      if (result.error) {
        throw new Error(`JSX processing error: ${result.error.message}`);
      }

      return result.code;
    },
  };
}
