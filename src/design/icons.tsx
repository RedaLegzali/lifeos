/**
 * Icônes du design system — SVG inline, trait 1.8, héritent de `currentColor`.
 * Volontairement minimales : pas de dépendance à une librairie d'icônes.
 */
export interface IconProps {
  className?: string
}

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

export function IconHome({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 10.5 12 3l9 7.5V21H3z" />
      <path d="M9 21v-6h6v6" />
    </svg>
  )
}

export function IconCalendar({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  )
}

export function IconWallet({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="6" width="18" height="13" rx="3" />
      <path d="M3 10.5h18" />
      <circle cx="17" cy="15" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconBox({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M21 8.5 12 3 3 8.5 12 14z" />
      <path d="M3 8.5V16l9 5 9-5V8.5" />
    </svg>
  )
}

export function IconGamepad({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 9h.01M18 9h.01" strokeWidth={2.4} />
      <path d="M7.5 5h9a5.5 5.5 0 0 1 5.4 6.6l-.8 4.2a3 3 0 0 1-5.3 1.3L14.5 15h-5l-1.3 2.1a3 3 0 0 1-5.3-1.3l-.8-4.2A5.5 5.5 0 0 1 7.5 5z" />
    </svg>
  )
}

export function IconCheck({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m4 12.5 4 4L20 6.5" />
    </svg>
  )
}

export function IconSettings({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.5-2.3 1a7 7 0 0 0-2-1.2L14.2 3h-4l-.4 2.6a7 7 0 0 0-2 1.2l-2.3-1-2 3.5 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.5 2.3-1a7 7 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7 7 0 0 0 2-1.2l2.3 1 2-3.5-2-1.5c.06-.4.1-.8.1-1.2z" />
    </svg>
  )
}

export function IconSearch({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth={2} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}
