import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { NotificationProvider } from './context/NotificationContext';
import { DialogProvider } from './context/DialogContext';
import { AuthProvider } from './context/AuthContext';
import { LogProvider } from './context/LogContext';
import './index.css';

// Bug #10 Fix: Sắp xếp Provider theo thứ tự phụ thuộc hợp lý:
// NotificationProvider → DialogProvider → AuthProvider → LogProvider → App
// LogProvider phụ thuộc NotificationProvider (useNotification) → OK
// AuthProvider không phụ thuộc ai → đặt trước LogProvider để LogProvider có thể dùng auth nếu cần sau này
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
