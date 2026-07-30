/**
 * CSS-only animation components replacing framer-motion
 * @module Transitions
 * @author ssrjkk
 */

import { useState, useEffect, useRef, type ReactNode, type CSSProperties } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

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

const DEFAULT_ENTER = 'transition-all duration-250 ease-out';
const DEFAULT_ENTER_FROM = 'opacity-0';
const DEFAULT_ENTER_TO = 'opacity-100';
const DEFAULT_LEAVE = 'transition-all duration-150 ease-in';
const DEFAULT_LEAVE_FROM = 'opacity-100';
const DEFAULT_LEAVE_TO = 'opacity-0';

export function Transition({
  show = true,
  children,
  className = '',
  style,
  enter = DEFAULT_ENTER,
  enterFrom = DEFAULT_ENTER_FROM,
  enterTo = DEFAULT_ENTER_TO,
  leave = DEFAULT_LEAVE,
  leaveFrom = DEFAULT_LEAVE_FROM,
  leaveTo = DEFAULT_LEAVE_TO,
  leaveDuration = 150,
  unmount = true,
}: TransitionProps) {
  const [shouldRender, setShouldRender] = useState(show);
  const [classes, setClasses] = useState(show ? `${enter} ${enterFrom}` : '');
  const mountedRef = useRef(true);
  const showRef = useRef(show);
  showRef.current = show;

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const rafIds: number[] = [];
    if (show) {
      setShouldRender(true);
      rafIds.push(requestAnimationFrame(() => {
        rafIds.push(requestAnimationFrame(() => {
          if (mountedRef.current) setClasses(`${enter} ${enterTo}`);
        }));
      }));
    } else {
      setClasses(`${leave} ${leaveFrom}`);
      rafIds.push(requestAnimationFrame(() => {
        rafIds.push(requestAnimationFrame(() => {
          if (mountedRef.current) setClasses(`${leave} ${leaveTo}`);
        }));
      }));
      const timer = setTimeout(() => {
        if (mountedRef.current) setShouldRender(false);
      }, leaveDuration);
      return () => {
        clearTimeout(timer);
        rafIds.forEach(id => cancelAnimationFrame(id));
      };
    }
    return () => rafIds.forEach(id => cancelAnimationFrame(id));
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
  const reducedMotion = useReducedMotion();
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(show ? undefined : 0);
  const [overflow, setOverflow] = useState<CSSProperties['overflow']>(show ? undefined : 'hidden');

  useEffect(() => {
    if (!contentRef.current) return;
    if (reducedMotion) {
      setHeight(undefined);
      setOverflow(undefined);
      return;
    }
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
  }, [show, duration, reducedMotion]);

  const transitionStyle = reducedMotion
    ? undefined
    : `height ${duration}ms ease-out`;

  return (
    <div
      ref={contentRef}
      className={className}
      style={{
        height: height !== undefined ? `${height}px` : 'auto',
        overflow,
        transition: transitionStyle,
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
  const reducedMotion = useReducedMotion();
  return (
    <div
      className={reducedMotion ? className : `animate-fadeIn ${className}`}
      style={reducedMotion ? style : {
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
  const reducedMotion = useReducedMotion();
  return (
    <div
      className={reducedMotion ? className : `animate-slideUp ${className}`}
      style={reducedMotion ? undefined : { animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      {children}
    </div>
  );
}
