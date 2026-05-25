import React from 'react';
import { motion } from 'framer-motion';

export default function ProgressBar({ percentage }: { percentage: number }) {
  const isDanger = percentage >= 100;
  const isWarning = percentage >= 80 && !isDanger;
  
  const gradientClass = isDanger 
    ? 'from-red-500 to-rose-600' 
    : isWarning 
      ? 'from-amber-400 to-orange-500' 
      : 'from-emerald-400 to-teal-500';

  const shadowClass = isDanger 
    ? 'shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
    : isWarning 
      ? 'shadow-[0_0_15px_rgba(245,158,11,0.5)]' 
      : 'shadow-[0_0_15px_rgba(16,185,129,0.5)]';

  const width = Math.min(100, Math.max(0, percentage));

  return (
    <div className="w-full bg-gray-100/50 dark:bg-gray-800/50 rounded-full h-4 overflow-hidden backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 relative">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${width}%` }}
        transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
        className={`h-full rounded-full bg-gradient-to-r ${gradientClass} ${shadowClass} relative`}
      >
        <div className="absolute top-0 right-0 bottom-0 left-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-[shimmer_2s_linear_infinite]" />
      </motion.div>
    </div>
  );
}
