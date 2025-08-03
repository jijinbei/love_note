import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

export function GraphQLSchemaExport() {
  const [schema, setSchema] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const loadSchema = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setCopySuccess(false);
      
      const schemaSDL = await invoke<string>('export_graphql_schema');
      setSchema(schemaSDL);
      
    } catch (err) {
      console.error('Schema export error:', err);
      setError(`Failed to export schema: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!schema) return;
    
    try {
      setCopySuccess(false);
      await navigator.clipboard.writeText(schema);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (err) {
      console.error('Clipboard error:', err);
      setError(`Failed to copy to clipboard: ${err instanceof Error ? err.message : 'Permission denied'}`);
      setTimeout(() => setError(null), 5000);
    }
  };

  return (
    <div style={{ 
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <div style={{ 
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        <h2 style={{ 
          margin: '0 0 10px 0', 
          fontSize: '24px',
          color: '#2d3748'
        }}>
          📊 GraphQL Schema Export
        </h2>
        <p style={{ 
          margin: 0, 
          color: '#718096',
          fontSize: '16px' 
        }}>
          Export your GraphQL schema to use with external visualization tools
        </p>
      </div>

      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'center',
        marginBottom: '30px'
      }}>
        <button 
          onClick={loadSchema}
          disabled={isLoading}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: '600',
            backgroundColor: isLoading ? '#a0aec0' : '#4299e1',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'all 0.2s',
            minWidth: '160px'
          }}
          onMouseOver={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = '#3182ce';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseOut={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = '#4299e1';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          {isLoading ? '⏳ Loading...' : '📊 Load Schema'}
        </button>

        {schema && (
          <button 
            onClick={copyToClipboard}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              backgroundColor: '#48bb78',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#38a169';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#48bb78';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            📋 Copy to Clipboard
          </button>
        )}
      </div>

      {/* Status Messages */}
      {copySuccess && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#c6f6d5',
          border: '1px solid #9ae6b4',
          borderRadius: '8px',
          color: '#22543d',
          marginBottom: '20px',
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          ✅ Schema copied to clipboard successfully!
        </div>
      )}

      {error && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#fed7d7',
          border: '1px solid #fc8181',
          borderRadius: '8px',
          color: '#742a2a',
          marginBottom: '20px',
          textAlign: 'center',
          fontSize: '14px'
        }}>
          ❌ {error}
        </div>
      )}

      {/* Schema Preview */}
      {schema && (
        <div style={{
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: 'white',
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
        }}>
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#f7fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: '600',
              color: '#4a5568'
            }}>
              📄 schema.graphql
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#718096'
            }}>
              {schema.length.toLocaleString()} characters | {schema.split('\n').length} lines
            </div>
          </div>
          <div style={{
            padding: '16px',
            fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace',
            fontSize: '12px',
            lineHeight: '1.5',
            color: '#2d3748',
            backgroundColor: '#f8f9fa',
            maxHeight: '300px',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            textAlign: 'left'
          }}>
            {schema.substring(0, 1000)}
            {schema.length > 1000 && (
              <div style={{ 
                color: '#718096', 
                fontStyle: 'italic',
                marginTop: '8px' 
              }}>
                ... ({(schema.length - 1000).toLocaleString()} more characters)
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#edf2f7',
        borderRadius: '12px',
        borderLeft: '4px solid #4299e1'
      }}>
        <h3 style={{ 
          margin: '0 0 12px 0',
          fontSize: '16px',
          color: '#2d3748'
        }}>
          🚀 Recommended Visualization Tools
        </h3>
        <ul style={{ 
          margin: '0',
          paddingLeft: '0',
          color: '#4a5568',
          lineHeight: '1.6'
        }}>
          <li><strong>GraphQL Voyager:</strong> <code>https://graphql-kit.com/graphql-voyager/</code></li>
          <li><strong>GraphQL Editor:</strong> <code>https://app.graphqleditor.com/</code></li>
          <li><strong>GraphiQL:</strong> Interactive query interface</li>
        </ul>
        
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#bee3f8',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#2a4365'
        }}>
          💡 <strong>Tips:</strong> After copying, paste the schema into any of these tools to see an interactive graph visualization of your data relationships!
        </div>
      </div>
    </div>
  );
}