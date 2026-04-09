import React, { useState } from 'react';
import { Mail, MessageCircle, Bug } from 'lucide-react';
import { contactConfig } from '../config/contact';
import { motion, AnimatePresence } from 'framer-motion';

const Footer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleEmailClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const email = contactConfig.email;
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

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-row-reverse items-end gap-3 pointer-events-none">
      {/* Main FAB Trigger */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors border border-white/20 backdrop-blur-md pointer-events-auto ${
          isOpen ? 'bg-slate-800 text-white shadow-slate-500/50' : 'bg-white/80 text-blue-600 shadow-blue-500/30'
        }`}
      >
        <Bug size={22} className={isOpen ? 'animate-pulse' : ''} />
      </motion.button>

      {/* Expanded Actions */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="flex items-center gap-3 glass px-3 py-2 rounded-full border border-white/40 shadow-xl pointer-events-auto"
            style={{
              background: 'rgba(255, 255, 255, 0.65)',
            }}
          >
            {/* Email */}
            <FooterIcon 
              href={`mailto:${contactConfig.email}`}
              onClick={handleEmailClick}
              icon={<Mail size={18} />}
              label="Email"
              color="bg-red-500"
            />

            {/* Facebook */}
            <FooterIcon 
              href={contactConfig.facebook}
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>}
              label="Facebook"
              color="bg-blue-600"
            />

            {/* Zalo */}
            <FooterIcon 
              href={contactConfig.zaloLink}
              icon={<MessageCircle size={18} />}
              label="Zalo"
              color="bg-blue-500"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface FooterIconProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

const FooterIcon: React.FC<FooterIconProps> = ({ href, icon, label, color, onClick }) => (
  <motion.a 
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    whileHover={{ y: -3, scale: 1.15 }}
    whileTap={{ scale: 0.9 }}
    href={href}
    onClick={onClick}
    target="_blank"
    rel="noopener noreferrer"
    className={`w-9 h-9 rounded-full ${color} text-white flex items-center justify-center shadow hover:shadow-lg transition-all border border-white/20`}
    title={label}
  >
    {icon}
  </motion.a>
);

export default Footer;
