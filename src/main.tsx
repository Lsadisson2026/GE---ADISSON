import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Defensive check for fetch redefinition issues
if (typeof window !== 'undefined' && !window.fetch) {
  console.warn('Fetch not found in window, ensuring it is available.');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
