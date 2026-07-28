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
}

export function GlassCard({ children, className = "", hover = true }: GlassCardProps) {
  return (
    <div
      className={`backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-xl transition-all duration-200 ease-out ${hover ? 'hover:-translate-y-1 hover:shadow-2xl' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
