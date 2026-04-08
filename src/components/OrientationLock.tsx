import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, RotateCw } from 'lucide-react';

const OrientationLock: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkState = () => {
      const mobileQuery = window.matchMedia("(max-width: 1024px) and (pointer: coarse)");
      const portraitQuery = window.matchMedia("(orientation: portrait)");
      
      setIsMobile(mobileQuery.matches);
      setIsPortrait(portraitQuery.matches);
    };

    checkState();

    const portraitListener = (e: MediaQueryListEvent) => setIsPortrait(e.matches);
    const mobileListener = (e: MediaQueryListEvent) => setIsMobile(e.matches);

    const mQuery = window.matchMedia("(max-width: 1024px) and (pointer: coarse)");
    const pQuery = window.matchMedia("(orientation: portrait)");

    pQuery.addEventListener('change', portraitListener);
    mQuery.addEventListener('change', mobileListener);

    return () => {
      pQuery.removeEventListener('change', portraitListener);
      mQuery.removeEventListener('change', mobileListener);
    };
  }, []);

  // Only show if it's a mobile device in portrait mode
  const showLock = isMobile && isPortrait;

  return (
    <AnimatePresence>
      {showLock && (
        <div className="dialog-overlay"
          style={{ pointerEvents: 'auto', touchAction: 'none' }}
          onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onPointerMove={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onPointerUp={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onWheel={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: -1 }}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="dialog-modal"
          >
            <div className="dialog-modal-decor" />
            
            <div className="dialog-icon-wrap" style={{ background: '#dbeafe', color: '#3b82f6' }}>
              <motion.div
                animate={{ rotate: [0, 90, 90, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Smartphone size={32} />
              </motion.div>
            </div>
            
            <h3 className="dialog-title">Yêu cầu xoay ngang</h3>
            <p className="dialog-message">Để sử dụng ứng dụng với đầy đủ tính năng, vui lòng xoay thiết bị của bạn sang chế độ nằm ngang.</p>
            
            <div className="dialog-actions" style={{ justifyContent: 'center', marginTop: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px', fontWeight: 600 }}>
                <RotateCw size={18} className="animate-spin-slow" style={{ animation: 'spin 3s linear infinite' }} />
                <span>Đang chờ xoay thiết bị...</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default OrientationLock;
