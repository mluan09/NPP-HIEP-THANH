import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCw, Smartphone, ShieldAlert } from 'lucide-react';

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
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl touch-none select-none"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative max-w-sm w-full bg-white/5 border border-white/10 rounded-[2.5rem] p-8 text-center shadow-[0_0_80px_-15px_rgba(59,130,246,0.5)] overflow-hidden"
          >
            {/* Background decorative elements */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/20 blur-[80px] rounded-full" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 blur-[80px] rounded-full" />

            <div className="relative space-y-8">
              {/* Alert Icon */}
              <div className="flex justify-center">
                <div className="bg-blue-500/20 p-3 rounded-2xl border border-blue-500/30">
                  <ShieldAlert className="w-6 h-6 text-blue-400" />
                </div>
              </div>

              {/* Animation Container */}
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
                  className="relative bg-gradient-to-br from-white/10 to-white/5 p-10 rounded-[2.5rem] border border-white/20 shadow-2xl"
                >
                  <Smartphone className="w-20 h-20 text-white" strokeWidth={1} />
                </motion.div>

                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-2 -right-2 bg-blue-600 p-4 rounded-full shadow-2xl shadow-blue-600/50 border-2 border-white/20"
                >
                  <RotateCw className="w-6 h-6 text-white" />
                </motion.div>
              </div>

              {/* Text Content */}
              <div className="space-y-4">
                <h2 className="text-3xl font-black text-white leading-none tracking-tight">
                  VUI LÒNG <br/>
                  <span className="text-blue-400">XOAY NGANG</span>
                </h2>
                <p className="text-slate-400 text-base font-medium leading-relaxed">
                  Để bảo vệ tính toàn vẹn của dữ liệu và hiển thị đầy đủ các cột báo cáo, ứng dụng yêu cầu chế độ nằm ngang.
                </p>
              </div>

              {/* Status Indicator */}
              <div className="pt-4">
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  Đang đợi thiết bị xoay...
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OrientationLock;
