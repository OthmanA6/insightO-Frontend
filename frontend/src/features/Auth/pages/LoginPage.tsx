import { ClipboardList, Brain } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import LoginForm from '../components/LoginForm';

const LOGIN_FEATURES = [
  {
    icon: <ClipboardList className="text-indigo-400 size-5" />,
    text: '3 Pending evaluations require your attention',
    accentColor: 'indigo' as const,
  },
  {
    icon: <Brain className="text-purple-400 size-5" />,
    text: 'New AI insights generated for your department',
    accentColor: 'purple' as const,
  },
];

export default function LoginPage() {
  return (
    <AuthLayout
      headline="Welcome back to clarity."
      description="Access your dashboard to review pending evaluations, analyze AI-driven performance trends, and guide your team to success."
      features={LOGIN_FEATURES}
    >
      <LoginForm />
    </AuthLayout>
  );
}
