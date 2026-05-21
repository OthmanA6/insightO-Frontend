import React, { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import api from '@/shared/api/axiosInstance';
import { toast } from 'sonner';
import UsageCard from '@/features/AIUsage/components/UsageCard';
import UsageChart from '@/features/AIUsage/components/UsageChart';
import UsersTable from '@/features/AIUsage/components/UsersTable';

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
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
          <p className="text-sm font-medium text-gray-500">Loading AI Usage Data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-red-500">Failed to load data</p>
          <p className="text-sm text-gray-400 mt-1">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Token Usage Dashboard</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Monitor your AI token consumption across all features. Your limit is{' '}
          <span className="font-bold text-indigo-600">{myUsage?.maxTokens?.toLocaleString() ?? '90,000'}</span> tokens.
        </p>
      </div>

      {myUsage && <UsageCard usage={myUsage} />}

      {isAdmin && usersUsage.length > 0 && (
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
            <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Organization Usage Overview</h2>
            <UsageChart data={usersUsage} />
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
            <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">All Instructors Usage</h2>
            <UsersTable users={usersUsage} />
          </div>
        </div>
      )}

      {isAdmin && usersUsage.length === 0 && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700 text-center">
          <p className="text-gray-500 dark:text-gray-400">No instructors have used AI features yet.</p>
        </div>
      )}
    </div>
  );
}
