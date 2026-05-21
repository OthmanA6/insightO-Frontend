import React from 'react';

export default function ProgressBar({ percentage }: { percentage: number }) {
  const isDanger = percentage >= 100;
  const isWarning = percentage >= 80 && !isDanger;
  const colorClass = isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-500';

  return (
    <div className="w-full bg-gray-100 rounded-full h-3 dark:bg-gray-700 overflow-hidden shadow-inner">
      <div
        className={`${colorClass} h-3 rounded-full transition-all duration-700 ease-out`}
        style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
      ></div>
    </div>
  );
}
