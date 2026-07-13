import { useState } from 'react';
import { motion } from 'framer-motion';
import type { ReactNode, MouseEvent } from 'react';

interface RippleButtonProps {
  children: ReactNode;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export function RippleButton({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  className = "",
  type = "button"
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  
  const handleClick = (e: React.MouseEvent<Element>) => {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRipples([...ripples, { x, y, id: Date.now() }]);
    setTimeout(() => setRipples(prev => prev.slice(1)), 600);
    onClick?.(e as React.MouseEvent<HTMLButtonElement>);
  };

  const variants = {
    primary: "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-indigo-500/25",
    secondary: "bg-white/10 border border-white/20 text-white hover:bg-white/20",
    danger: "bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30",
  };

  return (
    <motion.button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`relative overflow-hidden rounded-xl px-6 py-3 font-semibold transition-shadow disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full -translate-x-1/2 -translate-y-1/2"
          style={{ left: ripple.x, top: ripple.y, width: 0, height: 0 }}
          animate={{ width: 300, height: 300, opacity: [0.5, 0] }}
          transition={{ duration: 0.6 }}
        />
      ))}
      {children}
    </motion.button>
  );
}
