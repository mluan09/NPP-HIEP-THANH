import React, { useState } from 'react';
import { Mail, MessageCircle, Bug } from 'lucide-react';
import { contactConfig } from '../config/contact';
import { motion, AnimatePresence } from 'framer-motion';

const Footer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <footer className="footer-section mt-auto pb-8 pt-2 px-6">
      <div className="max-w-7xl mx-auto flex justify-start">
        <motion.div 
          layout
          className="pill-container glass shadow-premium border border-white/50 rounded-full flex items-center overflow-hidden"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* Main Button / Title */}
          <motion.button
            layout
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2.5 px-4 py-2.5 outline-none border-none select-none"
          >
            <div className={`p-1.5 rounded-lg transition-colors ${isOpen ? 'bg-blue-500 text-white' : 'bg-slate-200/50 text-blue-600'}`}>
              <Bug size={16} className={isOpen ? 'animate-pulse' : ''} />
            </div>
            <span className="text-[13px] font-extrabold tracking-tight text-slate-700 whitespace-nowrap uppercase">
              Báo Lỗi Dev
            </span>
          </motion.button>

          {/* Expanded Content */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0, scale: 0.9 }}
                animate={{ width: 'auto', opacity: 1, scale: 1 }}
                exit={{ width: 0, opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, ease: 'circOut' }}
                className="flex items-center gap-1 pr-3"
              >
                <div className="h-6 w-[1px] bg-slate-300/60 mx-1" />
                
                <div className="flex items-center gap-1.5">
                  {/* Email */}
                  <motion.a 
                    whileHover={{ y: -3, scale: 1.1 }}
                    href={`mailto:${contactConfig.email}`}
                    className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-white hover:shadow-md transition-all border border-blue-100"
                    title="Email"
                  >
                    <Mail size={14} />
                  </motion.a>

                  {/* Facebook */}
                  <motion.a 
                    whileHover={{ y: -3, scale: 1.1 }}
                    href={contactConfig.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-white hover:shadow-md transition-all border border-blue-100"
                    title="Facebook"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                  </motion.a>

                  {/* Zalo */}
                  <motion.a 
                    whileHover={{ y: -3, scale: 1.1 }}
                    href={contactConfig.zaloLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-green-50 text-green-500 flex items-center justify-center hover:bg-white hover:shadow-md transition-all border border-green-100"
                    title="Zalo"
                  >
                    <MessageCircle size={14} />
                  </motion.a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
