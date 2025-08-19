// Block Manager Plugin - ブロック操作APIのテスト用プラグイン
export default {
  name: 'Block Manager',
  version: '1.0.0',
  description: 'ブロックの作成、読み込み、更新、削除機能をテストするプラグイン',
  author: 'Love Note Plugin System',

  async onLoad(api) {
    console.log('Block Manager Plugin loaded');

    // 実際のExperiment IDを動的に取得
    let TEST_EXPERIMENT_ID = null;

    try {
      // テスト用のワークスペース・プロジェクト・エクスペリメントを作成
      console.log('Creating test workspace...');
      const workspace = await api.graphql.query(`
        mutation {
          createWorkspace(input: { name: "Plugin Test Workspace", description: "For testing block operations" }) {
            id
            name
          }
        }
      `);
      console.log('Workspace response:', workspace);

      console.log('Creating test project...');
      const project = await api.graphql.query(
        `
        mutation CreateProject($workspaceId: UUID!) {
          createProject(input: { workspaceId: $workspaceId, name: "Plugin Test Project" }) {
            id
            name
          }
        }
      `,
        { workspaceId: workspace.createWorkspace.id }
      );
      console.log('Project response:', project);

      console.log('Creating test experiment...');
      const experiment = await api.graphql.query(
        `
        mutation CreateExperiment($projectId: UUID!) {
          createExperiment(input: { projectId: $projectId, title: "Plugin Test Experiment" }) {
            id
            title
          }
        }
      `,
        { projectId: project.createProject.id }
      );
      console.log('Experiment response:', experiment);

      TEST_EXPERIMENT_ID = experiment.createExperiment.id;
      console.log('Created test experiment:', TEST_EXPERIMENT_ID);
      api.showMessage(
        `Test environment ready: ${TEST_EXPERIMENT_ID}`,
        'success'
      );
    } catch (error) {
      console.error('Failed to setup test environment:', error);
      api.showMessage(
        `Failed to setup test environment: ${error.message}`,
        'error'
      );
      return;
    }

    let currentBlocks = [];

    // ブロック管理UIをパネルとして追加
    const BlockManagerUI = ({ api }) => {
      const [blocks, setBlocks] = React.useState([]);
      const [newBlockType, setNewBlockType] = React.useState('NoteBlock');
      const [newBlockContent, setNewBlockContent] =
        React.useState('{"text":"新しいメモ"}');
      const [selectedBlockId, setSelectedBlockId] = React.useState('');
      const [updateContent, setUpdateContent] = React.useState('');
      const [loading, setLoading] = React.useState(false);

      // ブロックを読み込み
      const loadBlocks = async () => {
        setLoading(true);
        try {
          const blockList = await api.blocks.get(TEST_EXPERIMENT_ID);
          setBlocks(blockList);
          currentBlocks = blockList;
          api.showMessage(`${blockList.length} blocks loaded`, 'success');
        } catch (error) {
          api.showMessage(`Failed to load blocks: ${error.message}`, 'error');
          console.error('Load blocks error:', error);
        } finally {
          setLoading(false);
        }
      };

      // ブロックを作成
      const createBlock = async () => {
        if (!newBlockContent.trim()) {
          api.showMessage('Content is required', 'warning');
          return;
        }

        setLoading(true);
        try {
          const content = JSON.parse(newBlockContent);
          const newBlock = await api.blocks.create(
            newBlockType,
            content,
            TEST_EXPERIMENT_ID
          );
          api.showMessage(`Block created: ${newBlock.id}`, 'success');
          await loadBlocks(); // リフレッシュ
        } catch (error) {
          api.showMessage(`Failed to create block: ${error.message}`, 'error');
          console.error('Create block error:', error);
        } finally {
          setLoading(false);
        }
      };

      // ブロックを更新
      const updateBlock = async () => {
        if (!selectedBlockId || !updateContent.trim()) {
          api.showMessage('Block ID and content are required', 'warning');
          return;
        }

        setLoading(true);
        try {
          const content = JSON.parse(updateContent);
          const updatedBlock = await api.blocks.update(
            selectedBlockId,
            content
          );
          api.showMessage(`Block updated: ${updatedBlock.id}`, 'success');
          await loadBlocks(); // リフレッシュ
        } catch (error) {
          api.showMessage(`Failed to update block: ${error.message}`, 'error');
          console.error('Update block error:', error);
        } finally {
          setLoading(false);
        }
      };

      // ブロックを削除
      const deleteBlock = async blockId => {
        setLoading(true);
        try {
          await api.blocks.delete(blockId);
          api.showMessage(`Block deleted: ${blockId}`, 'success');
          await loadBlocks(); // リフレッシュ
        } catch (error) {
          api.showMessage(`Failed to delete block: ${error.message}`, 'error');
          console.error('Delete block error:', error);
        } finally {
          setLoading(false);
        }
      };

      // 選択されたブロックの内容を更新フィールドに設定
      const selectBlockForUpdate = block => {
        setSelectedBlockId(block.id);
        setUpdateContent(JSON.stringify(block.content, null, 2));
      };

      // 初期読み込み
      React.useEffect(() => {
        loadBlocks();
      }, []);

      return React.createElement(
        'div',
        { className: 'space-y-4' },
        // ヘッダー
        React.createElement(
          'div',
          { className: 'flex items-center justify-between' },
          React.createElement(
            'h2',
            { className: 'text-lg font-semibold' },
            'Block Manager'
          ),
          React.createElement(
            'div',
            { className: 'text-xs text-gray-500' },
            `Test Experiment: ${TEST_EXPERIMENT_ID}`
          )
        ),

        // 読み込みボタン
        React.createElement(
          'button',
          {
            onClick: loadBlocks,
            disabled: loading,
            className:
              'w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50',
          },
          loading ? 'Loading...' : 'Load Blocks'
        ),

        // ブロック一覧
        React.createElement(
          'div',
          { className: 'border rounded p-3' },
          React.createElement(
            'h3',
            { className: 'font-medium mb-2' },
            `Blocks (${blocks.length})`
          ),
          blocks.length === 0
            ? React.createElement(
                'p',
                { className: 'text-gray-500 text-sm' },
                'No blocks found'
              )
            : blocks.map(block =>
                React.createElement(
                  'div',
                  {
                    key: block.id,
                    className:
                      'flex items-center justify-between p-2 bg-gray-50 rounded mb-2',
                  },
                  React.createElement(
                    'div',
                    { className: 'flex-1' },
                    React.createElement(
                      'div',
                      { className: 'text-sm font-medium' },
                      `${block.type} (${block.id.slice(0, 8)}...)`
                    ),
                    React.createElement(
                      'div',
                      { className: 'text-xs text-gray-600' },
                      JSON.stringify(block.content).slice(0, 50) + '...'
                    )
                  ),
                  React.createElement(
                    'div',
                    { className: 'flex space-x-1' },
                    React.createElement(
                      'button',
                      {
                        onClick: () => selectBlockForUpdate(block),
                        className:
                          'px-2 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600',
                      },
                      'Edit'
                    ),
                    React.createElement(
                      'button',
                      {
                        onClick: () => deleteBlock(block.id),
                        disabled: loading,
                        className:
                          'px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50',
                      },
                      'Delete'
                    )
                  )
                )
              )
        ),

        // 新規作成セクション
        React.createElement(
          'div',
          { className: 'border rounded p-3' },
          React.createElement(
            'h3',
            { className: 'font-medium mb-2' },
            'Create New Block'
          ),
          React.createElement(
            'div',
            { className: 'space-y-2' },
            React.createElement(
              'select',
              {
                value: newBlockType,
                onChange: e => setNewBlockType(e.target.value),
                className: 'w-full px-2 py-1 border rounded text-sm',
              },
              React.createElement(
                'option',
                { value: 'NoteBlock' },
                'Note Block'
              ),
              React.createElement(
                'option',
                { value: 'TableBlock' },
                'Table Block'
              ),
              React.createElement(
                'option',
                { value: 'ImageBlock' },
                'Image Block'
              )
            ),
            React.createElement('textarea', {
              value: newBlockContent,
              onChange: e => setNewBlockContent(e.target.value),
              placeholder: 'Content as JSON',
              className: 'w-full px-2 py-1 border rounded text-sm h-20',
              rows: 3,
            }),
            React.createElement(
              'button',
              {
                onClick: createBlock,
                disabled: loading,
                className:
                  'w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50',
              },
              loading ? 'Creating...' : 'Create Block'
            )
          )
        ),

        // 更新セクション
        React.createElement(
          'div',
          { className: 'border rounded p-3' },
          React.createElement(
            'h3',
            { className: 'font-medium mb-2' },
            'Update Block'
          ),
          React.createElement(
            'div',
            { className: 'space-y-2' },
            React.createElement('input', {
              type: 'text',
              value: selectedBlockId,
              onChange: e => setSelectedBlockId(e.target.value),
              placeholder: 'Block ID',
              className: 'w-full px-2 py-1 border rounded text-sm',
            }),
            React.createElement('textarea', {
              value: updateContent,
              onChange: e => setUpdateContent(e.target.value),
              placeholder: 'Updated content as JSON',
              className: 'w-full px-2 py-1 border rounded text-sm h-20',
              rows: 3,
            }),
            React.createElement(
              'button',
              {
                onClick: updateBlock,
                disabled: loading,
                className:
                  'w-full px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50',
              },
              loading ? 'Updating...' : 'Update Block'
            )
          )
        )
      );
    };

    // UIパネルを追加
    api.addPanel('Block Manager', BlockManagerUI);

    // ツールバーにクイックアクションボタンを追加
    api.addButton('Quick Block', async () => {
      try {
        const quickBlock = await api.blocks.create(
          'NoteBlock',
          { text: `Quick note created at ${new Date().toLocaleTimeString()}` },
          TEST_EXPERIMENT_ID
        );
        api.showMessage(`Quick block created: ${quickBlock.id}`, 'success');
      } catch (error) {
        api.showMessage(
          `Failed to create quick block: ${error.message}`,
          'error'
        );
      }
    });

    // イベントリスナーのテスト（まだ実装されていない）
    const unsubscribe = api.blocks.on('change', block => {
      console.log('Block changed:', block);
    });

    console.log('Block Manager Plugin setup complete');
  },

  onUnload() {
    console.log('Block Manager Plugin unloaded');
  },
};
