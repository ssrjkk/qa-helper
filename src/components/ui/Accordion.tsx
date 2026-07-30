/**
 * Collapsible accordion component
 * @module Accordion
 * @author ssrjkk
 */

import { useState, useId } from 'react';
import type { ReactNode } from 'react';
import { Collapse } from './Transitions';

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

  return (
    <div className="space-y-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls={contentId}
          className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg" aria-hidden="true">{icon}</span>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{title}</p>
              {subtitle && (
                <p className="text-xs text-gray-500 dark:text-gray-500">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {badge !== undefined && (
              <span className="text-xs text-gray-500 dark:text-gray-400">{badge}</span>
            )}
            <span
              className={`text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            >
              ▼
            </span>
          </div>
        </button>

      <Collapse show={isOpen}>
        <div id={contentId} role="region">
          {children}
        </div>
      </Collapse>
    </div>
  );
}
