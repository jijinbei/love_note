import { useState } from "react";
import { HierarchicalTest } from "./components/HierarchicalTest";
import "./App.css";

function App() {
  const [currentView, setCurrentView] = useState<'hierarchical' | 'home'>('hierarchical');

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
          onClick={() => setCurrentView('hierarchical')}
          style={{ backgroundColor: currentView === 'hierarchical' ? '#007acc' : '#ccc' }}
        >
          Hierarchical Test
        </button>
      </div>

      {currentView === 'home' ? (
        <div>
          <h1>Love Note</h1>
          <p>Electronic Lab Notebook with Tauri + React + SQLite</p>
          <p>Switch to Hierarchical Test to verify database operations.</p>
        </div>
      ) : (
        <HierarchicalTest />
      )}
    </main>
  );
}

export default App;
