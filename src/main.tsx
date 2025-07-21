import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress StackBlitz/WebContainer console warnings in development
if (import.meta.env.DEV) {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const message = args.join(' ');
    // Filter out StackBlitz/WebContainer specific warnings
    if (
      message.includes('webcontainer') ||
      message.includes('credentialless') ||
      message.includes('fetch.worker') ||
      message.includes('preloaded using link preload but not used')
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };

  const originalError = console.error;
  console.error = (...args) => {
    const message = args.join(' ');
    // Filter out StackBlitz/WebContainer specific errors
    if (
      message.includes('webcontainer') ||
      message.includes('credentialless') ||
      message.includes('local-credentialless.webcontainer-api.io')
    ) {
      return;
    }
    originalError.apply(console, args);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
