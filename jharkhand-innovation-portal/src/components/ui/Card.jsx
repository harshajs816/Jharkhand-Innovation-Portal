import { cn } from '../../utils/helpers'

export function Card({ children, className, hover = false, ...props }) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl shadow-sm border border-gray-100 p-5',
        hover && 'card-hover cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }) {
  return <div className={cn('mb-4', className)}>{children}</div>
}

export function CardTitle({ children, className }) {
  return <h3 className={cn('font-semibold text-gray-800 text-base', className)}>{children}</h3>
}
