import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCw, Smartphone, ScreenShare } from 'lucide-react';

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
          className="fixed inset-0 z-[100000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl touch-none select-none"
          // Blocking interaction with background
          onPointerDown={(e) => e.stopPropagation()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="w-[90vw] max-w-sm bg-white rounded-[2.5rem] p-8 text-center shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-slate-200"
          >
            <div className="space-y-8">
              {/* Header Icon */}
              <div className="flex justify-center">
                <div className="bg-blue-50 p-4 rounded-3xl border border-blue-100">
                  <ScreenShare className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              {/* Central Animation */}
              <div className="relative flex justify-center py-4">
                <motion.div
                  animate={{ 
                    rotate: [0, 90, 90, 0],
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    ease: "easeInOut",
                    times: [0, 0.4, 0.6, 1]
                  }}
                  className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 shadow-inner"
                >
                  <Smartphone className="w-20 h-20 text-slate-800" strokeWidth={1} />
                </motion.div>

                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-1 -right-1 bg-blue-600 p-4 rounded-full shadow-lg shadow-blue-600/40 border-4 border-white"
                >
                  <RotateCw className="w-6 h-6 text-white" />
                </motion.div>
              </div>

              {/* Vietnamese Text Content */}
              <div className="space-y-4">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                  VUI LÒNG <br/>
                  <span className="text-blue-600">XOAY NGANG</span>
                </h2>
                <div className="h-1.5 w-12 bg-blue-600 mx-auto rounded-full" />
                <p className="text-slate-600 text-base font-medium leading-relaxed">
                  Để sử dụng đầy đủ các tính năng quản lý, vui lòng xoay điện thoại của bạn sang chế độ nằm ngang.
                </p>
              </div>

              {/* Status Footer */}
              <div className="pt-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                  Đang kiểm tra hướng thiết bị
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OrientationLock;
