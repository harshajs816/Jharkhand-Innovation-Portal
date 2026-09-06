import { cn } from '../../utils/helpers'

const variants = {
  primary:   'bg-primary hover:bg-primary-dark text-white shadow-sm',
  secondary: 'bg-white border border-primary text-primary hover:bg-primary-light',
  ghost:     'bg-transparent hover:bg-gray-100 text-gray-700',
  danger:    'bg-red-600 hover:bg-red-700 text-white',
  accent:    'bg-accent hover:bg-yellow-600 text-white',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
}

export function Button({ children, variant = 'primary', size = 'md', className, disabled, ...props }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 cursor-pointer',
        'disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
