import React from 'react';
import { motion } from 'framer-motion';
import { useApp, ProgramType, getProgramTitle } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

const programs: Array<{ id: ProgramType; title: string; description: string }> = [
  {
    id: 'metawatch',
    title: 'MetaWatch',
    description: '보안관제센터'
  },
  {
    id: 'metashield',
    title: 'MetaShield',
    description: 'AI 보안분석'
  }
];

export function TopTabs() {
  const { currentProgram, setCurrentProgram } = useApp();

  return (
    <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg">
      {programs.map((program) => (
        <motion.button
          key={program.id}
          onClick={() => setCurrentProgram(program.id)}
          className={cn(
            "relative px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
            "hover:bg-background/80",
            currentProgram === program.id
              ? "text-foreground bg-background shadow-sm"
              : "text-muted-foreground"
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex flex-col items-center gap-0.5">
            <span className="font-semibold">{program.title}</span>
            <span className="text-xs opacity-75">{program.description}</span>
          </div>
          
          {currentProgram === program.id && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-primary/5 rounded-md border border-primary/20"
              initial={false}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </motion.button>
      ))}
    </div>
  );
}