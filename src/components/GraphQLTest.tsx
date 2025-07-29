import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface GraphQLResponse {
  data?: any;
  errors?: Array<{ message: string }>;
}

export function GraphQLTest() {
  const [query, setQuery] = useState(`query GetWorkspaces {
  workspaces {
    id
    name
    description
    createdAt
    updatedAt
  }
}`);
  const [variables, setVariables] = useState('{}');
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const executeQuery = async () => {
    setIsLoading(true);
    try {
      let parsedVariables = null;
      if (variables.trim()) {
        try {
          parsedVariables = JSON.parse(variables);
        } catch (e) {
          setResponse(`Variables JSON parse error: ${e}`);
          return;
        }
      }

      const result = await invoke<string>('graphql_query', {
        query,
        variables: parsedVariables
      });

      // Format the JSON response for better readability
      const parsed: GraphQLResponse = JSON.parse(result);
      setResponse(JSON.stringify(parsed, null, 2));
    } catch (error) {
      setResponse(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const runSampleQueries = () => {
    const samples = [
      // Workspace Queries
      {
        name: 'Get All Workspaces',
        query: `query GetWorkspaces {
  workspaces {
    id
    name
    description
    createdAt
    updatedAt
  }
}`,
        variables: '{}'
      },
      {
        name: 'Create Workspace - Basic',
        query: `mutation CreateWorkspace($input: CreateWorkspaceRequest!) {
  createWorkspace(input: $input) {
    id
    name
    description
    createdAt
    updatedAt
  }
}`,
        variables: JSON.stringify({
          input: {
            name: "GraphQL Test Lab",
            description: "Created via GraphQL"
          }
        }, null, 2)
      },
      {
        name: 'Create Workspace - No Description',
        query: `mutation CreateWorkspace($input: CreateWorkspaceRequest!) {
  createWorkspace(input: $input) {
    id
    name
    description
    createdAt
  }
}`,
        variables: JSON.stringify({
          input: {
            name: "Minimal Workspace"
          }
        }, null, 2)
      },

      // Project Queries
      {
        name: 'Get Projects by Workspace',
        query: `query GetProjects($workspaceId: String!) {
  projects(workspaceId: $workspaceId) {
    id
    name
    description
    workspaceId
    createdAt
    updatedAt
  }
}`,
        variables: JSON.stringify({
          workspaceId: "replace-with-workspace-id"
        }, null, 2)
      },
      {
        name: 'Create Project',
        query: `mutation CreateProject($input: CreateProjectRequest!) {
  createProject(input: $input) {
    id
    name
    description
    workspaceId
    createdAt
    updatedAt
  }
}`,
        variables: JSON.stringify({
          input: {
            workspaceId: "replace-with-workspace-id",
            name: "Protein Analysis Project",
            description: "Analyzing protein structures and interactions"
          }
        }, null, 2)
      },

      // Experiment Queries
      {
        name: 'Get Experiments by Project',
        query: `query GetExperiments($projectId: String!) {
  experiments(projectId: $projectId) {
    id
    title
    projectId
    createdAt
    updatedAt
  }
}`,
        variables: JSON.stringify({
          projectId: "replace-with-project-id"
        }, null, 2)
      },
      {
        name: 'Create Experiment',
        query: `mutation CreateExperiment($input: CreateExperimentRequest!) {
  createExperiment(input: $input) {
    id
    title
    projectId
    createdAt
    updatedAt
  }
}`,
        variables: JSON.stringify({
          input: {
            projectId: "replace-with-project-id",
            title: "Sample Preparation Experiment"
          }
        }, null, 2)
      },

      // Block Queries
      {
        name: 'Get Blocks by Experiment',
        query: `query GetBlocks($experimentId: String!) {
  blocks(experimentId: $experimentId) {
    id
    experimentId
    blockType
    content
    orderIndex
    createdAt
    updatedAt
  }
}`,
        variables: JSON.stringify({
          experimentId: "replace-with-experiment-id"
        }, null, 2)
      },
      {
        name: 'Create Note Block',
        query: `mutation CreateBlock($input: CreateBlockInput!) {
  createBlock(input: $input) {
    id
    experimentId
    blockType
    content
    orderIndex
    createdAt
    updatedAt
  }
}`,
        variables: JSON.stringify({
          input: {
            experimentId: "replace-with-experiment-id",
            blockType: "NoteBlock",
            content: JSON.stringify({
              type: "NoteBlock",
              text: "This is a test note created via GraphQL. It contains important observations about the experiment."
            }),
            orderIndex: 1
          }
        }, null, 2)
      },
      {
        name: 'Create Table Block',
        query: `mutation CreateBlock($input: CreateBlockInput!) {
  createBlock(input: $input) {
    id
    experimentId
    blockType
    content
    orderIndex
    createdAt
    updatedAt
  }
}`,
        variables: JSON.stringify({
          input: {
            experimentId: "replace-with-experiment-id",
            blockType: "TableBlock",
            content: JSON.stringify({
              type: "TableBlock",
              headers: ["Sample ID", "Concentration (mg/mL)", "pH", "Temperature (°C)"],
              rows: [
                ["S001", "2.5", "7.4", "25.0"],
                ["S002", "3.1", "7.2", "24.8"],
                ["S003", "1.8", "7.6", "25.2"],
                ["S004", "4.2", "7.0", "24.5"]
              ]
            }),
            orderIndex: 2
          }
        }, null, 2)
      },
      {
        name: 'Create Image Block',
        query: `mutation CreateBlock($input: CreateBlockInput!) {
  createBlock(input: $input) {
    id
    experimentId
    blockType
    content
    orderIndex
    createdAt
    updatedAt
  }
}`,
        variables: JSON.stringify({
          input: {
            experimentId: "replace-with-experiment-id",
            blockType: "ImageBlock",
            content: JSON.stringify({
              type: "ImageBlock",
              path: "/uploads/microscope_image_001.jpg",
              alt: "Microscope image showing cell structure at 400x magnification"
            }),
            orderIndex: 3
          }
        }, null, 2)
      },
      {
        name: 'Create Sample Reference Block',
        query: `mutation CreateBlock($input: CreateBlockInput!) {
  createBlock(input: $input) {
    id
    experimentId
    blockType
    content
    orderIndex
    createdAt
    updatedAt
  }
}`,
        variables: JSON.stringify({
          input: {
            experimentId: "replace-with-experiment-id",
            blockType: "SampleRefBlock",
            content: JSON.stringify({
              type: "SampleRefBlock",
              sampleId: "sample-001-uuid"
            }),
            orderIndex: 4
          }
        }, null, 2)
      },
      {
        name: 'Create Protocol Reference Block',
        query: `mutation CreateBlock($input: CreateBlockInput!) {
  createBlock(input: $input) {
    id
    experimentId
    blockType
    content
    orderIndex
    createdAt
    updatedAt
  }
}`,
        variables: JSON.stringify({
          input: {
            experimentId: "replace-with-experiment-id",
            blockType: "ProtocolRefBlock",
            content: JSON.stringify({
              type: "ProtocolRefBlock",
              protocolId: "protocol-001-uuid"
            }),
            orderIndex: 5
          }
        }, null, 2)
      },

      // Complex Nested Queries
      {
        name: 'Get Complete Hierarchy',
        query: `query GetCompleteHierarchy {
  workspaces {
    id
    name
    description
    createdAt
  }
}

# Note: This would require nested resolvers to get projects/experiments/blocks in one query`,
        variables: '{}'
      },

      // Introspection Queries
      {
        name: 'Schema Introspection - Types',
        query: `query IntrospectTypes {
  __schema {
    types {
      name
      kind
      description
    }
  }
}`,
        variables: '{}'
      },
      {
        name: 'Schema Introspection - Workspace Type',
        query: `query IntrospectWorkspace {
  __type(name: "Workspace") {
    name
    kind
    fields {
      name
      type {
        name
        kind
      }
    }
  }
}`,
        variables: '{}'
      },

      // Error Testing Queries
      {
        name: 'Invalid Field Test',
        query: `query InvalidFieldTest {
  workspaces {
    id
    name
    nonExistentField
  }
}`,
        variables: '{}'
      },
      {
        name: 'Missing Required Variable',
        query: `query MissingVariable($workspaceId: String!) {
  projects(workspaceId: $workspaceId) {
    id
    name
  }
}`,
        variables: '{}' // Missing required workspaceId
      },

      // Mutation with Invalid Data
      {
        name: 'Invalid Block Content Test',
        query: `mutation InvalidBlockContent($input: CreateBlockInput!) {
  createBlock(input: $input) {
    id
    content
  }
}`,
        variables: JSON.stringify({
          input: {
            experimentId: "test-experiment-id",
            blockType: "NoteBlock",
            content: "invalid-json-content", // Should be valid JSON
            orderIndex: 1
          }
        }, null, 2)
      }
    ];

    return samples;
  };

  const loadSampleQuery = (sample: { query: string, variables: string }) => {
    setQuery(sample.query);
    setVariables(sample.variables);
  };

  const exportSchema = async () => {
    try {
      const schemaSDL = await invoke<string>('export_graphql_schema');
      
      // Create a downloadable file
      const blob = new Blob([schemaSDL], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'love_note_graphql_schema.graphql';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Also show in response area
      setResponse(`# GraphQL Schema Exported Successfully!\n# You can use this schema with GraphQL Editor (https://graphqleditor.com/)\n\n${schemaSDL}`);
    } catch (error) {
      setResponse(`Failed to export schema: ${error}`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>🔗 GraphQL Test Interface</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Left Panel: Query Input */}
        <div>
          <h3>Query</h3>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={12}
            style={{
              width: '100%',
              fontFamily: 'monospace',
              fontSize: '12px',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
            placeholder="Enter your GraphQL query here..."
          />
          
          <h3 style={{ marginTop: '15px' }}>Variables (JSON)</h3>
          <textarea
            value={variables}
            onChange={(e) => setVariables(e.target.value)}
            rows={4}
            style={{
              width: '100%',
              fontFamily: 'monospace',
              fontSize: '12px',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
            placeholder='{"key": "value"}'
          />
        </div>

        {/* Right Panel: Response */}
        <div>
          <h3>Response</h3>
          <pre style={{
            backgroundColor: '#f8f9fa',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '10px',
            height: '400px',
            overflow: 'auto',
            fontSize: '12px',
            margin: 0,
            textAlign: 'left',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {response || 'Execute a query to see results...'}
          </pre>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={executeQuery}
          disabled={isLoading}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            backgroundColor: isLoading ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {isLoading ? '⏳ Executing...' : '▶️ Execute Query'}
        </button>
        
        <button
          onClick={() => { setQuery(''); setVariables('{}'); setResponse(''); }}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          🗑️ Clear All
        </button>
        
        <button
          onClick={exportSchema}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          📤 Export Schema
        </button>
      </div>

      {/* Sample Queries */}
      <div>
        <h3>📝 Sample Queries ({runSampleQueries().length} examples)</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '8px', 
          marginBottom: '10px' 
        }}>
          {runSampleQueries().map((sample, index) => {
            const category = sample.name.includes('Workspace') ? 'workspace' :
                           sample.name.includes('Project') ? 'project' :
                           sample.name.includes('Experiment') ? 'experiment' :
                           sample.name.includes('Block') ? 'block' :
                           sample.name.includes('Introspection') ? 'introspect' :
                           sample.name.includes('Invalid') || sample.name.includes('Missing') ? 'error' : 'other';
            
            const colors = {
              workspace: '#28a745',
              project: '#007bff', 
              experiment: '#fd7e14',
              block: '#6f42c1',
              introspect: '#6c757d',
              error: '#dc3545',
              other: '#17a2b8'
            };

            return (
              <button
                key={index}
                onClick={() => loadSampleQuery(sample)}
                style={{
                  padding: '8px 12px',
                  fontSize: '11px',
                  backgroundColor: colors[category as keyof typeof colors],
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                title={sample.name}
              >
                {sample.name}
              </button>
            );
          })}
        </div>
        
        <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '10px' }}>
          <strong>カテゴリ別色分け:</strong>{' '}
          <span style={{ color: '#28a745' }}>●</span> Workspace{' '}
          <span style={{ color: '#007bff' }}>●</span> Project{' '}
          <span style={{ color: '#fd7e14' }}>●</span> Experiment{' '}
          <span style={{ color: '#6f42c1' }}>●</span> Block{' '}
          <span style={{ color: '#6c757d' }}>●</span> Introspection{' '}
          <span style={{ color: '#dc3545' }}>●</span> Error Test
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#495057' }}>📋 使用方法とTips</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#6c757d' }}>
          <li><strong>サンプルクエリ:</strong> 上のボタンをクリックしてテンプレートを読み込み</li>
          <li><strong>プレースホルダー:</strong> "replace-with-*-id" を実際のIDに置き換えてください</li>
          <li><strong>スキーマエクスポート:</strong> 「📤 Export Schema」でSDLファイルをダウンロード</li>
          <li><strong>GraphQL Editor:</strong> <a href="https://graphqleditor.com/" target="_blank" style={{color: '#007bff'}}>graphqleditor.com</a> でスキーマファイルを読み込んで視覚化・共有が可能</li>
          <li><strong>変数:</strong> JSON形式で入力。mutation時は必須パラメータを確認してください</li>
        </ul>
        
        <div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#d1ecf1', borderRadius: '4px', border: '1px solid #bee5eb' }}>
          <strong style={{ fontSize: '12px', color: '#0c5460' }}>🔗 GraphQL Editor での共有手順:</strong>
          <ol style={{ margin: '5px 0 0 0', paddingLeft: '20px', fontSize: '11px', color: '#0c5460' }}>
            <li>「📤 Export Schema」ボタンでスキーマファイルをダウンロード</li>
            <li><a href="https://graphqleditor.com/" target="_blank" style={{color: '#0c5460', textDecoration: 'underline'}}>GraphQL Editor</a> にアクセス</li>
            <li>「Import」または「Load Schema」でダウンロードしたファイルを読み込み</li>
            <li>視覚的なスキーマビューとドキュメントが自動生成されます</li>
            <li>URLを共有して他の開発者と仕様を共有可能</li>
          </ol>
        </div>
      </div>
    </div>
  );
}