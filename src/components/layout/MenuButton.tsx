import React from 'react';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

export function MenuButton() {
  const { sidebarOpen, toggleSidebar } = useApp();

  return (
    <motion.button
      onClick={toggleSidebar}
      className={cn(
        "flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200",
        "hover:bg-accent/80 focus:outline-none focus:ring-2 focus:ring-primary/20",
        sidebarOpen 
          ? "bg-accent text-accent-foreground" 
          : "bg-background/50 text-muted-foreground hover:text-foreground"
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label="메뉴 토글"
    >
      <motion.div
        animate={{ rotate: sidebarOpen ? 90 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <Menu className="w-5 h-5" />
      </motion.div>
    </motion.button>
  );
}