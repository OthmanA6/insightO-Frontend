import React from 'react';
import ProgressBar from '@/features/AIUsage/components/ProgressBar';

interface UsageCardProps {
  usage: {
    totalTokensUsed: number;
    remainingTokens: number;
    maxTokens: number;
    percentageUsed: number;
    requestCount: number;
  };
}

export default function UsageCard({ usage }: UsageCardProps) {
  const isLimitExceeded = usage.percentageUsed >= 100;
  const isWarning = usage.percentageUsed >= 80 && !isLimitExceeded;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 dark:bg-gray-800 dark:border-gray-700 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/10 dark:to-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative z-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Your Personal Quota</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-xl border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Tokens Used</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {usage.totalTokensUsed.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-xl border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Remaining</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {usage.remainingTokens.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-xl border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Token Limit</p>
            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">
              {usage.maxTokens.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm font-medium">
            <span className="text-gray-700 dark:text-gray-300">
              Usage Progress ({usage.requestCount} requests)
            </span>
            <span className={`text-lg ${isLimitExceeded ? 'text-red-600 font-bold' : isWarning ? 'text-amber-500 font-bold' : 'text-emerald-600 font-bold'}`}>
              {usage.percentageUsed.toFixed(1)}%
            </span>
          </div>
          <ProgressBar percentage={usage.percentageUsed} />
          <p className="text-xs text-gray-400 text-right">
            {usage.totalTokensUsed.toLocaleString()} / {usage.maxTokens.toLocaleString()} tokens
          </p>
        </div>

        {isWarning && (
          <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300 flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">⚠️ Warning: You have used {usage.percentageUsed.toFixed(1)}% of your AI token quota. Consider reducing usage.</span>
          </div>
        )}

        {isLimitExceeded && (
          <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-bold">⛔ Limit Exceeded: Your AI quota ({usage.maxTokens.toLocaleString()} tokens) has been depleted. AI features are blocked.</span>
          </div>
        )}
      </div>
    </div>
  );
}
