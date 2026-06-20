'use client'

import { SignUp } from '@clerk/nextjs'

const clerkAppearance = {
  variables: {
    colorBackground: '#111114',
    colorPrimary: '#62c073',
    colorDanger: '#ff6166',
    colorSuccess: '#62c073',
    colorWarning: '#ff990a',
    colorNeutral: '#c0c0cc',
    colorForeground: '#f0f0f4',
    colorInput: '#18181c',
    colorInputForeground: '#f0f0f4',
    colorBorder: '#2a2a30',
    borderRadius: '12px',
    fontFamily: 'var(--font-geist-sans)',
  },
  elements: {
    card: 'border border-[#2a2a30] shadow-2xl',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    formButtonPrimary:
      'bg-[#62c073] hover:bg-[#4da860] text-[#080809] font-bold transition-colors',
    footerActionLink: 'text-[#62c073] hover:text-[#4da860]',
    identityPreviewEditButton: 'text-[#62c073]',
    dividerLine: 'bg-[#2a2a30]',
    dividerText: 'text-[#505060]',
    socialButtonsBlockButton:
      'border-[#2a2a30] bg-[#18181c] text-[#f0f0f4] hover:bg-[#1e1e23] transition-colors',
    formFieldLabel: 'text-[#c0c0cc]',
    formFieldErrorText: 'text-[#ff6166]',
    alertText: 'text-[#ff6166]',
  },
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-base flex flex-col chart-grid overflow-hidden">
      {/* Top accent line */}
      <div className="h-px w-full bg-gradient-to-r from-hype-green via-hype-blue to-hype-red opacity-60" />

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="flex flex-col items-center">
          {/* Brand above form */}
          <div className="mb-6 text-center animate-fade-in-up">
            <h2 className="text-4xl font-black tracking-tight leading-none">
              <span style={{ color: 'var(--hype-green)' }}>Hype</span>
              <span style={{ color: 'var(--hype-red)' }}>Radar</span>
            </h2>
            <p className="mt-1.5 text-sm text-muted font-mono">
              Create your trading terminal account
            </p>
          </div>

          <SignUp
            signInUrl="/sign-in"
            forceRedirectUrl="/hyped-stocks"
            appearance={clerkAppearance}
          />
        </div>
      </div>

      {/* Bottom accent */}
      <div
        className="h-8 flex items-center justify-center border-t border-[var(--border-default)]"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        <p className="text-xs font-mono text-faint">
          Track the Hype. Trade the Signal.
        </p>
      </div>
    </div>
  )
}
