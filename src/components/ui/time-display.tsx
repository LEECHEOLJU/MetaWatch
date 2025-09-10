"use client";

import { useState, useEffect } from 'react';
import { formatTimeAgo } from '@/lib/utils';

interface TimeDisplayProps {
  date: string | Date;
  className?: string;
}

export function TimeDisplay({ date, className }: TimeDisplayProps) {
  const [timeAgo, setTimeAgo] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      setTimeAgo(formatTimeAgo(date));
    };
    
    updateTime(); // Initial update
    const interval = setInterval(updateTime, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [date]);

  // Prevent hydration mismatch by not rendering on server
  if (!mounted) {
    return <span className={className}>--</span>;
  }

  return <span className={className}>{timeAgo}</span>;
}