import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface Document {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export function DocumentTest() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [updateId, setUpdateId] = useState('');
  const [updateTitle, setUpdateTitle] = useState('');
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  // Load all documents
  const loadDocuments = async () => {
    try {
      const docs = await invoke<Document[]>('list_documents');
      setDocuments(docs);
      addTestResult(`✅ Load documents success: ${docs.length} items`);
    } catch (error) {
      addTestResult(`❌ Load documents failed: ${error}`);
    }
  };

  // Create new document
  const createDocument = async () => {
    if (!newTitle.trim()) {
      addTestResult('❌ Title is empty');
      return;
    }

    try {
      const doc = await invoke<Document>('create_document', { title: newTitle });
      addTestResult(`✅ Create document success: ${doc.title} (ID: ${doc.id})`);
      setNewTitle('');
      await loadDocuments();
    } catch (error) {
      addTestResult(`❌ Create document failed: ${error}`);
    }
  };

  // Get single document
  const getDocument = async (id: string) => {
    try {
      const doc = await invoke<Document | null>('get_document', { id });
      if (doc) {
        addTestResult(`✅ Get document success: ${doc.title}`);
      } else {
        addTestResult(`❌ Document not found: ID ${id}`);
      }
    } catch (error) {
      addTestResult(`❌ Get document failed: ${error}`);
    }
  };

  // Update document
  const updateDocument = async () => {
    if (!updateId.trim() || !updateTitle.trim()) {
      addTestResult('❌ ID or title is empty');
      return;
    }

    try {
      const doc = await invoke<Document | null>('update_document', { 
        id: updateId, 
        title: updateTitle 
      });
      if (doc) {
        addTestResult(`✅ Update document success: ${doc.title}`);
        setUpdateId('');
        setUpdateTitle('');
        await loadDocuments();
      } else {
        addTestResult(`❌ Document to update not found: ID ${updateId}`);
      }
    } catch (error) {
      addTestResult(`❌ Update document failed: ${error}`);
    }
  };

  // Delete document
  const deleteDocument = async (id: string) => {
    try {
      const success = await invoke<boolean>('delete_document', { id });
      if (success) {
        addTestResult(`✅ Delete document success: ID ${id}`);
        await loadDocuments();
      } else {
        addTestResult(`❌ Document to delete not found: ID ${id}`);
      }
    } catch (error) {
      addTestResult(`❌ Delete document failed: ${error}`);
    }
  };

  // Run full CRUD test
  const runFullTest = async () => {
    addTestResult('🧪 Starting full CRUD test');
    
    // 1. Create
    const testTitle = `Test Document ${Date.now()}`;
    try {
      const doc = await invoke<Document>('create_document', { title: testTitle });
      addTestResult(`✅ [1/4] Create test success: ${doc.title}`);
      
      // 2. Read (single)
      const retrieved = await invoke<Document | null>('get_document', { id: doc.id });
      if (retrieved && retrieved.title === testTitle) {
        addTestResult(`✅ [2/4] Read test success: ${retrieved.title}`);
      } else {
        addTestResult(`❌ [2/4] Read test failed`);
        return;
      }
      
      // 3. Update
      const updatedTitle = `${testTitle} (Updated)`;
      const updated = await invoke<Document | null>('update_document', {
        id: doc.id,
        title: updatedTitle
      });
      if (updated && updated.title === updatedTitle) {
        addTestResult(`✅ [3/4] Update test success: ${updated.title}`);
      } else {
        addTestResult(`❌ [3/4] Update test failed`);
        return;
      }
      
      // 4. Delete
      const deleted = await invoke<boolean>('delete_document', { id: doc.id });
      if (deleted) {
        addTestResult(`✅ [4/4] Delete test success`);
        addTestResult(`🎉 Full CRUD test completed successfully!`);
      } else {
        addTestResult(`❌ [4/4] Delete test failed`);
      }
      
    } catch (error) {
      addTestResult(`❌ Error during full test: ${error}`);
    }
    
    await loadDocuments();
  };

  // Load documents on component mount
  useEffect(() => {
    loadDocuments();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Document CRUD Test</h2>
      
      {/* Create test */}
      <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
        <h3>Create</h3>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New document title"
          style={{ marginRight: '10px', padding: '5px', width: '300px' }}
        />
        <button onClick={createDocument}>Create</button>
      </div>

      {/* Update test */}
      <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
        <h3>Update</h3>
        <input
          type="text"
          value={updateId}
          onChange={(e) => setUpdateId(e.target.value)}
          placeholder="Document ID to update"
          style={{ marginRight: '10px', padding: '5px', width: '200px' }}
        />
        <input
          type="text"
          value={updateTitle}
          onChange={(e) => setUpdateTitle(e.target.value)}
          placeholder="New title"
          style={{ marginRight: '10px', padding: '5px', width: '200px' }}
        />
        <button onClick={updateDocument}>Update</button>
      </div>

      {/* Document list */}
      <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
        <h3>Documents List</h3>
        <button onClick={loadDocuments} style={{ marginBottom: '10px' }}>
          Reload
        </button>
        {documents.length === 0 ? (
          <p>No documents found</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left' }}>
            {documents.map((doc) => (
              <li key={doc.id} style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px' }}>
                <strong>{doc.title}</strong>
                <br />
                <small>ID: {doc.id}</small>
                <br />
                <small>Created: {doc.created_at}</small>
                <br />
                <small>Updated: {doc.updated_at}</small>
                <br />
                <button 
                  onClick={() => getDocument(doc.id)}
                  style={{ marginRight: '5px', marginTop: '5px', padding: '4px 8px' }}
                >
                  Get Test
                </button>
                <button 
                  onClick={() => deleteDocument(doc.id)}
                  style={{ marginTop: '5px', padding: '4px 8px', backgroundColor: '#ff6b6b', color: 'white', border: 'none', borderRadius: '2px' }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Full test */}
      <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
        <h3>Full Test</h3>
        <button 
          onClick={runFullTest}
          style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white' }}
        >
          Run Full CRUD Test
        </button>
      </div>

      {/* Test results */}
      <div style={{ padding: '10px', border: '1px solid #ccc', backgroundColor: '#f9f9f9' }}>
        <h3>Test Results</h3>
        <div style={{ height: '300px', overflowY: 'scroll', backgroundColor: 'white', padding: '10px' }}>
          {testResults.length === 0 ? (
            <p>No test results yet</p>
          ) : (
            testResults.map((result, index) => (
              <div key={index} style={{ marginBottom: '2px', fontSize: '12px' }}>
                {result}
              </div>
            ))
          )}
        </div>
        <button 
          onClick={() => setTestResults([])}
          style={{ marginTop: '10px' }}
        >
          Clear Results
        </button>
      </div>
    </div>
  );
}