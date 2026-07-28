/**
 * Accessible modal dialog with focus trap
 * @module Modal
 * @author ssrjkk
 */

import { useEffect, useRef, useId } from 'react';
import { Transition } from './Transitions';

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

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (!first) return;

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <Transition
      show={isOpen}
      enter="transition-all duration-200 ease-out"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-all duration-150 ease-in"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div
          ref={contentRef}
          tabIndex={-1}
          className={`bg-slate-800 border border-white/10 rounded-2xl p-6 ${maxWidth} w-full outline-none animate-scaleIn`}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <h3 id={titleId} className="text-lg font-semibold text-white mb-4">
            {title}
          </h3>
          {children}
        </div>
      </div>
    </Transition>
  );
}
