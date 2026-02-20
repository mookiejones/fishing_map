/**
 * @file main.tsx — Application entry point.
 *
 * Mounts the React component tree into `#root` (defined in `index.html`).
 * `React.StrictMode` is enabled to surface lifecycle issues in development.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
