import clsx from 'clsx'

const frameRings: Record<string, string> = {
  default: 'ring-white/10',
  flame: 'ring-orange-400/70',
  electric: 'ring-cyan-400/70',
  royal: 'ring-amber-400/70',
  cosmic: 'ring-fuchsia-400/70',
}

interface AvatarProps {
  name: string
  avatarUrl?: string | null
  frame?: string
  size?: 'sm' | 'md' | 'lg'
  online?: boolean
}

const sizeClasses: Record<string, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-12 w-12 text-base',
  lg: 'h-20 w-20 text-2xl',
}

export function Avatar({ name, avatarUrl, frame = 'default', size = 'md', online }: AvatarProps) {
  const initials = name.slice(0, 2).toUpperCase()
  return (
    <div className="relative inline-block">
      <div
        className={clsx(
          'flex items-center justify-center overflow-hidden rounded-full bg-surface-700 font-bold text-white ring-2',
          sizeClasses[size],
          frameRings[frame] ?? frameRings.default,
        )}
      >
        {avatarUrl ? <img src={avatarUrl} alt={name} className="h-full w-full object-cover" /> : initials}
      </div>
      {online !== undefined && (
        <span
          className={clsx(
            'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-surface-900',
            online ? 'bg-emerald-400' : 'bg-zinc-500',
          )}
        />
      )}
    </div>
  )
}
