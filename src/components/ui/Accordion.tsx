import { useState, useId } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { HEIGHT, SPRING } from '../../lib/animations';

interface AccordionProps {
  icon: string;
  title: string;
  subtitle?: string;
  badge?: string | number;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function Accordion({
  icon,
  title,
  subtitle,
  badge,
  children,
  defaultOpen = false,
}: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = useId();
  const reduced = useReducedMotion();

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg" aria-hidden="true">{icon}</span>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-200">{title}</p>
            {subtitle && (
              <p className="text-xs text-gray-500">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {badge !== undefined && (
            <span className="text-xs text-gray-400">{badge}</span>
          )}
          <motion.span
            animate={reduced ? {} : { rotate: isOpen ? 180 : 0 }}
            transition={SPRING.gentle}
            className="text-gray-400"
            aria-hidden="true"
          >
            ▼
          </motion.span>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={contentId}
            role="region"
            initial={reduced ? undefined : HEIGHT.initial}
            animate={reduced ? {} : HEIGHT.animate}
            exit={reduced ? {} : HEIGHT.exit}
            transition={SPRING.gentle}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
