// features/TaskManagement/pages/TaskAnalyticsPage.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Standalone page that wraps the TaskAnalyticsDashboard component.
// Registered in App.tsx under /dashboard/task-analytics.
// ─────────────────────────────────────────────────────────────────────────────

import { TaskAnalyticsDashboard } from '../components/TaskAnalyticsDashboard';

export default function TaskAnalyticsPage() {
  return (
    <div className="flex-1 p-4 md:p-10 max-w-7xl mx-auto">
      <TaskAnalyticsDashboard />
    </div>
  );
}
