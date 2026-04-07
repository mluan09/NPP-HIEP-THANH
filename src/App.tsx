import React from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import NiceNotification from './components/NiceNotification';

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg font-medium">Đang tải hệ thống...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="app-bg"></div>
      {user ? <DashboardPage /> : <LoginPage />}
      <NiceNotification />
    </>
  );
};

export default App;
