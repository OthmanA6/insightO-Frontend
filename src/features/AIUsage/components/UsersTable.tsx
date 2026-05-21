import React from 'react';

interface UserUsage {
  userId: string;
  name: string;
  email: string;
  totalTokensUsed: number;
  maxTokens: number;
  percentageUsed: number;
  requestCount: number;
}

export default function UsersTable({ users }: { users: UserUsage[] }) {
  const sortedUsers = [...users].sort((a, b) => b.totalTokensUsed - a.totalTokensUsed);

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900/50">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Instructor
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Tokens Used
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Limit
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Usage %
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Requests
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
          {sortedUsers.map((user) => {
            const isDanger = user.percentageUsed >= 100;
            const isWarning = user.percentageUsed >= 80 && !isDanger;
            
            return (
              <tr key={user.userId} className={`${isDanger ? 'bg-red-50/50 dark:bg-red-900/10' : isWarning ? 'bg-amber-50/50 dark:bg-amber-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'} transition-colors duration-200`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {user.email}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {user.totalTokensUsed.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {user.maxTokens.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`font-bold ${isDanger ? 'text-red-600' : isWarning ? 'text-amber-500' : 'text-emerald-600'}`}>
                    {user.percentageUsed.toFixed(1)}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {user.requestCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    isDanger ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
                    : isWarning ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' 
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                  }`}>
                    {isDanger ? '⛔ Exceeded' : isWarning ? '⚠️ Warning' : '✅ Healthy'}
                  </span>
                </td>
              </tr>
            );
          })}
          {sortedUsers.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                No usage data available yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
