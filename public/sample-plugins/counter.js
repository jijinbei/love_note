// Counter Plugin - 状態を持つプラグインの例

export default {
  name: 'Counter',
  version: '1.0.0',
  description: 'A simple counter plugin with state',
  author: 'Love Note Team',

  onLoad(api) {
    let count = 0;

    console.log('Counter plugin loaded!');

    // カウンターを表示するボタン
    api.addButton('Show Count', () => {
      api.showMessage(`Current count: ${count}`, 'info');
    });

    // カウンターを増やすボタン
    api.addButton('Increment', () => {
      count++;
      api.showMessage(`Count increased to: ${count}`, 'success');
    });

    // カウンターをリセットするボタン
    api.addButton('Reset Counter', () => {
      count = 0;
      api.showMessage('Counter reset to 0', 'warning');
    });
  },

  onUnload() {
    console.log('Counter plugin unloaded!');
  },

  onReload(api, previousState) {
    console.log('Counter plugin reloaded!', previousState);
    // TODO: 状態復元機能を実装
  },
};
