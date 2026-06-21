import clsx from 'clsx'

export function Logo({ className }: { className?: string }) {
  return (
    <div className={clsx('flex items-center gap-2 font-extrabold tracking-tight', className)}>
      <div className="accent-gradient flex h-8 w-8 items-center justify-center rounded-lg text-lg shadow-lg shadow-violet-500/30">
        🎮
      </div>
      <span className="text-xl text-white">Gamly</span>
    </div>
  )
}
