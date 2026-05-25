import React from 'react';
import { motion } from 'framer-motion';
import { User, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface UserUsage {
  userId: string;
  name: string;
  email: string;
  totalTokensUsed: number;
  maxTokens: number;
  percentageUsed: number;
  requestCount: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
};

export default function UsersTable({ users }: { users: UserUsage[] }) {
  const sortedUsers = [...users].sort((a, b) => b.totalTokensUsed - a.totalTokensUsed);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm backdrop-blur-xl bg-white/50 dark:bg-gray-900/50">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200/50 dark:divide-gray-700/50">
          <thead className="bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-md">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                Instructor
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                Tokens Used
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                Limit
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                Usage %
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                Requests
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                Status
              </th>
            </tr>
          </thead>
          <motion.tbody 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="divide-y divide-gray-200/50 dark:divide-gray-700/50"
          >
            {sortedUsers.map((user) => {
              const isDanger = user.percentageUsed >= 100;
              const isWarning = user.percentageUsed >= 80 && !isDanger;
              
              const rowClass = isDanger 
                ? 'bg-red-50/30 hover:bg-red-50/50 dark:bg-red-900/5 dark:hover:bg-red-900/10' 
                : isWarning 
                  ? 'bg-amber-50/30 hover:bg-amber-50/50 dark:bg-amber-900/5 dark:hover:bg-amber-900/10' 
                  : 'hover:bg-gray-50/50 dark:hover:bg-gray-800/50';

              return (
                <motion.tr variants={itemVariants} key={user.userId} className={`${rowClass} transition-colors duration-300`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 flex items-center justify-center border border-indigo-200/50 dark:border-indigo-800/50">
                          <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {user.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                      {user.totalTokensUsed.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-medium">
                    {user.maxTokens.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-black ${isDanger ? 'text-red-600 dark:text-red-400' : isWarning ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-500 dark:text-emerald-400'}`}>
                        {user.percentageUsed.toFixed(1)}%
                      </span>
                      <div className="w-16 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                          style={{ width: `${Math.min(100, Math.max(0, user.percentageUsed))}%` }} 
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-medium">
                    {user.requestCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1.5 inline-flex text-xs leading-5 font-bold rounded-xl items-center gap-1.5 ${
                      isDanger 
                        ? 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' 
                        : isWarning 
                          ? 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' 
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                    }`}>
                      {isDanger ? <ShieldAlert className="w-3.5 h-3.5" /> : isWarning ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      {isDanger ? 'Exceeded' : isWarning ? 'Warning' : 'Healthy'}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
            {sortedUsers.length === 0 && (
              <motion.tr variants={itemVariants}>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center justify-center">
                    <User className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-lg font-medium">No instructors found</p>
                  </div>
                </td>
              </motion.tr>
            )}
          </motion.tbody>
        </table>
      </div>
    </div>
  );
}
