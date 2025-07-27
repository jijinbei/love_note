import { useState } from "react";
import { DocumentTest } from "./components/DocumentTest";
import "./App.css";

function App() {
  const [currentView, setCurrentView] = useState<'test' | 'home'>('test');

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
          onClick={() => setCurrentView('test')}
          style={{ backgroundColor: currentView === 'test' ? '#007acc' : '#ccc' }}
        >
          CRUD Test
        </button>
      </div>

      {currentView === 'home' ? (
        <div>
          <h1>Love Note</h1>
          <p>Electronic Lab Notebook with Tauri + React + SQLite</p>
          <p>Switch to CRUD Test tab to test document operations.</p>
        </div>
      ) : (
        <DocumentTest />
      )}
    </main>
  );
}

export default App;
