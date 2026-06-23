'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'

const NAV_LINKS = [
  { label: 'Dashboard', href: '/hyped-stocks' },
  { label: 'Watchlist', href: '/watchlist' },
  { label: 'Alerts', href: '/alerts' },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav
      className="sticky top-0 z-50"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-default)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-8">
        {/* Logo */}
        <Link
          href="/hyped-stocks"
          className="font-black font-mono text-xl tracking-tight flex-shrink-0"
          style={{ color: 'var(--hype-green)' }}
        >
          HypeRadar
        </Link>

        {/* Nav links */}
        <div className="flex items-end gap-8">
          {NAV_LINKS.map(({ label, href }) => {
            const active =
              href === '/hyped-stocks'
                ? pathname === '/hyped-stocks' || pathname.startsWith('/hyped-stocks/')
                : pathname === href
            return (
              <Link
                key={href}
                href={href}
                className="text-sm font-mono font-bold pb-1 border-b-2 transition-colors duration-150"
                style={
                  active
                    ? { color: 'var(--hype-green)', borderColor: 'var(--hype-green)' }
                    : { color: 'var(--text-muted)', borderColor: 'transparent' }
                }
              >
                {label}
              </Link>
            )
          })}
        </div>

        {/* Clerk user button */}
        <UserButton />
      </div>
    </nav>
  )
}
