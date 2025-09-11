import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Shield } from 'lucide-react';
import { useApp, ProgramType, getProgramTitle } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

const programs: Array<{ 
  id: ProgramType; 
  title: string; 
  description: string; 
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = [
  {
    id: 'metawatch',
    title: 'MetaWatch',
    description: '보안관제센터',
    icon: Eye,
    color: 'text-blue-500'
  },
  {
    id: 'metashield',
    title: 'MetaShield',
    description: 'AI 보안분석',
    icon: Shield,
    color: 'text-purple-500'
  }
];

export function TopTabs() {
  const { currentProgram, setCurrentProgram } = useApp();

  return (
    <div className="flex items-center gap-3 bg-gradient-to-r from-slate-800/50 to-slate-900/50 p-3 rounded-xl backdrop-blur-sm border border-slate-700/50">
      {programs.map((program) => {
        const IconComponent = program.icon;
        const isActive = currentProgram === program.id;
        
        return (
          <motion.button
            key={program.id}
            onClick={() => setCurrentProgram(program.id)}
            className={cn(
              "relative px-8 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 min-w-[180px]",
              "hover:shadow-xl hover:scale-[1.02] transform-gpu",
              isActive
                ? program.id === 'metawatch' 
                  ? "text-white bg-gradient-to-r from-blue-600/90 to-cyan-500/90 shadow-lg shadow-blue-500/25 border border-blue-400/30"
                  : "text-white bg-gradient-to-r from-purple-600/90 to-pink-500/90 shadow-lg shadow-purple-500/25 border border-purple-400/30"
                : "text-slate-300 hover:text-white bg-gradient-to-r from-slate-700/50 to-slate-600/50 hover:from-slate-600/70 hover:to-slate-500/70 border border-slate-600/30 hover:border-slate-500/50"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-4 relative z-10">
              <div className="relative">
                <IconComponent 
                  className={cn(
                    "h-6 w-6 transition-all duration-300",
                    isActive 
                      ? "text-white drop-shadow-sm scale-110" 
                      : "text-slate-400 group-hover:text-slate-200"
                  )} 
                />
                {isActive && (
                  <div className={cn(
                    "absolute inset-0 rounded-full blur-md",
                    program.id === 'metawatch' ? "bg-blue-400/30" : "bg-purple-400/30"
                  )} />
                )}
              </div>
              <div className="flex flex-col items-start">
                <span className={cn(
                  "font-bold text-base transition-colors duration-300",
                  isActive ? "text-white drop-shadow-sm" : "text-slate-200"
                )}>
                  {program.title}
                </span>
                <span className={cn(
                  "text-xs transition-colors duration-300",
                  isActive ? "text-white/90" : "text-slate-400"
                )}>
                  {program.description}
                </span>
              </div>
            </div>
            
            {isActive && (
              <>
                {/* 배경 글로우 - 더 멀리 떨어뜨려서 텍스트에 영향 안주게 */}
                <motion.div
                  layoutId="activeTab"
                  className={cn(
                    "absolute -inset-2 rounded-xl blur-xl opacity-20 -z-10",
                    program.id === 'metawatch' 
                      ? "bg-gradient-to-r from-blue-500 to-cyan-400" 
                      : "bg-gradient-to-r from-purple-500 to-pink-400"
                  )}
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
                {/* 텍스트 보호용 배경 */}
                <motion.div
                  className="absolute inset-0 rounded-xl bg-black/10 backdrop-blur-sm z-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              </>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}