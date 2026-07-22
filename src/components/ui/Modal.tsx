import { useEffect, useRef, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { SCALE, SPRING } from '../../lib/animations';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const reduced = useReducedMotion();

  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement as HTMLElement;
      const timer = setTimeout(() => {
        contentRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      previousFocus.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = contentRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;

        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const backdropVariants = reduced
    ? { initial: {}, animate: {}, exit: {} }
    : { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };

  const contentVariants = reduced
    ? { initial: {}, animate: {}, exit: {} }
    : SCALE;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={backdropVariants.initial}
          animate={backdropVariants.animate}
          exit={backdropVariants.exit}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <motion.div
            ref={contentRef}
            initial={contentVariants.initial}
            animate={contentVariants.animate}
            exit={contentVariants.exit}
            transition={SPRING.gentle}
            tabIndex={-1}
            className={`bg-slate-800 border border-white/10 rounded-2xl p-6 ${maxWidth} w-full outline-none`}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <h3 id={titleId} className="text-lg font-semibold text-white mb-4">
              {title}
            </h3>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
