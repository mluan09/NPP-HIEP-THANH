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
              className="user-chip cursor-pointer hover:bg-white/50 transition-colors flex items-center pr-2" 
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

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95, filter: 'blur(5px)' }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: 10, scale: 0.95, filter: 'blur(5px)' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="absolute right-0 mt-3 w-60 bg-slate-800/95 backdrop-blur-2xl shadow-[0_15px_40px_rgba(0,0,0,0.4)] rounded-2xl p-1.5 z-50 flex flex-col gap-1 border border-slate-700/50"
                >
                  <motion.button
                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.1)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setDropdownOpen(false); setBugModalOpen(true); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-700/50 text-blue-400 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                      <Bug size={16} />
                    </div>
                    <span className="font-semibold text-slate-200 text-[14px] group-hover:text-white transition-colors">Báo cáo lỗi</span>
                  </motion.button>
                  
                  <div className="h-[1px] bg-slate-600/50 mx-3 my-0.5" />
                  
                  <motion.button
                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.1)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setDropdownOpen(false); handleLogout(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-700/50 text-red-500 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors duration-300">
                      <LogOut size={16} />
                    </div>
                    <span className="font-semibold text-slate-200 text-[14px] group-hover:text-white transition-colors">Đăng xuất</span>
                  </motion.button>
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
                  <motion.button 
                    whileHover={{ scale: 1.02, y: -2 }} 
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => handleEmailClick(e, contactConfig.email)} 
                    className="group relative w-full flex items-center justify-between px-5 py-3 bg-white hover:bg-red-50/50 border-2 border-slate-100 hover:border-red-200 rounded-full shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="flex items-center gap-4 relative z-10 w-full">
                      <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-red-400 to-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:scale-110 transition-transform duration-300"><Mail size={18} /></div>
                      <span className="font-bold text-[15px] text-slate-700 group-hover:text-red-700 transition-colors flex-1 text-left">Gửi qua Gmail</span>
                    </div>
                  </motion.button>

                  <motion.button 
                    whileHover={{ scale: 1.02, y: -2 }} 
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.open(contactConfig.facebook, '_blank')} 
                    className="group relative w-full flex items-center justify-between px-5 py-3 bg-white hover:bg-blue-50/50 border-2 border-slate-100 hover:border-blue-200 rounded-full shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="flex items-center gap-4 relative z-10 w-full">
                      <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 group-hover:scale-110 transition-transform duration-300">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                      </div>
                      <span className="font-bold text-[15px] text-slate-700 group-hover:text-blue-700 transition-colors flex-1 text-left">Nhắn tin Facebook</span>
                    </div>
                  </motion.button>

                  <motion.button 
                    whileHover={{ scale: 1.02, y: -2 }} 
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.open(contactConfig.zaloLink, '_blank')} 
                    className="group relative w-full flex items-center justify-between px-5 py-3 bg-white hover:bg-indigo-50/50 border-2 border-slate-100 hover:border-indigo-200 rounded-full shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="flex items-center gap-4 relative z-10 w-full">
                      <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-300"><MessageCircle size={18} /></div>
                      <span className="font-bold text-[15px] text-slate-700 group-hover:text-indigo-700 transition-colors flex-1 text-left">Liên hệ Zalo</span>
                    </div>
                  </motion.button>
                </div>
                
                <div className="mt-8 flex justify-center">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setBugModalOpen(false)} 
                    className="px-10 py-3 rounded-full bg-slate-100/80 hover:bg-slate-200 text-slate-600 outline-none text-sm font-bold shadow-sm transition-colors border-2 border-slate-200/50"
                  >
                    Đóng lại
                  </motion.button>
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
