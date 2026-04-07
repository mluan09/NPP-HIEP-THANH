import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';
import { useNotification, NotificationType } from '../context/NotificationContext';

const icons: Record<NotificationType, React.ReactNode> = {
  success: <CheckCircle size={20} color="#10b981" />,
  error: <XCircle size={20} color="#f43f5e" />,
  info: <Info size={20} color="#3b82f6" />,
  warning: <AlertTriangle size={20} color="#f59e0b" />,
};

const NiceNotification: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  return createPortal(
    <div className="toast-container">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            layout
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="toast-item"
            style={{ 
              borderLeftColor: n.type === 'success' ? '#10b981' : n.type === 'error' ? '#f43f5e' : n.type === 'warning' ? '#f59e0b' : '#3b82f6' 
            }}
            onClick={() => removeNotification(n.id)}
          >
            <div style={{ flexShrink: 0, display: 'flex' }}>{icons[n.type]}</div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>{n.message}</p>
            </div>
            <button 
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', opacity: 0.5, display: 'flex' }}
              onClick={(e) => { e.stopPropagation(); removeNotification(n.id); }}
            >
              <XCircle size={16} color="#64748b" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
};

export default NiceNotification;
