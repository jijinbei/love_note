import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { graphQLSamples, type GraphQLSample } from './graphQLSamples';

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

  const loadSampleQuery = (sample: GraphQLSample) => {
    setQuery(sample.query);
    setVariables(sample.variables);
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
            wordBreak: 'break-word',
            color: '#212529' // dark text for visibility
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
      </div>

      {/* Sample Queries */}
      <div>
        <h3>📝 Sample Queries ({graphQLSamples.length} examples)</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '8px', 
          marginBottom: '10px' 
        }}>
          {graphQLSamples.map((sample, index) => {
            const category = sample.name.includes('User') ? 'user' :
                           sample.name.includes('Workspace') ? 'workspace' :
                           sample.name.includes('Project') ? 'project' :
                           sample.name.includes('Experiment') ? 'experiment' :
                           sample.name.includes('Block') ? 'block' :
                           sample.name.includes('Introspection') ? 'introspect' :
                           sample.name.includes('Invalid') || sample.name.includes('Missing') || sample.name.includes('Duplicate') ? 'error' : 'other';
            
            const colors = {
              user: '#e83e8c',
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
          <span style={{ color: '#e83e8c' }}>●</span> User{' '}
          <span style={{ color: '#28a745' }}>●</span> Workspace{' '}
          <span style={{ color: '#007bff' }}>●</span> Project{' '}
          <span style={{ color: '#fd7e14' }}>●</span> Experiment{' '}
          <span style={{ color: '#6f42c1' }}>●</span> Block{' '}
          <span style={{ color: '#6c757d' }}>●</span> Introspection{' '}
          <span style={{ color: '#dc3545' }}>●</span> Error Test
        </div>
      </div>
    </div>
  );
}