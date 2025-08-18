// Pure JSX Sample Plugin - 純粋なJSX構文のサンプル

export default {
  name: 'Pure JSX Example',
  version: '1.0.0',
  description: 'JSX構文のトランスパイル機能をテストするサンプル',
  author: 'Love Note Team',

  onLoad(api) {
    console.log('Pure JSX Example Plugin loaded!');

    // 基本的なJSXコンポーネント
    const Welcome = () => {
      return (
        <div
          style={{
            padding: '20px',
            border: '2px solid #007bff',
            borderRadius: '12px',
            backgroundColor: '#f8f9fa',
          }}
        >
          <h2 style={{ color: '#007bff', margin: '0 0 16px 0' }}>
            Welcome to JSX!
          </h2>
          <p style={{ margin: '0 0 12px 0', lineHeight: '1.5' }}>
            This component is written with JSX syntax and transpiled by our
            plugin system.
          </p>
          <div
            style={{
              padding: '10px',
              backgroundColor: '#e3f2fd',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          >
            💡 <strong>Tip:</strong> JSX makes React components much easier to
            read and write!
          </div>
        </div>
      );
    };

    // プロパティを受け取るJSXコンポーネント
    const StatusCard = props => {
      const { title, status, message, color } = props;

      return (
        <div
          style={{
            border: `2px solid ${color}`,
            borderRadius: '8px',
            padding: '16px',
            margin: '8px 0',
            backgroundColor: 'white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <h3
            style={{
              margin: '0 0 8px 0',
              color: color,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: color,
                display: 'inline-block',
              }}
            ></span>
            {title}
          </h3>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '8px',
              textTransform: 'uppercase',
              color: color,
            }}
          >
            Status: {status}
          </div>
          <p style={{ margin: '0', color: '#666' }}>{message}</p>
        </div>
      );
    };

    // インタラクティブなカウンターコンポーネント
    const InteractiveCounter = () => {
      const [count, setCount] = React.useState(0);
      const [clicks, setClicks] = React.useState([]);

      const handleClick = type => {
        const timestamp = new Date().toLocaleTimeString();
        const newClick = {
          type,
          timestamp,
          value: type === 'increment' ? 1 : -1,
        };

        if (type === 'increment') {
          setCount(prev => prev + 1);
        } else if (type === 'decrement') {
          setCount(prev => prev - 1);
        } else {
          setCount(0);
        }

        setClicks(prev => [newClick, ...prev.slice(0, 4)]);
      };

      return (
        <div
          style={{
            padding: '24px',
            backgroundColor: '#f8f9fa',
            borderRadius: '12px',
            border: '1px solid #dee2e6',
          }}
        >
          <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>
            Interactive Counter
          </h3>

          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color:
                  count > 0 ? '#28a745' : count < 0 ? '#dc3545' : '#6c757d',
                margin: '20px 0',
              }}
            >
              {count}
            </div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <button
              onClick={() => handleClick('increment')}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '12px 24px',
                margin: '0 8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
            >
              + Add
            </button>

            <button
              onClick={() => handleClick('decrement')}
              style={{
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '12px 24px',
                margin: '0 8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
            >
              - Subtract
            </button>

            <button
              onClick={() => handleClick('reset')}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '12px 24px',
                margin: '0 8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
            >
              Reset
            </button>
          </div>

          {count !== 0 && (
            <div
              style={{
                padding: '12px',
                backgroundColor: count > 0 ? '#d4edda' : '#f8d7da',
                border: `1px solid ${count > 0 ? '#c3e6cb' : '#f5c6cb'}`,
                borderRadius: '6px',
                textAlign: 'center',
                marginBottom: '16px',
              }}
            >
              {count > 0 ? '📈' : '📉'} Current value:{' '}
              {count > 0 ? 'Positive' : 'Negative'}
            </div>
          )}

          {clicks.length > 0 && (
            <div>
              <h4 style={{ marginBottom: '12px' }}>Recent Activity:</h4>
              <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                {clicks.map((click, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '6px 12px',
                      margin: '4px 0',
                      backgroundColor: 'white',
                      borderRadius: '4px',
                      fontSize: '14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        color:
                          click.type === 'increment'
                            ? '#28a745'
                            : click.type === 'decrement'
                              ? '#dc3545'
                              : '#6c757d',
                      }}
                    >
                      {click.type === 'increment'
                        ? '➕'
                        : click.type === 'decrement'
                          ? '➖'
                          : '🔄'}{' '}
                      {click.type}
                    </span>
                    <span style={{ color: '#666', fontSize: '12px' }}>
                      {click.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    };

    // プラグインボタンを追加
    api.addButton('Show JSX Welcome', () => {
      console.log('JSX Welcome Component:', Welcome);
      api.showMessage('JSX Welcome component created! Check console.', 'info');
    });

    api.addButton('Show Status Cards', () => {
      const statusCards = [
        {
          title: 'System Health',
          status: 'Good',
          message: 'All systems operational',
          color: '#28a745',
        },
        {
          title: 'Network',
          status: 'Warning',
          message: 'High latency detected',
          color: '#ffc107',
        },
        {
          title: 'Database',
          status: 'Critical',
          message: 'Connection issues',
          color: '#dc3545',
        },
      ];

      statusCards.forEach(card => {
        console.log(
          'Status Card Component:',
          React.createElement(StatusCard, card)
        );
      });

      api.showMessage(
        'Status card components created! Check console.',
        'success'
      );
    });

    api.addButton('Interactive Counter', () => {
      console.log('Interactive Counter Component:', InteractiveCounter);
      api.showMessage('Interactive counter component loaded!', 'success');
    });

    api.addButton('Test JSX Rendering', () => {
      try {
        // JSXコンポーネントを実際にReact要素として作成
        const welcomeElement = <Welcome />;
        const counterElement = <InteractiveCounter />;
        const statusElement = (
          <StatusCard
            title="JSX Test"
            status="Working"
            message="JSX transpilation is working correctly!"
            color="#007bff"
          />
        );

        console.log('JSX Elements created:', {
          welcome: welcomeElement,
          counter: counterElement,
          status: statusElement,
        });

        api.showMessage('JSX rendering test successful! 🎉', 'success');
      } catch (error) {
        console.error('JSX rendering error:', error);
        api.showMessage(`JSX Error: ${error.message}`, 'error');
      }
    });
  },

  onUnload() {
    console.log('Pure JSX Example Plugin unloaded');
  },
};
