import clsx from 'clsx'

export function CoinBadge({ amount, className }: { amount: number; className?: string }) {
  return (
    <div
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full bg-amber-400/10 px-3 py-1.5 text-sm font-bold text-amber-300 ring-1 ring-amber-400/30',
        className,
      )}
    >
      <span>🪙</span>
      <span>{amount.toLocaleString()}</span>
    </div>
  )
}
