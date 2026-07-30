/**
 * Glass-morphism card component
 * @module GlassCard
 * @author ssrjkk
 */

import type { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export function GlassCard({ children, className = "", hover = true, glow = false }: GlassCardProps) {
  return (
    <div
      className={`backdrop-blur-xl bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl shadow-glass transition-all duration-300 ease-out ${
        hover ? 'hover:-translate-y-0.5 hover:shadow-glass-lg' : ''
      } ${glow ? 'shadow-glow' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
