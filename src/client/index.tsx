import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

const style = document.createElement('style');
style.textContent = `
  :root {
    --primary: #2563eb;
    --primary-hover: #1d4ed8;
    --primary-light: #eff6ff;
    --secondary: #64748b;
    --background: #f8fafc;
    --surface: #ffffff;
    --text: #0f172a;
    --text-muted: #64748b;
    --text-subtle: #94a3b8;
    --border: #e2e8f0;
    --border-subtle: #f1f5f9;
    --danger: #ef4444;
    --danger-light: #fee2e2;
    --success: #10b981;
    --success-light: #dcfce7;
    --warning: #f59e0b;
    --warning-light: #fef3c7;
    --info: #0284c7;
    --info-light: #e0f2fe;
    
    --radius-sm: 6px;
    --radius-md: 10px;
    --radius-lg: 14px;
    --radius-xl: 20px;
    --radius-full: 9999px;

    --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
    --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.07);
    --shadow-lg: 0 12px 24px -4px rgba(0, 0, 0, 0.1);
    --shadow-glow: 0 0 16px rgba(37, 99, 235, 0.25);
  }
  
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  
  body {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background-color: var(--background);
    color: var(--text);
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  button {
    font-family: inherit;
    cursor: pointer;
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  }

  button:active {
    transform: scale(0.98);
  }
  
  input, select, textarea {
    font-family: inherit;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
  }

  /* Custom Clean Scrollbar */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 9999px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }

  .hover-card {
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .hover-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
`;
document.head.appendChild(style);

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary><App /></ErrorBoundary>
  </React.StrictMode>
);
