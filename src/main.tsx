import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';
import { initializePluginSystem } from './plugins';

// プラグインシステムを初期化
initializePluginSystem();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
