import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

// Types matching Rust models
interface Workspace {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface Experiment {
  id: string;
  project_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface Block {
  id: string;
  experiment_id: string;
  block_type: string;
  content: string; // JSON string
  order_index: number;
  created_at: string;
  updated_at: string;
}

// Block content types
type BlockContent = 
  | { type: 'NoteBlock'; text: string }
  | { type: 'SampleRefBlock'; sample_id: string }
  | { type: 'ProtocolRefBlock'; protocol_id: string }
  | { type: 'ImageBlock'; path: string; alt: string }
  | { type: 'TableBlock'; headers: string[]; rows: string[][] };

export function HierarchicalTest() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedExperiment, setSelectedExperiment] = useState<string>('');
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const loadWorkspaces = async () => {
    try {
      const result = await invoke<Workspace[]>('list_workspaces');
      setWorkspaces(result);
      addTestResult(`✅ Loaded ${result.length} workspaces`);
    } catch (error) {
      addTestResult(`❌ Failed to load workspaces: ${error}`);
    }
  };

  const loadProjects = async (workspaceId: string) => {
    try {
      const result = await invoke<Project[]>('list_projects', { workspaceId });
      setProjects(result);
      addTestResult(`✅ Loaded ${result.length} projects for workspace ${workspaceId}`);
    } catch (error) {
      addTestResult(`❌ Failed to load projects: ${error}`);
    }
  };

  const loadExperiments = async (projectId: string) => {
    try {
      const result = await invoke<Experiment[]>('list_experiments', { projectId });
      setExperiments(result);
      addTestResult(`✅ Loaded ${result.length} experiments for project ${projectId}`);
    } catch (error) {
      addTestResult(`❌ Failed to load experiments: ${error}`);
    }
  };

  const loadBlocks = async (experimentId: string) => {
    try {
      const result = await invoke<Block[]>('list_blocks', { experimentId });
      setBlocks(result);
      addTestResult(`✅ Loaded ${result.length} blocks for experiment ${experimentId}`);
    } catch (error) {
      addTestResult(`❌ Failed to load blocks: ${error}`);
    }
  };

  const runFullTest = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      addTestResult('🚀 Starting hierarchical database test...');

      // Step 1: Create a workspace
      const workspace = await invoke<Workspace>('create_workspace', {
        name: 'Test Lab',
        description: 'Automated test workspace'
      });
      addTestResult(`✅ Created workspace: ${workspace.name} (${workspace.id})`);

      // Step 2: Create a project
      const project = await invoke<Project>('create_project', {
        workspaceId: workspace.id,
        name: 'Protein Analysis',
        description: 'Testing protein structures'
      });
      addTestResult(`✅ Created project: ${project.name} (${project.id})`);

      // Step 3: Create an experiment
      const experiment = await invoke<Experiment>('create_experiment', {
        projectId: project.id,
        title: 'Sample Preparation Test'
      });
      addTestResult(`✅ Created experiment: ${experiment.title} (${experiment.id})`);

      // Step 4: Create various types of blocks
      const noteBlockContent: BlockContent = {
        type: 'NoteBlock',
        text: 'This is a test note block with some experimental observations.'
      };

      const noteBlock = await invoke<Block>('create_block', {
        experimentId: experiment.id,
        blockType: 'NoteBlock',
        content: noteBlockContent,
        orderIndex: 1
      });
      addTestResult(`✅ Created note block: ${noteBlock.id}`);

      const tableBlockContent: BlockContent = {
        type: 'TableBlock',
        headers: ['Sample ID', 'Concentration (mg/mL)', 'pH'],
        rows: [
          ['S001', '2.5', '7.4'],
          ['S002', '3.1', '7.2'],
          ['S003', '1.8', '7.6']
        ]
      };

      const tableBlock = await invoke<Block>('create_block', {
        experimentId: experiment.id,
        blockType: 'TableBlock',
        content: tableBlockContent,
        orderIndex: 2
      });
      addTestResult(`✅ Created table block: ${tableBlock.id}`);

      const imageBlockContent: BlockContent = {
        type: 'ImageBlock',
        path: '/path/to/microscope_image.jpg',
        alt: 'Microscope image of sample S001'
      };

      const imageBlock = await invoke<Block>('create_block', {
        experimentId: experiment.id,
        blockType: 'ImageBlock',
        content: imageBlockContent,
        orderIndex: 3
      });
      addTestResult(`✅ Created image block: ${imageBlock.id}`);

      // Step 5: Update a block
      const updatedContent: BlockContent = {
        type: 'NoteBlock',
        text: 'This note has been updated with additional observations about the sample behavior.'
      };

