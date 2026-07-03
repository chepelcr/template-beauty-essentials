import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

import { configureStorefrontAmplify } from '@chepelcr/tsuru-storefront-sdk';

// Wire the W7 guest identity pool so the storefront can SigV4-sign the
// AWS_IAM-protected public API as an anonymous visitor.
configureStorefrontAmplify({
  identityPoolId:
    (import.meta.env.VITE_IDENTITY_POOL_ID as string | undefined) ??
    'us-east-1:be94bc45-883e-44ff-9eb7-3e58c23ea9e8',
  region: (import.meta.env.VITE_AWS_REGION as string | undefined) ?? 'us-east-1',
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
