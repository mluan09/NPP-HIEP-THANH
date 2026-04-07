import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Check, X, ShieldAlert } from 'lucide-react';

interface DialogOptions {
  title?: string;
  message: string;
  type?: 'alert' | 'confirm';
  confirmText?: string;
  cancelText?: string;
}

interface DialogContextType {
  showAlert: (message: string, title?: string) => Promise<void>;
  showConfirm: (message: string, title?: string) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dialog, setDialog] = useState<(DialogOptions & { resolve: (val: boolean) => void }) | null>(null);

  const showAlert = useCallback((message: string, title = 'Thông báo') => {
    return new Promise<void>((resolve) => {
      setDialog({
        type: 'alert',
        title,
        message,
        confirmText: 'Đóng',
        resolve: () => resolve(),
      });
    });
  }, []);

  const showConfirm = useCallback((message: string, title = 'Xác nhận') => {
    return new Promise<boolean>((resolve) => {
      setDialog({
        type: 'confirm',
        title,
        message,
        confirmText: 'Đồng ý',
        cancelText: 'Huỷ bỏ',
        resolve,
      });
    });
  }, []);

  const handleClose = (result: boolean) => {
    if (dialog?.resolve) {
      dialog.resolve(result);
    }
    setDialog(null);
  };

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      
      {createPortal(
        <AnimatePresence>
          {dialog && (
            <div className="dialog-overlay">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => handleClose(false)}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
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
                
                <div className="dialog-icon-wrap" style={{ 
                  background: dialog.type === 'confirm' ? '#fef3c7' : '#dbeafe',
                  color: dialog.type === 'confirm' ? '#f59e0b' : '#3b82f6'
                }}>
                  {dialog.type === 'confirm' ? <ShieldAlert size={32} /> : <AlertCircle size={32} />}
                </div>
                
                <h3 className="dialog-title">{dialog.title}</h3>
                <p className="dialog-message">{dialog.message}</p>
                
                <div className="dialog-actions">
                  {dialog.type === 'confirm' && (
                    <button onClick={() => handleClose(false)} className="dialog-btn dialog-btn-cancel">
                      <X size={18} /> {dialog.cancelText}
                    </button>
                  )}
                  <button onClick={() => handleClose(true)} className="dialog-btn dialog-btn-confirm">
                    <Check size={18} /> {dialog.confirmText}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </DialogContext.Provider>
  );
};

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) throw new Error('useDialog must be used within DialogProvider');
  return context;
};
