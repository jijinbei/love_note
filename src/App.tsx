import { useState } from "react";
import { HierarchicalTest } from "./components/HierarchicalTest";
import "./App.css";

function App() {
  const [currentView, setCurrentView] = useState<'hierarchical' | 'home'>('hierarchical');

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
          onClick={() => setCurrentView('hierarchical')}
          className={`btn-nav ${currentView === 'hierarchical' ? 'btn-nav-active' : 'btn-nav-inactive'}`}
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
