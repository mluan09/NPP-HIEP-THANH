import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCw, Smartphone } from 'lucide-react';

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
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center p-6 bg-slate-900/40 backdrop-blur-3xl"
        >
          <div className="max-w-xs w-full text-center space-y-8">
            <div className="relative flex justify-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative"
              >
                {/* Background Glow */}
                <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
                
                {/* Smartphone Icon */}
                <motion.div
                  animate={{ 
                    rotate: [0, 90, 90, 0],
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity, 
                    ease: "easeInOut",
                    times: [0, 0.4, 0.6, 1]
                  }}
                  className="relative bg-white/10 p-8 rounded-[3rem] border border-white/20 shadow-2xl backdrop-blur-md"
                >
                  <Smartphone className="w-24 h-24 text-white" strokeWidth={1} />
                </motion.div>

                {/* Rotating Indicator */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-4 -right-4 bg-blue-500 p-3 rounded-full shadow-lg shadow-blue-500/50 border-2 border-white/20"
                >
                  <RotateCw className="w-6 h-6 text-white" />
                </motion.div>
              </motion.div>
            </div>

            <div className="space-y-4">
              <motion.h2 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-black text-white uppercase tracking-tight"
              >
                Vui lòng xoay ngang
              </motion.h2>
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-slate-300 text-sm font-medium leading-relaxed"
              >
                Hệ thống NPP Hiệp Thành hoạt động tốt nhất ở chế độ nằm ngang trên thiết bị di động.
              </motion.p>
            </div>

            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="h-1 w-24 bg-gradient-to-r from-transparent via-blue-500 to-transparent mx-auto rounded-full"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OrientationLock;
