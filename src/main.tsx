import React from 'react';
import ReactDOM from 'react-dom/client';
import * as ReactDOMAll from 'react-dom';
import App from './App';
import './App.css';
import { initializePluginSystem } from './plugins';

// プラグインシステムで使用するためReactをグローバルに公開
declare global {
  interface Window {
    React: typeof React;
    ReactDOM: typeof ReactDOM & typeof ReactDOMAll;
  }
}

window.React = React;
window.ReactDOM = { ...ReactDOM, ...ReactDOMAll };

// プラグインシステムを非同期で初期化
async function initApp() {
  try {
    await initializePluginSystem();
  } catch (error) {
    console.error('Failed to initialize plugin system:', error);
  }

  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

initApp();
