import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// ─── Variant Definitions ──────────────────────────────────────────────────────

const buttonVariants = cva(
  // Base styles shared across all variants
  [
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold',
    'transition-all duration-150 ease-in-out select-none whitespace-nowrap',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'focus-visible:ring-primary-500 focus-visible:ring-offset-white',
    'dark:focus-visible:ring-offset-bg-dark',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-95',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        /**
         * Solid indigo – primary CTA
         */
        primary: [
          'bg-primary-600 text-white',
          'shadow-primary',
          'hover:bg-primary-hover hover:shadow-primary-lg',
        ],

        /**
         * Indigo → Purple gradient – "Generate AI" & hero CTAs
         */
        gradient: [
          'bg-gradient-primary text-white',
          'shadow-primary',
          'hover:opacity-90 hover:shadow-primary-lg',
        ],

        /**
         * Outlined – secondary actions
         */
        outline: [
          'border border-slate-700 bg-transparent text-slate-900',
          'hover:bg-slate-100',
          'dark:text-slate-100 dark:border-slate-600',
          'dark:hover:bg-surface-highlight',
        ],

        /**
         * Ghost – low-emphasis actions (nav items, icon buttons)
         */
        ghost: [
          'border-0 bg-transparent text-slate-700',
          'hover:bg-slate-100 hover:text-slate-900',
          'dark:text-slate-300 dark:hover:bg-surface-highlight dark:hover:text-slate-100',
        ],

        /**
         * Danger – destructive / irreversible actions
         */
        danger: [
          'bg-red-600 text-white',
          'shadow-sm shadow-red-500/40',
          'hover:bg-red-700 hover:shadow-red-500/50',
        ],
      },

      size: {
        sm: 'h-8 px-3 text-xs [&_svg]:size-3.5',
        md: 'h-10 px-4 text-sm [&_svg]:size-4',
        lg: 'h-12 px-6 text-base [&_svg]:size-5',
      },
    },

    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

// ─── Types ──────────────────────────────────────────────────────────────────

export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>
export type ButtonSize    = NonNullable<VariantProps<typeof buttonVariants>['size']>

export interface ButtonProps
  extends React.ComponentPropsWithRef<'button'>,
    VariantProps<typeof buttonVariants> {}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * `Button` – insightO design-system button.
 *
 * @example
 * <Button variant="gradient" size="lg">Generate AI Report</Button>
 * <Button variant="outline" size="sm">Cancel</Button>
 * <Button variant="danger">Delete</Button>
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
)

Button.displayName = 'Button'

export { Button, buttonVariants }
