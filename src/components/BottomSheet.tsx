import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'sm:max-w-lg',
}) => {
  // Close on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] transition-opacity"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center pointer-events-none">
            <motion.div
              initial={{ y: '100%', opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: '100%', opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`
                w-full bg-[#141414] border-t sm:border border-white/10 
                rounded-t-2xl sm:rounded-2xl shadow-2xl 
                flex flex-col max-h-[90vh] sm:max-h-[85vh] pointer-events-auto
                ${maxWidth} sm:mx-4
              `}
            >
              {/* Header */}
              <div className="flex items-start justify-between p-5 border-b border-white/5 flex-shrink-0">
                <div className="space-y-1 pr-8">
                  <h2 className="text-lg font-bold text-white leading-tight">
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="text-xs text-slate-400 font-medium">
                      {subtitle}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div 
                  className="p-5 border-t border-white/5 bg-white/[0.02] flex-shrink-0 rounded-b-2xl"
                  style={{ paddingBottom: 'max(5rem, calc(env(safe-area-inset-bottom) + 1.25rem))' }}
                >
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
