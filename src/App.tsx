import { useState } from "react";
import { GraphQLTest } from "./components/GraphQLTest";
import { GraphQLSchemaExport } from "./components/GraphQLSchemaExport";
import "./App.css";

function App() {
  const [currentView, setCurrentView] = useState<'graphql' | 'schema' | 'home'>('home');

  return (
    <main className="container">
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setCurrentView('home')}
          style={{ marginRight: '10px', backgroundColor: currentView === 'home' ? '#007acc' : '#ccc' }}
        >
          Home
        </button>
        <button 
          onClick={() => setCurrentView('graphql')}
          style={{ marginLeft: '10px', backgroundColor: currentView === 'graphql' ? '#007acc' : '#ccc' }}
        >
          GraphQL Test
        </button>
        <button 
          onClick={() => setCurrentView('schema')}
          style={{ marginLeft: '10px', backgroundColor: currentView === 'schema' ? '#007acc' : '#ccc' }}
        >
          Schema Export
        </button>
      </div>

      {currentView === 'home' ? (
        <div>
          <h1>Love Note</h1>
          <p>Electronic Lab Notebook with Tauri + React + SQLite</p>
          <p>Switch to GraphQL Test to verify database operations.</p>
        </div>
      ) : currentView === 'graphql' ? (
        <GraphQLTest />
      ) : (
        <GraphQLSchemaExport />
      )}
    </main>
  );
}

export default App;
