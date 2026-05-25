import React from 'react';
import ProgressBar from '@/features/AIUsage/components/ProgressBar';
import { motion } from 'framer-motion';
import { Sparkles, BrainCircuit, AlertTriangle, XCircle, Database } from 'lucide-react';

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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20 dark:border-white/10 p-8 group"
    >
      {/* Dynamic Background Glow */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/20 dark:bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/30 transition-colors duration-700 pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 dark:bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/30 transition-colors duration-700 pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/20 text-white">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
            Your Personal AI Quota
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <motion.div whileHover={{ scale: 1.02 }} className="bg-gradient-to-br from-white/50 to-white/10 dark:from-gray-800/50 dark:to-gray-800/10 p-6 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-md shadow-sm relative overflow-hidden">
            <BrainCircuit className="absolute -right-4 -bottom-4 w-24 h-24 text-indigo-500/5 dark:text-indigo-400/5" />
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 tracking-wider mb-2 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" /> TOKENS USED
            </p>
            <p className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {usage.totalTokensUsed.toLocaleString()}
            </p>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.02 }} className="bg-gradient-to-br from-white/50 to-white/10 dark:from-gray-800/50 dark:to-gray-800/10 p-6 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-md shadow-sm relative overflow-hidden">
             <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-emerald-500/5 dark:bg-emerald-400/5" />
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 tracking-wider mb-2">REMAINING</p>
            <p className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {usage.remainingTokens.toLocaleString()}
            </p>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.02 }} className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 backdrop-blur-md shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            </div>
            <p className="text-sm font-semibold text-indigo-600/80 dark:text-indigo-400/80 tracking-wider mb-2">TOTAL LIMIT</p>
            <p className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight">
              {usage.maxTokens.toLocaleString()}
            </p>
          </motion.div>
        </div>

        <div className="space-y-4 bg-white/40 dark:bg-gray-800/40 p-6 rounded-2xl border border-gray-100/50 dark:border-gray-700/50 backdrop-blur-sm">
          <div className="flex justify-between items-end">
            <div>
              <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Usage Progress
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {usage.requestCount} Total AI Requests
              </span>
            </div>
            <div className="text-right">
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key={usage.percentageUsed}
                className={`text-2xl font-black ${isLimitExceeded ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-emerald-500'}`}
              >
                {usage.percentageUsed.toFixed(1)}%
              </motion.span>
            </div>
          </div>
          <ProgressBar percentage={usage.percentageUsed} />
        </div>

        {isWarning && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 text-amber-800 dark:from-amber-900/20 dark:to-orange-900/20 dark:border-amber-700/50 dark:text-amber-300 flex items-center gap-4 shadow-sm backdrop-blur-md">
            <div className="p-2 bg-amber-100 dark:bg-amber-800/50 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-sm font-medium leading-relaxed">
              <strong>Action Required:</strong> You have consumed {usage.percentageUsed.toFixed(1)}% of your AI token quota. Please optimize your queries.
            </span>
          </motion.div>
        )}

        {isLimitExceeded && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/50 text-red-800 dark:from-red-900/20 dark:to-rose-900/20 dark:border-red-700/50 dark:text-red-300 flex items-center gap-4 shadow-sm backdrop-blur-md">
            <div className="p-2 bg-red-100 dark:bg-red-800/50 rounded-xl">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-sm font-medium leading-relaxed">
              <strong>Limit Exceeded:</strong> Your AI quota of {usage.maxTokens.toLocaleString()} tokens has been fully depleted. AI features are temporarily blocked.
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
