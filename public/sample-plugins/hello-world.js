// Hello World Plugin - 最小限のプラグイン例

export default {
  name: 'Hello World',
  version: '1.0.0',
  description: 'A simple hello world plugin',
  author: 'Love Note Team',

  onLoad(api) {
    console.log('Hello World plugin loaded!');

    // ツールバーにボタンを追加
    api.addButton('Say Hello', () => {
      api.showMessage('Hello from the Hello World plugin!', 'success');
    });

    // 別のボタンも追加
    api.addButton('Show Info', () => {
      api.showMessage(
        'This is a sample plugin demonstrating the basic API',
        'info'
      );
    });
  },

  onUnload() {
    console.log('Hello World plugin unloaded!');
  },
};
