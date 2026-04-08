import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  label?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ value, onChange, options, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="custom-select-container relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between w-full px-4 py-2.5 
          bg-white/70 backdrop-blur-md border border-slate-200/50 rounded-xl
          text-slate-700 text-sm font-semibold transition-all duration-300
          hover:bg-white hover:border-blue-400/50 hover:shadow-md
          focus:outline-none focus:ring-2 focus:ring-blue-500/20
          ${isOpen ? 'border-blue-500/50 shadow-lg ring-2 ring-blue-500/10' : ''}
        `}
      >
        <span className="truncate">{value || 'Chọn...'}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: 'backOut' }}
          className="text-slate-400 group-hover:text-blue-500"
        >
          <ChevronDown size={18} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="absolute z-[100] w-full overflow-hidden bg-white/90 backdrop-blur-xl border border-white/60 rounded-2xl shadow-2xl p-1.5"
            style={{ originY: 0 }}
          >
            <div className="flex flex-col gap-1">
              {options.map((option) => {
                const isSelected = option === value;
                return (
                  <motion.button
                    key={option}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onChange(option);
                      setIsOpen(false);
                    }}
                    className={`
                      flex items-center justify-between w-full px-3 py-2 rounded-xl text-sm font-medium transition-colors
                      ${isSelected 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
                    `}
                  >
                    <span>{option}</span>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      >
                        <Check size={14} />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomSelect;
