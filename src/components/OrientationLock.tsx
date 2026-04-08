import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCw, AlertTriangle } from 'lucide-react';

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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000000] bg-slate-900/40 backdrop-blur-md touch-none select-none"
          style={{ pointerEvents: 'auto' }}
          onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onPointerMove={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onPointerUp={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onWheel={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          <div className="toast-container">
            <motion.div
              layout
              initial={{ opacity: 0, y: -50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="toast-item shadow-premium"
              style={{ 
                borderLeftColor: '#f59e0b',
                cursor: 'default'
              }}
            >
              <div style={{ flexShrink: 0, display: 'flex' }}>
                <AlertTriangle size={20} color="#f59e0b" />
              </div>
              
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>
                  Vui lòng xoay ngang
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', fontWeight: 500, color: '#64748b', lineHeight: 1.4 }}>
                  Để sử dụng, hãy xoay thiết bị nằm ngang.
                </p>
              </div>

              <div style={{ flexShrink: 0, opacity: 0.4, display: 'flex', alignItems: 'center' }}>
                <RotateCw size={16} className="animate-spin-slow" style={{ animation: 'spin 3s linear infinite' }} />
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OrientationLock;
