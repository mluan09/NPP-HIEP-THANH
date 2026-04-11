import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { NotificationProvider } from './context/NotificationContext';
import { DialogProvider } from './context/DialogContext';
import { AuthProvider } from './context/AuthContext';
import { LogProvider } from './context/LogContext';
import './index.css';

// Provider order (Bug #10 fix): Notification → Dialog → Auth → Log → App
// Data providers (Inventory, Sales, Debts, Cashbook) đặt trong DashboardPage
// để chỉ mount sau khi user đã authenticated.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NotificationProvider>
      <DialogProvider>
        <AuthProvider>
          <LogProvider>
            <App />
          </LogProvider>
        </AuthProvider>
      </DialogProvider>
    </NotificationProvider>
  </React.StrictMode>
);
