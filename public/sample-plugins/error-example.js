// Error Example Plugin - エラーハンドリングのテスト用

export default {
  name: 'Error Example',
  version: '1.0.0',
  description: 'Plugin that demonstrates error handling',
  author: 'Love Note Team',

  onLoad(api) {
    console.log('Error Example plugin loaded!');

    // 正常なボタン
    api.addButton('Working Button', () => {
      api.showMessage('This button works fine!', 'success');
    });

    // エラーを発生させるボタン
    api.addButton('Error Button', () => {
      throw new Error('This is a test error from the plugin');
    });

    // 警告メッセージを表示するボタン
    api.addButton('Show Warning', () => {
      api.showMessage('This is a warning message', 'warning');
    });

    // エラーメッセージを表示するボタン
    api.addButton('Show Error', () => {
      api.showMessage('This is an error message', 'error');
    });
  },

  onUnload() {
    console.log('Error Example plugin unloaded!');
  },
};
