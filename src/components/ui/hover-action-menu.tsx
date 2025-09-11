import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ExternalLink, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HoverActionMenuProps {
  onAIAnalysis: () => void;
  onOpenLink: () => void;
  isAnalyzing?: boolean;
  className?: string;
}

export function HoverActionMenu({ 
  onAIAnalysis, 
  onOpenLink, 
  isAnalyzing = false,
  className 
}: HoverActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAIAnalysis = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAIAnalysis();
    setIsOpen(false);
  };

  const handleOpenLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenLink();
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      {/* Mobile/Touch friendly trigger button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        <MoreHorizontal className="h-3 w-3" />
      </Button>

      {/* Hover menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.1 }}
            className="absolute right-0 top-full mt-1 z-50 min-w-[120px] bg-popover border border-border rounded-lg shadow-lg backdrop-blur-sm"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
          >
            <div className="p-1">
              {/* AI Analysis Button */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs h-8 px-2 hover:bg-purple-500/20 hover:text-purple-300 transition-colors"
                onClick={handleAIAnalysis}
                disabled={isAnalyzing}
              >
                <Brain className={cn(
                  "h-3 w-3 mr-2 transition-all duration-200",
                  isAnalyzing ? "animate-pulse text-purple-400 scale-110" : "text-purple-500 group-hover:scale-110 group-hover:text-purple-400"
                )} />
                <span className="font-medium">
                  {isAnalyzing ? 'AI 분석 중...' : 'AI 분석'}
                </span>
              </Button>
              
              {/* Link Button */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs h-8 px-2 hover:bg-accent"
                onClick={handleOpenLink}
              >
                <ExternalLink className="h-3 w-3 mr-2 text-blue-400" />
                링크
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}