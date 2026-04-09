import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Bug, Mail, MessageCircle, ChevronDown } from 'lucide-react';
import { contactConfig } from '../config/contact';

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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bugModalOpen, setBugModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const compute = () => {
      const container = navRef.current;
      const activeBtn = btnRefs.current[activeTab];
      if (!container || !activeBtn) return;

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleLogout = async () => {
    const confirmed = await showConfirm('Bạn có chắc chắn muốn đăng xuất?');
    if (confirmed) {
      await signOut();
    }
  };

  const handleEmailClick = (e: React.MouseEvent, email: string) => {
    e.preventDefault();
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (!isMobile) {
      window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${email}`, '_blank');
      return;
    }

    if (isAndroid) {
      window.location.href = `intent://compose?to=${email}#Intent;scheme=mailto;package=com.google.android.gm;end`;
    } else if (isIOS) {
      window.location.href = `googlegmail://co?to=${email}`;
    }
    
    setTimeout(() => {
      if (!document.hidden) {
        window.location.href = `mailto:${email}`;
      }
    }, 800);
  };

  const navItems = [
    { id: 'inventory', label: 'Kho hàng' },
    { id: 'sales', label: 'BC Bán Hàng' },
    { id: 'debt', label: 'Công nợ' },
    { id: 'cashbook', label: 'Nhật Ký Thu Chi' },
  ];

  return (
    <>
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
          <div className="user-chip-wrapper relative" ref={dropdownRef}>
            <div 
              className="user-chip cursor-pointer hover:bg-white/50 transition-colors hidden-sm flex items-center pr-2" 
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="user-avatar"><img src="/assets/logo.png" alt="User" className="user-logo-img" /></div>
              <div className="user-info">
                <strong id="currentUserName">{profile?.full_name || profile?.name || profile?.email}</strong>
                <p id="userRoleText">
                  {profile?.role === 'owner' ? 'Chủ' : profile?.role === 'dev' ? 'Developer' : 'Cộng Tác Viên'}
                </p>
              </div>
              <ChevronDown size={14} className={`ml-2 text-slate-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Mobile simplified trigger */}
            <div 
              className="user-chip cursor-pointer md:hidden flex items-center pl-2 pr-2" 
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="user-avatar m-0 !w-8 !h-8"><img src="/assets/logo.png" alt="User" className="user-logo-img" /></div>
            </div>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-52 bg-white/95 backdrop-blur-xl border border-white/40 shadow-2xl rounded-2xl py-2 z-50 overflow-hidden"
                >
                  <button
                    onClick={() => { setDropdownOpen(false); setBugModalOpen(true); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50/80 text-sm text-slate-700 transition"
                  >
                    <Bug size={16} className="text-blue-500" /> <span className="font-semibold">Báo cáo lỗi</span>
                  </button>
                  <div className="h-[1px] bg-slate-200/50 my-1"></div>
                  <button
                    onClick={() => { setDropdownOpen(false); handleLogout(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50/80 text-sm text-red-600 transition"
                  >
                    <LogOut size={16} /> <span className="font-semibold">Đăng xuất</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <button 
            id="mobileMenuBtn" 
            className="btn btn-outline md:hidden ml-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            Menu
          </button>
        </div>
      </nav>

      {/* Bug Report Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {bugModalOpen && (
            <div className="dialog-overlay"
              style={{ pointerEvents: 'auto', zIndex: 999999 }}
              onClick={() => setBugModalOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: -1 }}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="dialog-modal"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '400px' }}
              >
                <div className="dialog-modal-decor" />
                
                <div className="dialog-icon-wrap" style={{ background: '#dbeafe', color: '#3b82f6' }}>
                  <Bug size={32} />
                </div>
                
                <h3 className="dialog-title">Báo Cáo Lỗi Hệ Thống</h3>
                <p className="dialog-message">Bạn có thể chọn một trong các phương thức liên hệ dưới đây để báo lỗi trực tiếp cho nhóm phát triển.</p>
                
                <div className="flex flex-col gap-3 mt-6">
                  <button onClick={(e) => handleEmailClick(e, contactConfig.email)} className="w-full flex items-center justify-between px-4 py-3 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition text-slate-700 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md"><Mail size={16} /></div>
                      <span className="font-bold text-[15px]">Gửi qua Gmail</span>
                    </div>
                  </button>

                  <button onClick={() => window.open(contactConfig.facebook, '_blank')} className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition text-slate-700 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                      </div>
                      <span className="font-bold text-[15px]">Nhắn tin Facebook</span>
                    </div>
                  </button>

                  <button onClick={() => window.open(contactConfig.zaloLink, '_blank')} className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition text-slate-700 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md"><MessageCircle size={16} /></div>
                      <span className="font-bold text-[15px]">Liên hệ Zalo</span>
                    </div>
                  </button>
                </div>
                
                <div className="mt-8 flex justify-center">
                  <button onClick={() => setBugModalOpen(false)} className="px-8 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold shadow-sm transition">Đóng lại</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default TopNavbar;