      await invoke('update_block', {
        blockId: noteBlock.id,
        content: updatedContent,
        orderIndex: null
      });
      addTestResult(`✅ Updated note block: ${noteBlock.id}`);

      // Step 6: Load all data to verify hierarchy
      await loadWorkspaces();
      await loadProjects(workspace.id);
      await loadExperiments(project.id);
      await loadBlocks(experiment.id);

      // Set selections for UI
      setSelectedWorkspace(workspace.id);
      setSelectedProject(project.id);
      setSelectedExperiment(experiment.id);

      addTestResult('🎉 All tests completed successfully!');

    } catch (error) {
      addTestResult(`❌ Test failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, []);

  useEffect(() => {
    if (selectedWorkspace) {
      loadProjects(selectedWorkspace);
    }
  }, [selectedWorkspace]);

  useEffect(() => {
    if (selectedProject) {
      loadExperiments(selectedProject);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (selectedExperiment) {
      loadBlocks(selectedExperiment);
    }
  }, [selectedExperiment]);

  return (
    <div className="hierarchical-test" style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>🧪 Hierarchical Database Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={runFullTest} 
          disabled={isLoading}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: isLoading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? '⏳ Running Tests...' : '🚀 Run Full Test'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Left Panel: Hierarchy Browser */}
        <div>
          <h3>📁 Data Hierarchy</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontWeight: 'bold' }}>Workspaces ({workspaces.length})</label>
            <select 
              value={selectedWorkspace} 
              onChange={(e) => setSelectedWorkspace(e.target.value)}
              style={{ width: '100%', padding: '5px' }}
            >
              <option value="">Select workspace...</option>
              {workspaces.map(ws => (
                <option key={ws.id} value={ws.id}>
                  {ws.name} ({ws.description || 'No description'})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontWeight: 'bold' }}>Projects ({projects.length})</label>
            <select 
              value={selectedProject} 
              onChange={(e) => setSelectedProject(e.target.value)}
              style={{ width: '100%', padding: '5px' }}
              disabled={!selectedWorkspace}
            >
              <option value="">Select project...</option>
              {projects.map(proj => (
                <option key={proj.id} value={proj.id}>
                  {proj.name} ({proj.description || 'No description'})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontWeight: 'bold' }}>Experiments ({experiments.length})</label>
            <select 
              value={selectedExperiment} 
              onChange={(e) => setSelectedExperiment(e.target.value)}
              style={{ width: '100%', padding: '5px' }}
              disabled={!selectedProject}
            >
              <option value="">Select experiment...</option>
              {experiments.map(exp => (
                <option key={exp.id} value={exp.id}>
                  {exp.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 'bold' }}>Blocks ({blocks.length})</label>
            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
              {blocks.length === 0 ? (
                <p style={{ color: '#666' }}>No blocks found</p>
              ) : (
                blocks.map(block => {
                  let contentPreview = '';
                  try {
                    const content = JSON.parse(block.content);
                    switch (content.type) {
                      case 'NoteBlock':
                        contentPreview = content.text.substring(0, 50) + '...';
                        break;
                      case 'TableBlock':
                        contentPreview = `Table: ${content.headers.length} columns, ${content.rows.length} rows`;
                        break;
                      case 'ImageBlock':
                        contentPreview = `Image: ${content.alt}`;
                        break;
                      default:
                        contentPreview = `${content.type}`;
                    }
                  } catch {
                    contentPreview = 'Invalid content';
                  }

                  return (
                    <div key={block.id} style={{ 
                      marginBottom: '10px', 
                      padding: '8px', 
                      backgroundColor: '#f8f9fa',
                      borderRadius: '4px'
                    }}>
                      <div style={{ fontWeight: 'bold' }}>{block.block_type} (#{block.order_index})</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{contentPreview}</div>
                      <div style={{ fontSize: '10px', color: '#999' }}>ID: {block.id}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Test Results */}
        <div>
          <h3>📋 Test Results</h3>
          <div style={{ 
            height: '400px', 
            overflowY: 'auto', 
            border: '1px solid #ccc', 
            padding: '10px',
            backgroundColor: '#f8f9fa',
            fontSize: '12px'
          }}>
            {testResults.length === 0 ? (
              <p style={{ color: '#666' }}>No test results yet. Click "Run Full Test" to start.</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} style={{ 
                  marginBottom: '5px',
                  color: result.includes('❌') ? 'red' : result.includes('✅') ? 'green' : 'black'
                }}>
                  {result}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}