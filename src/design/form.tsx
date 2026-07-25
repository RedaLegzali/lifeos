import type { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from 'react'

/**
 * Primitives de formulaire du design system.
 * Elles remplacent les styles qui étaient copiés dans chaque page :
 * une seule définition, donc une seule chose à corriger.
 */

/** Style de champ partagé — exporté pour les cas non couverts par <Input>. */
export const fieldClass =
  'rounded-xl border border-white/[0.075] bg-white/[0.035] px-3.5 py-2 text-[13.5px] ' +
  'text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-accent/50'

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${fieldClass} ${className}`} {...props} />
}

export function Select({
  className = '',
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${fieldClass} cursor-pointer ${className}`} {...props}>
      {children}
    </select>
  )
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'tinted'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-bg hover:brightness-110',
  secondary:
    'border border-white/[0.075] bg-white/[0.035] text-ink hover:bg-white/[0.06]',
  ghost: 'text-ink-3 hover:text-ink',
  // `tinted` prend la teinte du widget courant via --tint.
  tinted:
    'text-[color:var(--tint)] [background:color-mix(in_srgb,var(--tint)_15%,transparent)] hover:brightness-125',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={
        'cursor-pointer rounded-xl px-4 py-2 text-[13px] font-semibold transition-all ' +
        'disabled:cursor-not-allowed disabled:opacity-40 ' +
        `${VARIANTS[variant]} ${className}`
      }
      {...props}
    />
  )
}
