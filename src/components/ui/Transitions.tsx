/**
 * CSS-only animation components replacing framer-motion
 * @module Transitions
 * @author ssrjkk
 */

import { useState, useEffect, useRef, type ReactNode, type CSSProperties } from 'react';

interface TransitionProps {
  show?: boolean;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  enter?: string;
  enterFrom?: string;
  enterTo?: string;
  leave?: string;
  leaveFrom?: string;
  leaveTo?: string;
  leaveDuration?: number;
  unmount?: boolean;
}

export function Transition({
  show = true,
  children,
  className = '',
  style,
  enter = 'transition-all duration-250 ease-out',
  enterFrom = 'opacity-0',
  enterTo = 'opacity-100',
  leave = 'transition-all duration-150 ease-in',
  leaveFrom = 'opacity-100',
  leaveTo = 'opacity-0',
  leaveDuration = 150,
  unmount = true,
}: TransitionProps) {
  const [shouldRender, setShouldRender] = useState(show);
  const [classes, setClasses] = useState(show ? `${enter} ${enterFrom}` : '');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (mountedRef.current) setClasses(`${enter} ${enterTo}`);
        });
      });
    } else {
      setClasses(`${leave} ${leaveFrom}`);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (mountedRef.current) setClasses(`${leave} ${leaveTo}`);
        });
      });
      const timer = setTimeout(() => setShouldRender(false), leaveDuration);
      return () => clearTimeout(timer);
    }
  }, [show, enter, enterFrom, enterTo, leave, leaveFrom, leaveTo, leaveDuration]);

  if (unmount && !shouldRender) return null;

  return (
    <div className={`${classes} ${className}`} style={style}>
      {children}
    </div>
  );
}

interface CollapseProps {
  show: boolean;
  children: ReactNode;
  className?: string;
  duration?: number;
}

export function Collapse({ show, children, className = '', duration = 250 }: CollapseProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(show ? undefined : 0);
  const [overflow, setOverflow] = useState<CSSProperties['overflow']>(show ? undefined : 'hidden');

  useEffect(() => {
    if (!contentRef.current) return;
    if (show) {
      const el = contentRef.current;
      setOverflow('hidden');
      setHeight(el.scrollHeight);
      const timer = setTimeout(() => {
        setHeight(undefined);
        setOverflow(undefined);
      }, duration);
      return () => clearTimeout(timer);
    } else {
      const el = contentRef.current;
      setHeight(el.scrollHeight);
      requestAnimationFrame(() => {
        setHeight(0);
      });
    }
  }, [show, duration]);

  return (
    <div
      ref={contentRef}
      className={className}
      style={{
        height: height !== undefined ? `${height}px` : 'auto',
        overflow,
        transition: `height ${duration}ms ease-out`,
      }}
    >
      {children}
    </div>
  );
}

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  style?: CSSProperties;
}

export function FadeIn({ children, className = '', delay = 0, duration = 250, style }: FadeInProps) {
  return (
    <div
      className={`animate-fadeIn ${className}`}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`,
        animationFillMode: 'both',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

interface SlideUpProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function SlideUp({ children, className = '', delay = 0 }: SlideUpProps) {
  return (
    <div
      className={`animate-slideUp ${className}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      {children}
    </div>
  );
}
