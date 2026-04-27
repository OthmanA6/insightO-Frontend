import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/shared/components/ui/ThemeToggle';
import { BarChart3 } from 'lucide-react';
import type { ReactNode } from 'react';

interface FeatureItem {
  icon: ReactNode;
  text: string;
  accentColor: 'indigo' | 'purple';
}

interface AuthLayoutProps {
  children: ReactNode;
  headline: string;
  description: string;
  features: FeatureItem[];
}

export default function AuthLayout({
  children,
  headline,
  description,
  features,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen w-full overflow-hidden font-sans transition-colors duration-300">
      {/* ── Left Brand Panel ──────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#020617] border-r border-slate-800/50 overflow-hidden items-center justify-center p-20">
        <div className="absolute inset-0 brand-pattern z-0 pointer-events-none" />

        <div className="absolute top-0 left-0 w-full h-full opacity-40 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-600/30 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-purple-600/20 rounded-full blur-[150px]" />
        </div>

        <div className="relative z-10 max-w-xl">
          <Link to="/" className="flex items-center gap-3 mb-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary shadow-lg shadow-indigo-500/20">
              <BarChart3 className="text-white size-7" />
            </div>
            <h2 className="text-white text-3xl font-bold tracking-tight">
              insightO
            </h2>
          </Link>

          <h1 className="text-white text-5xl font-black leading-tight tracking-tight mb-8">
            {headline}
          </h1>
          <p className="text-slate-400 text-xl leading-relaxed mb-12">
            {description}
          </p>

          <div className="space-y-6">
            {features.map((feature, i) => {
              const isIndigo = feature.accentColor === 'indigo';
              return (
                <div
                  key={i}
                  className="flex items-center gap-4 group cursor-default"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${
                      isIndigo
                        ? 'bg-indigo-500/10 border-indigo-500/20 group-hover:bg-indigo-500/30 group-hover:border-indigo-500/40'
                        : 'bg-purple-500/10 border-purple-500/20 group-hover:bg-purple-500/30 group-hover:border-purple-500/40'
                    }`}
                  >
                    {feature.icon}
                  </div>
                  <span className="text-slate-300 font-medium">
                    {feature.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ──────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 overflow-y-auto bg-white dark:bg-bg-dark relative">
        <div className="absolute top-6 right-6 z-50">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-lg relative z-10">
          {/* Mobile logo */}
          <div className="mb-8 lg:hidden">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-lg shadow-indigo-500/20">
                <BarChart3 className="text-white size-5" />
              </div>
              <h2 className="text-slate-900 dark:text-white text-2xl font-bold tracking-tight">
                insightO
              </h2>
            </Link>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
