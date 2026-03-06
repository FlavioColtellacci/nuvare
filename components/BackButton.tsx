'use client'

import { useRouter } from 'next/navigation'

type BackButtonProps = {
  className?: string
}

export default function BackButton({ className = '' }: BackButtonProps) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      className={`inline-flex items-center gap-1.5 text-xs text-white/50 transition-colors hover:text-white/70 ${className}`}
    >
      ← Back
    </button>
  )
}
