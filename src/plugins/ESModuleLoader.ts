// ES Module Loader - プラグインの動的読み込み

import { LoveNotePlugin, PluginDescriptor } from './types';

export class ESModuleLoader {
  private loadedModules = new Map<string, any>();
  private moduleCache = new Map<string, string>();

  /**
   * 単一JSファイルからプラグインを読み込み
   */
  async loadFromFile(file: File): Promise<PluginDescriptor> {
    try {
      const content = await this.readFileContent(file);
      const pluginId = this.generatePluginId(file.name);

      return await this.loadFromCode(content, pluginId, file.name);
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
    fileName?: string
  ): Promise<PluginDescriptor> {
    try {
      // コードの基本的な検証
      this.validateCode(code);

      // ES Moduleとして実行
      const module = await this.executeModule(code, pluginId);

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

    // 再読み込み
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
    try {
      // Blob URLを使用してES Moduleとして実行
      const blob = new Blob([code], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);

      try {
        const module = await import(url);
        return module;
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      // フォールバック: Function constructorを使用（制限付き）
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.warn(
        `Failed to load as ES Module, falling back to Function constructor: ${errorMessage}`
      );
      return this.executeWithFunction(code, pluginId);
    }
  }

  /**
   * Function constructorを使用した実行（フォールバック）
   */
  private executeWithFunction(code: string, _pluginId: string): any {
    try {
      // export default を return に変換
      const transformedCode = code.replace(/export\s+default\s+/, 'return ');

      // 安全な実行環境を作成
      const func = new Function('console', transformedCode);
      const result = func(console);

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
}
