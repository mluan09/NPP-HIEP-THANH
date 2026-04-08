import React, { useLayoutEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';

interface TopNavbarProps {
  activeTab: any;
  setActiveTab: (tab: any) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

const TopNavbar: React.FC<TopNavbarProps> = ({ activeTab, setActiveTab, mobileMenuOpen, setMobileMenuOpen }) => {
  const { profile, signOut } = useAuth();
  const { showConfirm, showAlert } = useDialog();

  const navRef = useRef<HTMLDivElement | null>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const compute = () => {
      const container = navRef.current;
      const activeBtn = btnRefs.current[activeTab];
      if (!container || !activeBtn) return;

      // When the nav is hidden (mobile), offsetWidth can be 0.
      if (container.offsetWidth === 0) return;

      setIndicator({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
      });
    };

    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [activeTab, mobileMenuOpen]);

  const handleLogout = async () => {
    const confirmed = await showConfirm('Bạn có chắc chắn muốn đăng xuất?');
    if (confirmed) {
      await signOut();
    }
  };

  const navItems = [
    { id: 'inventory', label: 'Kho hàng' },
    { id: 'sales', label: 'BC Bán Hàng' },
    { id: 'debt', label: 'Công nợ' },
    { id: 'cashbook', label: 'Nhật Ký Thu Chi' },
  ];

  return (
    <nav className="top-navbar glass shadow-sm">
      <div className="navbar-brand">
        <div className="logo-wrap">
          <img src="/assets/logo.png" alt="Logo" className="brand-logo-img" />
          <div className="brand-text">
            <h2 id="pageTitle">NPP Hiệp Thành</h2>
            <p id="currentUserRole">Hệ Thống Quản Lý</p>
          </div>
        </div>
      </div>

      <div ref={navRef} className={`navbar-nav ${mobileMenuOpen ? 'flex' : 'hidden'} md:flex`}>
        <div
          className="nav-indicator"
          style={{
            width: indicator.width,
            transform: `translateX(${indicator.left}px)`,
          }}
        />
        {navItems.map((item) => (
          <button
            key={item.id}
            ref={(el) => {
              btnRefs.current[item.id] = el;
            }}
            className={`nav-btn ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => {
              if (item.id === 'sales' && profile?.role !== 'dev') {
                showAlert('Tính năng Báo cáo bán hàng hiện chưa thể hoạt động, đang trong thời gian điều chỉnh.', 'Thông báo');
                return;
              }
              setActiveTab(item.id);
              setMobileMenuOpen(false);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="navbar-right">
        <div className="user-chip hidden-sm">
          <div className="user-avatar"><img src="/assets/logo.png" alt="User" className="user-logo-img" /></div>
          <div className="user-info">
            <strong id="currentUserName">{profile?.full_name || profile?.name || profile?.email}</strong>
            <p id="userRoleText">
              {profile?.role === 'owner' ? 'Chủ' : profile?.role === 'dev' ? 'Developer' : 'Cộng Tác Viên'}
            </p>
          </div>
        </div>
        <button id="logoutBtn" onClick={handleLogout} className="btn btn-outline btn-sm">Thoát</button>
        <button 
          id="mobileMenuBtn" 
          className="btn btn-outline md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          Menu
        </button>
      </div>
    </nav>
  );
};

export default TopNavbar;
