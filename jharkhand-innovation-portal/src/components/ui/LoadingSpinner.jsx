export function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const s = { sm: 'h-5 w-5 border-2', md: 'h-8 w-8 border-4', lg: 'h-12 w-12 border-4' }[size]
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className={`${s} border-primary border-t-transparent rounded-full animate-spin`} />
      {text && <p className="text-sm text-gray-400 font-medium">{text}</p>}
    </div>
  )
}
