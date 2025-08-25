// Hello World Plugin - 最小限のプラグイン例（新API対応）

let pluginAPI = null; // グローバル参照でAPIスコープ問題解決

export default {
  name: 'Hello World',
  version: '1.0.0',
  description: 'A simple hello world plugin with new sidebar API',
  author: 'Love Note Team',

  onLoad(api) {
    pluginAPI = api;
    console.log('Hello World plugin loaded!');

    // サイドバーアイテムとしてプラグインUI追加
    const HelloWorldComponent = () => {
      const [message, setMessage] = React.useState('');
      const [messageType, setMessageType] = React.useState('info');

      const sayHello = () => {
        setMessage('Hello from the Hello World plugin!');
        setMessageType('success');
        console.log('Hello from the Hello World plugin!');
      };

      const showInfo = () => {
        setMessage('This is a sample plugin demonstrating the basic API');
        setMessageType('info');
        console.log('Showing plugin info');
      };

      const clearMessage = () => {
        setMessage('');
      };

      return React.createElement(
        'div',
        { className: 'p-4 space-y-4' },
        React.createElement(
          'div',
          { className: 'text-center' },
          React.createElement(
            'h2',
            { className: 'text-2xl font-bold text-gray-800 mb-4' },
            '👋 Hello World Plugin'
          ),
          React.createElement(
            'p',
            { className: 'text-gray-600 mb-6' },
            'Welcome to the Hello World plugin! This demonstrates the basic usage of the new plugin system.'
          )
        ),

        React.createElement(
          'div',
          { className: 'space-y-3' },
          React.createElement(
            'button',
            {
              onClick: sayHello,
              className: 'w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold',
            },
            '🎉 Say Hello'
          ),

          React.createElement(
            'button',
            {
              onClick: showInfo,
              className: 'w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold',
            },
            'ℹ️ Show Info'
          ),

          message && React.createElement(
            'button',
            {
              onClick: clearMessage,
              className: 'w-full px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors text-sm',
            },
            '❌ Clear Message'
          )
        ),

        message && React.createElement(
          'div',
          {
            className: `p-3 rounded-lg border ${
              messageType === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`,
          },
          React.createElement(
            'p',
            { className: 'text-sm font-medium' },
            message
          )
        ),

        React.createElement(
          'div',
          { className: 'mt-6 pt-4 border-t border-gray-200' },
          React.createElement(
            'p',
            { className: 'text-xs text-gray-500 text-center' },
            'This plugin demonstrates the new addSidebarItem() API'
          )
        )
      );
    };

    api.addSidebarItem('👋', 'Hello World', HelloWorldComponent);
  },

  onUnload() {
    console.log('Hello World plugin unloaded!');
  },
};
