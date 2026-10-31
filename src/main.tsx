import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeColorScheme, initStorefrontAuth } from '@/core';
import App from './App';
import './index.css';

initializeColorScheme();
initStorefrontAuth();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
