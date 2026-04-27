import { ShieldCheck, Brain } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import RegisterForm from '../components/RegisterForm';

const REGISTER_FEATURES = [
  {
    icon: <ShieldCheck className="text-indigo-400 size-5" />,
    text: 'Enterprise-grade security & encryption',
    accentColor: 'indigo' as const,
  },
  {
    icon: <Brain className="text-purple-400 size-5" />,
    text: 'Custom AI models trained on your culture',
    accentColor: 'purple' as const,
  },
];

export default function RegisterPage() {
  return (
    <AuthLayout
      headline="Empower your institution with AI-driven insights."
      description="Join leading educators in transforming academic performance through data-backed intelligence."
      features={REGISTER_FEATURES}
    >
      <RegisterForm />
    </AuthLayout>
  );
}
