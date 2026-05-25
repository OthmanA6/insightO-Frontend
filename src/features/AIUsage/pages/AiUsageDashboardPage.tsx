import React, { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import api from '@/shared/api/axiosInstance';
import { toast } from 'sonner';
import UsageCard from '@/features/AIUsage/components/UsageCard';
import UsageChart from '@/features/AIUsage/components/UsageChart';
import UsersTable from '@/features/AIUsage/components/UsersTable';
import { motion } from 'framer-motion';
import { Bot, Activity, Users } from 'lucide-react';

interface UsageData {
  totalTokensUsed: number;
  remainingTokens: number;
  maxTokens: number;
  percentageUsed: number;
  requestCount: number;
}

interface UserUsage {
  userId: string;
  name: string;
  email: string;
  totalTokensUsed: number;
  maxTokens: number;
  percentageUsed: number;
  requestCount: number;
}

export default function AiUsageDashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [myUsage, setMyUsage] = useState<UsageData | null>(null);
  const [usersUsage, setUsersUsage] = useState<UserUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        setLoading(true);
        setError(false);

        const res = await api.get('/ai-usage/me');
        setMyUsage(res.data.data);

        if (res.data.data.percentageUsed >= 100) {
          toast.error('⛔ AI token limit exceeded! AI features are blocked.');
        } else if (res.data.data.percentageUsed >= 80) {
          toast.warning('⚠️ Warning: You have used 80%+ of your AI token quota.');
        }

        if (isAdmin) {
          const resUsers = await api.get('/ai-usage/users');
          setUsersUsage(resUsers.data.data);
        }
      } catch (err) {
        setError(true);
        toast.error('Failed to load AI usage data.');
      } finally {
        setLoading(false);
      }
    };
    fetchUsage();
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <motion.div 
          animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
            <Bot className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-pulse" />
          </div>
          <p className="text-sm font-bold text-indigo-600/80 dark:text-indigo-400/80 tracking-widest uppercase">Loading AI Data</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center bg-red-50 dark:bg-red-900/10 p-8 rounded-3xl border border-red-100 dark:border-red-900/30">
          <p className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Connection Error</p>
          <p className="text-sm text-red-500/80 dark:text-red-400/80">Unable to retrieve AI usage data. Please try refreshing.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative"
      >
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-400/20 blur-3xl rounded-full pointer-events-none" />
        <h1 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 mb-4 tracking-tight">
          AI Usage Command Center
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl font-medium leading-relaxed">
          Monitor your AI token consumption across the platform. Real-time metrics and dynamic quota tracking.
        </p>
      </motion.div>

      {myUsage && (
        <div className="w-full">
          <UsageCard usage={myUsage} />
        </div>
      )}

      {isAdmin && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-10"
        >
          {usersUsage.length > 0 ? (
            <>
              <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20 dark:border-white/10 relative overflow-hidden">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl shadow-lg shadow-emerald-500/20 text-white">
                    <Activity className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Organization Overview</h2>
                </div>
                <UsageChart data={usersUsage} />
              </div>
              
              <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20 dark:border-white/10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/20 text-white">
                    <Users className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Instructor Analytics</h2>
                </div>
                <UsersTable users={usersUsage} />
              </div>
            </>
          ) : (
            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl p-12 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 text-center flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                <Users className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Data Available</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm">There are currently no instructors in the system to display usage for.</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
