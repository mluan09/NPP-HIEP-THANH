import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { LogProvider } from './context/LogContext';
import { DialogProvider } from './context/DialogContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DialogProvider>
      <NotificationProvider>
        <LogProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </LogProvider>
      </NotificationProvider>
    </DialogProvider>
  </React.StrictMode>
);
