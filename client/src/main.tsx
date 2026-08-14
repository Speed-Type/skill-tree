import './index.css';
import './components/ui/ui.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App';
import SnackbarContainer from './components/ui/Snackbar';
import { AuthProvider } from './context/AuthContext';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <SnackbarContainer />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
