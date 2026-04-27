import { LockKeyhole, Mail } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import ForgotPasswordForm from '../components/ForgotPasswordForm';

const FORGOT_FEATURES = [
  {
    icon: <LockKeyhole className="text-indigo-400 size-5" />,
    text: 'Secure OTP verification protects your account',
    accentColor: 'indigo' as const,
  },
  {
    icon: <Mail className="text-purple-400 size-5" />,
    text: 'Receive reset instructions instantly via email',
    accentColor: 'purple' as const,
  },
];

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      headline="Recover your account safely."
      description="Verify your identity with a one-time password, then create a new secure password."
      features={FORGOT_FEATURES}
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
