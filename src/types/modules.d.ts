declare module 'framer-motion' {
  import { ComponentType, ReactNode } from 'react';

  export interface MotionProps {
    initial?: Record<string, unknown>;
    animate?: Record<string, unknown>;
    exit?: Record<string, unknown>;
    whileHover?: Record<string, unknown>;
    whileTap?: Record<string, unknown>;
    transition?: Record<string, unknown>;
    className?: string;
    style?: React.CSSProperties;
    onClick?: (e: React.MouseEvent<Element>) => void;
    children?: ReactNode;
    layout?: boolean;
    type?: string;
    disabled?: boolean;
    [key: string]: unknown;
  }

  export const motion: {
    div: ComponentType<MotionProps>;
    button: ComponentType<MotionProps>;
    span: ComponentType<MotionProps>;
    p: ComponentType<MotionProps>;
    h1: ComponentType<MotionProps>;
    h2: ComponentType<MotionProps>;
    h3: ComponentType<MotionProps>;
    li: ComponentType<MotionProps>;
    ul: ComponentType<MotionProps>;
    nav: ComponentType<MotionProps>;
    a: ComponentType<MotionProps>;
    img: ComponentType<MotionProps>;
    [key: string]: ComponentType<MotionProps>;
  };

  export const AnimatePresence: ComponentType<{
    children?: ReactNode;
    mode?: string;
  }>;
}

declare module 'jspdf' {
  export default class jsPDF {
    constructor(options?: { orientation?: string; unit?: string; format?: string });
    text(text: string, x: number, y: number, options?: Record<string, unknown>): void;
    setFontSize(size: number): void;
    setFont(fontName: string, fontStyle?: string): void;
    setTextColor(r: number, g?: number, b?: number): void;
    setDrawColor(r: number, g?: number, b?: number): void;
    line(x1: number, y1: number, x2: number, y2: number): void;
    addPage(): void;
    splitTextToSize(text: string, maxWidth: number): string[];
    output(type: string): Blob;
    save(filename: string): void;
    internal: {
      pageSize: {
        getWidth(): number;
        getHeight(): number;
      };
    };
  }
}
