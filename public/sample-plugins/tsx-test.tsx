// TypeScript + JSX Sample Plugin - 完全な型安全性を持つReactプラグイン（新API対応）

import React from 'react';

let pluginAPI: LoveNotePluginAPI | null = null;

interface ButtonProps {
  text: string;
  color?: 'blue' | 'red' | 'green' | 'gray' | 'purple';
  size?: 'small' | 'medium' | 'large';
  onClick: () => void;
  disabled?: boolean;
}

interface User {
  id: number;
  name: string;
  email?: string;
  role: 'admin' | 'user' | 'guest';
  createdAt: Date;
}

interface CounterState {
  count: number;
  history: Array<{
    action: 'increment' | 'decrement' | 'reset';
    timestamp: Date;
    previousValue: number;
    newValue: number;
  }>;
}

// 新しいプラグインAPIの型定義
type LoveNotePluginAPI = {
  addSidebarItem: (
    icon: string,
    label: string,
    view: React.ComponentType<any>
  ) => string;
  addPanel: (
    title: string,
    component: React.ComponentType<any>,
    props?: any
  ) => string;
  graphql?: any;
  blocks?: any;
};

export default {
  name: 'TypeScript JSX Advanced',
  version: '2.0.0',
  description:
    'TypeScript + JSX構文を使用した高度なプラグインサンプル（完全型安全・新API対応）',
  author: 'Love Note Team',

  onLoad(api: LoveNotePluginAPI) {
    pluginAPI = api;
    console.log(
      'TypeScript JSX Advanced Plugin loaded with full type safety and new API!'
    );

    // メインのTypeScriptデモコンポーネント
    const TypeScriptDemoComponent: React.FC<{ api?: LoveNotePluginAPI }> = ({
      api: apiProp,
    }) => {
      const [selectedDemo, setSelectedDemo] = React.useState<
        'buttons' | 'users' | 'counter'
      >('buttons');
      const [status, setStatus] = React.useState<string>(
        'TypeScript system ready with full type safety!'
      );
      const [statusType, setStatusType] = React.useState<
        'info' | 'success' | 'warning' | 'error'
      >('info');

      // 型安全なボタンコンポーネント
      const TypedButton: React.FC<ButtonProps> = ({
        text,
        color = 'blue',
        size = 'medium',
        onClick,
        disabled = false,
      }) => {
        const colorMap: Record<NonNullable<ButtonProps['color']>, string> = {
          blue: '#007bff',
          red: '#dc3545',
          green: '#28a745',
          gray: '#6c757d',
          purple: '#6f42c1',
        };

        const sizeMap: Record<
          NonNullable<ButtonProps['size']>,
          { padding: string; fontSize: string }
        > = {
          small: { padding: '6px 12px', fontSize: '12px' },
          medium: { padding: '10px 20px', fontSize: '14px' },
          large: { padding: '14px 28px', fontSize: '16px' },
        };

        const styles = sizeMap[size];

        return (
          <button
            onClick={onClick}
            disabled={disabled}
            style={{
              backgroundColor: disabled ? '#e9ecef' : colorMap[color],
              color: disabled ? '#6c757d' : 'white',
              padding: styles.padding,
              fontSize: styles.fontSize,
              border: 'none',
              borderRadius: '6px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              margin: '4px',
              fontWeight: 'bold',
              opacity: disabled ? 0.6 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            {text}
          </button>
        );
      };

      // ユーザーカードコンポーネント（完全型安全）
      const UserCard: React.FC<{
        user: User;
        onEdit?: (user: User) => void;
      }> = ({ user, onEdit }) => {
        const getRoleColor = (role: User['role']): string => {
          const roleColors: Record<User['role'], string> = {
            admin: '#dc3545',
            user: '#007bff',
            guest: '#6c757d',
          };
          return roleColors[role];
        };

        const formatDate = (date: Date): string => {
          return new Intl.DateTimeFormat('ja-JP', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }).format(date);
        };

        return (
          <div
            style={{
              border: '1px solid #dee2e6',
              borderRadius: '12px',
              padding: '20px',
              margin: '12px 0',
              backgroundColor: '#ffffff',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
              transition: 'box-shadow 0.2s ease',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '12px',
              }}
            >
              <h4 style={{ margin: '0', color: '#212529', fontSize: '18px' }}>
                {user.name}
              </h4>
              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: 'white',
                  backgroundColor: getRoleColor(user.role),
                  textTransform: 'uppercase',
                }}
              >
                {user.role}
              </span>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#495057' }}>ID:</strong>
              <span
                style={{
                  marginLeft: '8px',
                  color: '#6c757d',
                  fontFamily: 'monospace',
                }}
              >
                #{user.id.toString().padStart(4, '0')}
              </span>
            </div>

            {user.email && (
              <div style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#495057' }}>Email:</strong>
                <span style={{ marginLeft: '8px', color: '#6c757d' }}>
                  {user.email}
                </span>
              </div>
            )}

            <div style={{ marginBottom: '12px' }}>
              <strong style={{ color: '#495057' }}>Created:</strong>
              <span
                style={{
                  marginLeft: '8px',
                  color: '#6c757d',
                  fontSize: '14px',
                }}
              >
                {formatDate(user.createdAt)}
              </span>
            </div>

            {onEdit && (
              <TypedButton
                text="Edit User"
                color="blue"
                size="small"
                onClick={() => onEdit(user)}
              />
            )}
          </div>
        );
      };

      // 高度なカウンターコンポーネント（状態管理付き）
      const AdvancedCounter: React.FC<{ initialValue?: number }> = ({
        initialValue = 0,
      }) => {
        const [state, setState] = React.useState<CounterState>({
          count: initialValue,
          history: [],
        });

        const addToHistory = (
          action: CounterState['history'][0]['action'],
          previousValue: number,
          newValue: number
        ): void => {
          setState(prevState => ({
            ...prevState,
            history: [
              {
                action,
                timestamp: new Date(),
                previousValue,
                newValue,
              },
              ...prevState.history.slice(0, 9), // 最新10件を保持
            ],
          }));
        };

        const increment = (): void => {
          setState(prevState => {
            const newValue = prevState.count + 1;
            addToHistory('increment', prevState.count, newValue);
            return { ...prevState, count: newValue };
          });
        };

        const decrement = (): void => {
          setState(prevState => {
            const newValue = prevState.count - 1;
            addToHistory('decrement', prevState.count, newValue);
            return { ...prevState, count: newValue };
          });
        };

        const reset = (): void => {
          setState(prevState => {
            addToHistory('reset', prevState.count, initialValue);
            return { ...prevState, count: initialValue };
          });
        };

        const getCounterColor = (): string => {
          if (state.count > 10) return '#28a745';
          if (state.count < -5) return '#dc3545';
          if (state.count === 0) return '#6c757d';
          return '#007bff';
        };

        return (
          <div
            style={{
              padding: '24px',
              backgroundColor: '#f8f9fa',
              borderRadius: '16px',
              border: '1px solid #dee2e6',
              maxWidth: '400px',
            }}
          >
            <h3
              style={{
                textAlign: 'center',
                marginBottom: '24px',
                color: '#495057',
              }}
            >
              Advanced Counter
            </h3>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div
                style={{
                  fontSize: '64px',
                  fontWeight: 'bold',
                  color: getCounterColor(),
                  margin: '20px 0',
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                {state.count}
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <TypedButton
                text="+"
                color="green"
                size="large"
                onClick={increment}
              />
              <TypedButton
                text="−"
                color="red"
                size="large"
                onClick={decrement}
              />
              <TypedButton
                text="Reset"
                color="gray"
                size="medium"
                onClick={reset}
              />
            </div>

            {state.count > 15 && (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#d1ecf1',
                  border: '1px solid #bee5eb',
                  borderRadius: '8px',
                  textAlign: 'center',
                  marginBottom: '20px',
                  color: '#0c5460',
                }}
              >
                🎉 Amazing! You've reached {state.count}!
              </div>
            )}

            {state.history.length > 0 && (
              <div>
                <h4 style={{ marginBottom: '12px', color: '#495057' }}>
                  Recent Actions ({state.history.length})
                </h4>
                <div
                  style={{
                    maxHeight: '150px',
                    overflowY: 'auto',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                  }}
                >
                  {state.history.map((entry, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '8px 12px',
                        borderBottom:
                          index < state.history.length - 1
                            ? '1px solid #f8f9fa'
                            : 'none',
                        fontSize: '14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{
                          color:
                            entry.action === 'increment'
                              ? '#28a745'
                              : entry.action === 'decrement'
                                ? '#dc3545'
                                : '#6c757d',
                          fontWeight: 'bold',
                        }}
                      >
                        {entry.action === 'increment'
                          ? '➕'
                          : entry.action === 'decrement'
                            ? '➖'
                            : '🔄'}
                        {entry.previousValue} → {entry.newValue}
                      </span>
                      <span style={{ color: '#6c757d', fontSize: '12px' }}>
                        {entry.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      };

      // サンプルデータ（型安全）
      const sampleUsers: User[] = [
        {
          id: 1,
          name: 'Alice Johnson',
          email: 'alice@example.com',
          role: 'admin',
          createdAt: new Date('2024-01-15T10:30:00'),
        },
        {
          id: 2,
          name: 'Bob Smith',
          email: 'bob@example.com',
          role: 'user',
          createdAt: new Date('2024-02-20T14:45:00'),
        },
        {
          id: 3,
          name: 'Charlie Brown',
          role: 'guest',
          createdAt: new Date('2024-03-10T09:15:00'),
        },
      ];

      // デモ選択と状態管理
      const showDemo = (demo: 'buttons' | 'users' | 'counter'): void => {
        setSelectedDemo(demo);
        setStatus(`Switched to ${demo} demo with full TypeScript type safety`);
        setStatusType('success');
        console.log(
          `TypeScript Demo: Showing ${demo} component with type safety`
        );
      };

      const testTypeSafety = (): void => {
        try {
          // TypeScriptの型チェック機能のデモ
          const validUser: User = {
            id: 999,
            name: 'TypeScript Test User',
            email: 'typescript@example.com',
            role: 'user', // 型安全：'admin' | 'user' | 'guest'のみ受け入れ
            createdAt: new Date(),
          };

          // 型安全なボタンの作成テスト
          const typedButtonElement = (
            <TypedButton
              text="Type Safe Button"
              color="purple" // 型安全：定義された色のみ
              size="large" // 型安全：定義されたサイズのみ
              onClick={() => setStatus('TypeScript button works!')}
            />
          );

          console.log('Valid TypeScript user:', validUser);
          console.log('Type-safe button element:', typedButtonElement);
          setStatus('TypeScript type safety validation passed! 🎯');
          setStatusType('success');
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          setStatus(`Type error: ${errorMessage}`);
          setStatusType('error');
        }
      };

      // メインレンダリング（TSX構文）
      return (
        <div className="p-4 space-y-6">
          {/* ヘッダー */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              📐 TypeScript + JSX Demo
            </h1>
            <p className="text-gray-600">
              Complete type safety with advanced TypeScript features
            </p>
          </div>

          {/* デモ選択ボタン */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => showDemo('buttons')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                selectedDemo === 'buttons'
                  ? 'bg-blue-500 text-white'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              🔘 Typed Buttons
            </button>
            <button
              onClick={() => showDemo('users')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                selectedDemo === 'users'
                  ? 'bg-green-500 text-white'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              👥 User Cards
            </button>
            <button
              onClick={() => showDemo('counter')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                selectedDemo === 'counter'
                  ? 'bg-purple-500 text-white'
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              }`}
            >
              🔢 TS Counter
            </button>
            <button
              onClick={testTypeSafety}
              className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors font-semibold"
            >
              🎯 Type Test
            </button>
          </div>

          {/* ステータス表示 */}
          <div
            className={`p-3 rounded-lg border text-center ${
              statusType === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : statusType === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : statusType === 'warning'
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                    : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            <p className="text-sm font-medium">{status}</p>
          </div>

          {/* 選択されたデモを表示 */}
          <div className="border-t pt-6">
            {selectedDemo === 'buttons' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-center text-gray-700">
                  🔘 Type-Safe Buttons
                </h3>
                <div className="text-center space-x-2">
                  <TypedButton
                    text="Small Blue"
                    color="blue"
                    size="small"
                    onClick={() => setStatus('Small blue button clicked!')}
                  />
                  <TypedButton
                    text="Medium Green"
                    color="green"
                    size="medium"
                    onClick={() => setStatus('Medium green button clicked!')}
                  />
                  <TypedButton
                    text="Large Red"
                    color="red"
                    size="large"
                    onClick={() => setStatus('Large red button clicked!')}
                  />
                  <TypedButton
                    text="Disabled"
                    color="gray"
                    size="medium"
                    onClick={() => {}}
                    disabled={true}
                  />
                </div>
                <div className="text-center">
                  <TypedButton
                    text="Purple Large"
                    color="purple"
                    size="large"
                    onClick={() =>
                      setStatus('TypeScript ensures type safety! 🎯')
                    }
                  />
                </div>
              </div>
            )}

            {selectedDemo === 'users' && (
              <div>
                <h3 className="text-xl font-semibold mb-4 text-center text-gray-700">
                  👥 Type-Safe User Cards
                </h3>
                {sampleUsers.map((user: User) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    onEdit={(editUser: User) => {
                      setStatus(
                        `Editing user: ${editUser.name} (${editUser.role})`
                      );
                      setStatusType('info');
                      console.log('Edit user with type safety:', editUser);
                    }}
                  />
                ))}
              </div>
            )}

            {selectedDemo === 'counter' && (
              <div className="flex justify-center">
                <AdvancedCounter initialValue={0} />
              </div>
            )}
          </div>

          {/* TypeScript機能の説明 */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h4 className="font-semibold text-gray-700 mb-2">
              🔍 TypeScript Features Demonstrated:
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>
                • <strong>Interface definitions</strong> - ButtonProps, User,
                CounterState
              </li>
              <li>
                • <strong>Type unions</strong> - Role types ('admin' | 'user' |
                'guest')
              </li>
              <li>
                • <strong>Generic types</strong> - React.FC&lt;Props&gt;
              </li>
              <li>
                • <strong>Optional properties</strong> - email?, size?,
                disabled?
              </li>
              <li>
                • <strong>Type guards</strong> - Error handling with instanceof
              </li>
              <li>
                • <strong>Strict typing</strong> - All function parameters and
                returns
              </li>
            </ul>
          </div>

          {/* フッター */}
          <div className="text-center text-xs text-gray-500 border-t pt-4">
            <p>
              TypeScript + JSX Plugin | Complete type safety with new sidebar
              API
            </p>
            <p className="mt-1">All components and functions are fully typed</p>
          </div>
        </div>
      );
    };

    // サイドバーアイテムとして登録
    api.addSidebarItem('📐', 'TypeScript', TypeScriptDemoComponent);
    console.log(
      'TypeScript JSX Advanced Plugin: Sidebar item registered with full type safety'
    );
  },

  onUnload() {
    console.log('TypeScript JSX Advanced Plugin unloaded');
  },

  onReload(api: LoveNotePluginAPI) {
    console.log(
      'TypeScript JSX Advanced Plugin reloaded with type safety and new API'
    );
    this.onLoad(api);
  },
};
