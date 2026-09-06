import { cn } from '../../utils/helpers'

export function Badge({ children, className }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
      className
    )}>
      {children}
    </span>
  )
}

export function StatusBadge({ status }) {
  return (
    <span
      className={`status-${status} inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold`}
      style={{ whiteSpace: 'nowrap' }}
    >
      {status.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
    </span>
  )
}
