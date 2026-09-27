import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export function getStatusIndex(statusKey, statuses) {
  return statuses.findIndex(s => s.key === statusKey)
}

export function getUrgencyColor(urgency) {
  const map = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
  }
  return map[urgency] || 'bg-gray-100 text-gray-600'
}

export function generateChallengeId() {
  const num = Math.floor(100000 + Math.random() * 900000)
  return `JH-2026-${String(num).slice(0, 6)}`
}
