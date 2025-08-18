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

// プラグインシステムを初期化
initializePluginSystem();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
