import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'katex/dist/katex.min.css'; // LaTeX math styling
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

import { APIKeysProvider } from './contexts/APIKeysContext';

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <APIKeysProvider>
      <App />
    </APIKeysProvider>
  </React.StrictMode>
);