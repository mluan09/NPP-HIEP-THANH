import React, { useState } from 'react';
import { Mail, MessageCircle, Bug } from 'lucide-react';
import { contactConfig } from '../config/contact';
import { motion, AnimatePresence } from 'framer-motion';

const Footer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <footer className="footer-section mt-auto pb-10 pt-4 px-6">
      <div className="max-w-7xl mx-auto flex justify-start">
        <motion.div 
          layout
          className="pill-container glass shadow-2xl border border-white/60 rounded-2xl flex items-center overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.4)',
            boxShadow: '0 10px 40px -10px rgba(31, 38, 135, 0.15), inset 0 0 20px rgba(255, 255, 255, 0.2)'
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          {/* Main Button / Title */}
          <motion.button
            layout
            whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.6)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-3 px-5 py-3 outline-none border-none select-none cursor-pointer group"
          >
            <div className={`
              w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300
              ${isOpen 
                ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/30 rotate-12' 
                : 'bg-white/80 text-blue-600 shadow-sm group-hover:shadow-blue-200/50 group-hover:-rotate-3'}
            `}>
              <Bug size={18} className={isOpen ? 'animate-pulse' : ''} />
            </div>
            
            <div className="flex flex-col items-start leading-tight">
              <span className="text-[10px] font-bold text-blue-600/70 tracking-widest uppercase">Developer Support</span>
              <span className="text-[14px] font-black tracking-tight text-slate-800 uppercase bg-clip-text">
                Báo Lỗi Hệ Thống
              </span>
            </div>
          </motion.button>

          {/* Expanded Content */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="flex items-center gap-2 pr-5"
              >
                <div className="h-8 w-[1.5px] bg-gradient-to-b from-transparent via-slate-300 to-transparent mx-2 opacity-50" />
                
                <div className="flex items-center gap-3">
                  {/* Email */}
                  <FooterIcon 
                    href={`mailto:${contactConfig.email}`}
                    icon={<Mail size={16} />}
                    label="Email"
                    color="bg-blue-500"
                  />

                  {/* Facebook */}
                  <FooterIcon 
                    href={contactConfig.facebook}
                    icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>}
                    label="Facebook"
                    color="bg-blue-600"
                  />

                  {/* Zalo */}
                  <FooterIcon 
                    href={contactConfig.zaloLink}
                    icon={<MessageCircle size={16} />}
                    label="Zalo"
                    color="bg-green-500"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </footer>
  );
};

interface FooterIconProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  color: string;
}

const FooterIcon: React.FC<FooterIconProps> = ({ href, icon, label, color }) => (
  <motion.a 
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    whileHover={{ y: -4, scale: 1.15 }}
    whileTap={{ scale: 0.9 }}
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={`w-10 h-10 rounded-xl ${color} text-white flex items-center justify-center shadow-md hover:shadow-lg transition-all border border-white/20`}
    title={label}
  >
    {icon}
  </motion.a>
);

export default Footer;
