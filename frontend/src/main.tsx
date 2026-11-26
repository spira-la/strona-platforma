import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/styles/spirala-theme.css';
import '@/config/i18n';
import App from '@/App';
import { loadAnalytics } from '@/lib/analytics';

// no-op while the `analytics` feature flag is off (site collects no data)
loadAnalytics();

const root = document.querySelector('#root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
// force rebuild 1776347448
