import React, { useState } from 'react';
import Footer from '../components/Footer';
import { supabase } from '../lib/supabase';
import { useNotification } from '../context/NotificationContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      showNotification('Đăng nhập thất bại: ' + authError.message, 'error');
      setLoading(false);
    } else {
      showNotification('Đăng nhập thành công!', 'success');
    }
  };

  return (
    <div id="loginScreen" className="login-screen">
      <div className="login-card glass reveal shadow-soft show">
        <div className="login-brand">
          <div className="brand-badge">Hệ thống quản lý v1.0</div>
          <img src="/assets/logo.png" alt="An Nhiên Logo" className="login-logo-img" />
          <h1>NPP HIỆP THÀNH</h1>
          <p>Nền tảng quản trị kinh doanh nội bộ</p>
        </div>
        
        <div className="login-single-wrap">
          <form className="login-box" onSubmit={handleLogin}>
            <h2>Đăng Nhập</h2>
            <div className="field">
              <label>Tài khoản Email</label>
              <input 
                type="email" 
                id="loginEmail" 
                placeholder="name@annhien.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Mật khẩu</label>
              <input 
                type="password" 
                id="loginPassword" 
                placeholder="••••••••" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="field-row">
              <label className="checkbox-container">
                <input type="checkbox" id="rememberMe" defaultChecked />
                <span className="checkmark"></span>
                Ghi nhớ đăng nhập
              </label>
            </div>
            <button id="loginBtn" type="submit" className="btn btn-primary full py-3" disabled={loading}>
              {loading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG NHẬP HỆ THỐNG'}
            </button>
            <p className="muted text-center mt-3 text-xs">Liên hệ quản trị viên nếu quên mật khẩu</p>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LoginPage;
