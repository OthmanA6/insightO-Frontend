import React from 'react';
import { useParams } from 'react-router-dom';
import { StudentProfileDashboard } from '../components/StudentProfileDashboard';

export const UserProfileViewPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();

  if (!userId) {
    return <div className="p-8 text-center text-destructive">User ID is missing from URL</div>;
  }

  return <StudentProfileDashboard userId={userId} />;
};

export default UserProfileViewPage;
