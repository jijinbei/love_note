// Pure JSX Sample Plugin - 純粋なJSX構文のサンプル（新API対応）

let pluginAPI = null;

export default {
  name: 'Pure JSX Example',
  version: '1.0.0',
  description: 'JSX syntax demonstration with new sidebar API',
  author: 'Love Note Team',

  onLoad(api) {
    pluginAPI = api;
    console.log('Pure JSX Example Plugin loaded with new API!');

    // メインのJSXデモンストレーションコンポーネント
    const JSXDemoComponent = ({ api }) => {
      const [selectedDemo, setSelectedDemo] = React.useState('welcome');
      const [status, setStatus] = React.useState('JSX system ready!');
      const [statusType, setStatusType] = React.useState('info');

      // 基本的なJSXコンポーネント（プロパティなし）
      const Welcome = () => {
        return (
          <div className="p-6 border-2 border-blue-500 rounded-xl bg-blue-50">
            <h2 className="text-2xl font-bold text-blue-600 mb-4">
              🎉 Welcome to JSX!
            </h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              This component is written with JSX syntax and demonstrates how JSX
              transpilation works seamlessly in our plugin system.
            </p>
            <div className="p-3 bg-blue-100 rounded-lg text-sm border border-blue-200">
              <strong>💡 Pro Tip:</strong> JSX makes React components much more
              readable and maintainable compared to React.createElement calls!
            </div>
            <div className="mt-4 text-sm text-blue-600">
              ✨ This is pure JSX syntax being transpiled in real-time
            </div>
          </div>
        );
      };

      // プロパティを受け取るJSXコンポーネント
      const StatusCard = ({ title, status, message, color }) => {
        return (
          <div
            className="border-2 rounded-lg p-4 m-2 bg-white shadow-md"
            style={{ borderColor: color }}
          >
            <h3
              className="flex items-center gap-2 mb-2 font-semibold"
              style={{ color: color }}
            >
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: color }}
              ></span>
              {title}
            </h3>
            <div
              className="text-sm font-bold mb-2 uppercase"
              style={{ color: color }}
            >
              Status: {status}
            </div>
            <p className="text-gray-600 text-sm">{message}</p>
          </div>
        );
      };

      // インタラクティブなカウンターコンポーネント（JSX構文）
      const InteractiveCounter = () => {
        const [count, setCount] = React.useState(0);
        const [history, setHistory] = React.useState([]);

        const handleAction = type => {
          const timestamp = new Date().toLocaleTimeString();
          const action = { type, timestamp, count };

          if (type === 'increment') {
            setCount(prev => prev + 1);
          } else if (type === 'decrement') {
            setCount(prev => prev - 1);
          } else {
            setCount(0);
          }

          setHistory(prev => [action, ...prev.slice(0, 4)]);
        };

        return (
          <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="text-xl font-bold text-center mb-6 text-gray-800">
              🔢 Interactive JSX Counter
            </h3>

            <div className="text-center mb-6">
              <div
                className={`text-6xl font-bold mb-2 ${
                  count > 0
                    ? 'text-green-500'
                    : count < 0
                      ? 'text-red-500'
                      : 'text-gray-500'
                }`}
              >
                {count}
              </div>
              <p className="text-sm text-gray-600">Current Value</p>
            </div>

            <div className="flex justify-center gap-3 mb-6">
              <button
                onClick={() => handleAction('increment')}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
              >
                ➕ Add
              </button>
              <button
                onClick={() => handleAction('decrement')}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
              >
                ➖ Subtract
              </button>
              <button
                onClick={() => handleAction('reset')}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold"
              >
                🔄 Reset
              </button>
            </div>

            {count !== 0 && (
              <div
                className={`p-3 rounded-lg text-center mb-4 ${
                  count > 0
                    ? 'bg-green-100 border border-green-200 text-green-800'
                    : 'bg-red-100 border border-red-200 text-red-800'
                }`}
              >
                {count > 0 ? '📈' : '📉'} Value is{' '}
                {count > 0 ? 'positive' : 'negative'}
              </div>
            )}

            {history.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-gray-700">
                  📋 Recent Activity:
                </h4>
                <div className="max-h-24 overflow-y-auto">
                  {history.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-2 mb-1 bg-white rounded text-sm"
                    >
                      <span
                        className={
                          item.type === 'increment'
                            ? 'text-green-600'
                            : item.type === 'decrement'
                              ? 'text-red-600'
                              : 'text-gray-600'
                        }
                      >
                        {item.type === 'increment'
                          ? '➕'
                          : item.type === 'decrement'
                            ? '➖'
                            : '🔄'}{' '}
                        {item.type}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {item.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      };

      // デモ選択関数
      const showDemo = demo => {
        setSelectedDemo(demo);
        setStatus(`Switched to ${demo} demo`);
        setStatusType('success');
        console.log(`JSX Demo: Showing ${demo} component`);
      };

      // JSX構文テスト関数
      const testJSXSyntax = () => {
        try {
          // 実際にJSX要素を作成してテスト
          const testElement = (
            <div>
              <h1>JSX Test</h1>
              <p>This is a JSX syntax test!</p>
            </div>
          );

          console.log('JSX Test Element:', testElement);
          setStatus('JSX syntax test successful! 🎉');
          setStatusType('success');
        } catch (error) {
          console.error('JSX Error:', error);
          setStatus(`JSX Error: ${error.message}`);
          setStatusType('error');
        }
      };

      // メインレンダリング（JSX構文使用）
      return (
        <div className="p-4 space-y-6">
          {/* ヘッダー */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              ⚛️ JSX Syntax Demo
            </h1>
            <p className="text-gray-600">
              Pure JSX components with transpilation support
            </p>
          </div>

          {/* デモ選択ボタン */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => showDemo('welcome')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                selectedDemo === 'welcome'
                  ? 'bg-blue-500 text-white'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              👋 Welcome
            </button>
            <button
              onClick={() => showDemo('status')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                selectedDemo === 'status'
                  ? 'bg-green-500 text-white'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              📊 Status Cards
            </button>
            <button
              onClick={() => showDemo('counter')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                selectedDemo === 'counter'
                  ? 'bg-purple-500 text-white'
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              }`}
            >
              🔢 Counter
            </button>
            <button
              onClick={testJSXSyntax}
              className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors font-semibold"
            >
              🧪 Test JSX
            </button>
          </div>

          {/* ステータス表示 */}
          {status && (
            <div
              className={`p-3 rounded-lg border text-center ${
                statusType === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : statusType === 'error'
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              <p className="text-sm font-medium">{status}</p>
            </div>
          )}

          {/* 選択されたデモコンポーネントを表示 */}
          <div className="border-t pt-6">
            {selectedDemo === 'welcome' && <Welcome />}
            {selectedDemo === 'status' && (
              <div>
                <h3 className="text-xl font-semibold mb-4 text-center text-gray-700">
                  📊 System Status Cards
                </h3>
                <StatusCard
                  title="System Health"
                  status="Good"
                  message="All systems operational"
                  color="#28a745"
                />
                <StatusCard
                  title="Network"
                  status="Warning"
                  message="High latency detected"
                  color="#ffc107"
                />
                <StatusCard
                  title="Database"
                  status="Critical"
                  message="Connection issues"
                  color="#dc3545"
                />
              </div>
            )}
            {selectedDemo === 'counter' && <InteractiveCounter />}
          </div>

          {/* フッター情報 */}
          <div className="text-center text-xs text-gray-500 border-t pt-4">
            <p>
              Pure JSX Plugin | Demonstrating JSX transpilation with new sidebar
              API
            </p>
            <p className="mt-1">All components written in JSX syntax</p>
          </div>
        </div>
      );
    };

    // サイドバーアイテムとして登録
    api.addSidebarItem('⚛️', 'JSX Demo', JSXDemoComponent);
    console.log('JSX Demo Plugin: Sidebar item registered successfully');
  },

  onUnload() {
    console.log('Pure JSX Example Plugin unloaded');
  },
};
