import { useState } from "react";
import { GraphQLTest } from "./components/GraphQLTest";
import { GraphQLSchemaExport } from "./components/GraphQLSchemaExport";
import "./App.css";

function App() {
  const [currentView, setCurrentView] = useState<'graphql' | 'schema' | 'home'>('home');

  return (
    <main className="container">
      <div className="nav-container">
        <button 
          onClick={() => setCurrentView('home')}
          className={`btn-nav ${currentView === 'home' ? 'btn-nav-active' : 'btn-nav-inactive'}`}
        >
          Home
        </button>
        <button 
          onClick={() => setCurrentView('graphql')}
          className={`btn-nav ${currentView === 'graphql' ? 'btn-nav-active' : 'btn-nav-inactive'}`}
        >
          GraphQL Test
        </button>
        <button 
          onClick={() => setCurrentView('schema')}
          className={`btn-nav ${currentView === 'schema' ? 'btn-nav-active' : 'btn-nav-inactive'}`}
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
