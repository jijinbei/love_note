// TypeScript + JSX Sample Plugin - 完全な型安全性を持つReactプラグイン

import React from 'react';

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

type LoveNotePluginAPI = {
  addButton: (label: string, onClick: () => void) => string;
  showMessage: (
    text: string,
    type?: 'info' | 'success' | 'warning' | 'error'
  ) => void;
  utils: {
    generateId: () => string;
  };
};

export default {
  name: 'TypeScript JSX Advanced',
  version: '2.0.0',
  description:
    'TypeScript + JSX構文を使用した高度なプラグインサンプル（完全型安全）',
  author: 'Love Note Team',

  onLoad(api: LoveNotePluginAPI) {
    console.log('TypeScript JSX Advanced Plugin loaded with full type safety!');

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
    const UserCard: React.FC<{ user: User; onEdit?: (user: User) => void }> = ({
      user,
      onEdit,
    }) => {
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
              style={{ marginLeft: '8px', color: '#6c757d', fontSize: '14px' }}
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

    // プラグインボタンを追加
    api.addButton('TypeScript Counter', () => {
      console.log('AdvancedCounter component:', AdvancedCounter);
      api.showMessage('TypeScript counter component loaded!', 'success');
    });

    api.addButton('Show TypeScript Users', () => {
      sampleUsers.forEach((user: User) => {
        console.log(
          'TypeScript User Component:',
          React.createElement(UserCard, {
            user,
            onEdit: (editUser: User) => {
              console.log('Edit user:', editUser);
              api.showMessage(`Editing user: ${editUser.name}`, 'info');
            },
          })
        );
      });
      api.showMessage('TypeScript user components created!', 'success');
    });

    api.addButton('Type Safety Demo', () => {
      try {
        // TypeScriptの型チェック機能のデモ
        const validUser: User = {
          id: 999,
          name: 'TypeScript Test User',
          email: 'typescript@example.com',
          role: 'user',
          createdAt: new Date(),
        };

        // 型安全なボタンの作成
        const typedButtonElement = (
          <TypedButton
            text="Type Safe Button"
            color="purple"
            size="large"
            onClick={() =>
              api.showMessage('TypeScript button works!', 'success')
            }
          />
        );

        console.log('Valid TypeScript user:', validUser);
        console.log('Type-safe button element:', typedButtonElement);

        api.showMessage(
          'TypeScript type safety validation passed! 🎯',
          'success'
        );
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        api.showMessage(`Type error: ${errorMessage}`, 'error');
      }
    });

    api.addButton('TSX Rendering Test', () => {
      try {
        // 完全なTSX要素の作成とレンダリングテスト
        const counterElement = <AdvancedCounter initialValue={5} />;
        const userElement = (
          <UserCard
            user={sampleUsers[0]}
            onEdit={(user: User) => console.log('Editing:', user.name)}
          />
        );

        console.log('TSX Elements created:', {
          counter: counterElement,
          user: userElement,
        });

        api.showMessage('TSX rendering test successful! ✨', 'success');
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        console.error('TSX rendering error:', errorMessage);
        api.showMessage(`TSX Error: ${errorMessage}`, 'error');
      }
    });
  },

  onUnload() {
    console.log('TypeScript JSX Advanced Plugin unloaded');
  },

  onReload(api: LoveNotePluginAPI) {
    console.log('TypeScript JSX Advanced Plugin reloaded with type safety');
    this.onLoad(api);
  },
};
