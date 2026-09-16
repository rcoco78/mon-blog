import { siteConfig } from '../lib/config'

const socialLinks = [
  {
    id: 'instagram',
    label: 'Instagram de Logement Atypique',
    href: siteConfig.social.instagram,
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="17.4" cy="6.8" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    href: siteConfig.social.linkedin,
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M5.4 8.3H2.2V21h3.2V8.3ZM3.8 3A1.9 1.9 0 1 0 3.8 6.8 1.9 1.9 0 0 0 3.8 3ZM21.8 13.7c0-3.8-2-5.6-4.8-5.6-2.2 0-3.2 1.2-3.8 2.1V8.3H10V21h3.2v-6.3c0-1.7.3-3.3 2.4-3.3 2 0 2.1 1.9 2.1 3.4V21h3.2l.9-7.3Z" />
      </svg>
    ),
  },
  {
    id: 'youtube',
    label: 'YouTube',
    href: siteConfig.social.youtube,
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M22.5 7.1a2.8 2.8 0 0 0-2-2C18.8 4.6 12 4.6 12 4.6s-6.8 0-8.5.5a2.8 2.8 0 0 0-2 2A29 29 0 0 0 1 12a29 29 0 0 0 .5 4.9 2.8 2.8 0 0 0 2 2c1.7.5 8.5.5 8.5.5s6.8 0 8.5-.5a2.8 2.8 0 0 0 2-2A29 29 0 0 0 23 12a29 29 0 0 0-.5-4.9ZM9.8 15.2V8.8l5.7 3.2-5.7 3.2Z" />
      </svg>
    ),
  },
]

export default function SocialLinks({ className = '' }) {
  return (
    <nav className={`flex items-center gap-4 ${className}`} aria-label="Réseaux sociaux">
      {socialLinks.filter((social) => social.href).map((social) => (
        <a
          key={social.id}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={social.label}
          title={social.label}
          className="block h-5 w-5 text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-neutral-100"
        >
          {social.icon}
        </a>
      ))}
    </nav>
  )
}
