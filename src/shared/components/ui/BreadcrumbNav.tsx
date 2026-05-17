import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  homeItem?: { label: string; href: string };
  className?: string;
}

// 🚨 الحل هنا: ضفنا homeItem في الـ Destructuring
export function BreadcrumbNav({ items, homeItem, className }: BreadcrumbNavProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        'flex items-center gap-1.5 text-sm font-medium animate-in fade-in slide-in-from-left-2 duration-300',
        className,
      )}
    >
      <Link
        to={homeItem?.href || "/dashboard/departments"}
        className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-400 transition-colors group"
      >
        <Home className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
        <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">
          {homeItem?.label || "Departments"}
        </span>
      </Link>

      {/* ضفنا علامة الاستفهام للأمان عشان لو مفيش items ميعملش كراش */}
      {items?.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={index} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-slate-600/60" />
            {isLast || !item.href ? (
              <span className="text-xs font-black uppercase tracking-wider text-indigo-400 truncate max-w-[180px]">
                {item.label}
              </span>
            ) : (
              <Link
                to={item.href}
                className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-indigo-400 transition-colors truncate max-w-[180px]"
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}