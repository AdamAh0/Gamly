import type { HTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={clsx('glass rounded-2xl p-5', className)} {...props}>
      {children}
    </div>
  )
}
