import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface MainLayoutProps {
  sidebar: ReactNode;
  main: ReactNode;
}

export function MainLayout({ sidebar, main }: MainLayoutProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <motion.aside
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="lg:col-span-3 space-y-4"
      >
        {sidebar}
      </motion.aside>

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="lg:col-span-9 space-y-6"
      >
        {main}
      </motion.main>
    </div>
  );
}
