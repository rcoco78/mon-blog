import { siteConfig } from '../lib/config'

const socialLinks = [
  {
    id: 'instagram',
    label: 'Instagram de Logement Atypique',
    href: siteConfig.social.instagram,
    icon: (
      <svg className="block h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
        <rect x="3.3" y="3.3" width="17.4" height="17.4" rx="4.2" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="4.1" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="17.4" cy="6.8" r="1.15" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    href: siteConfig.social.linkedin,
    icon: (
      <svg className="block h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
        <rect x="4" y="4" width="16" height="16" rx="3.2" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="8.15" cy="8.15" r="1.2" fill="currentColor" />
        <path fill="currentColor" d="M7.1 10.3h2.1v6.55H7.1zm4.25 0h2.1v.95c.4-.7 1.15-1.15 2.2-1.15 1.65 0 2.55 1.05 2.55 2.9v3.85h-2.15v-3.5c0-1.05-.4-1.6-1.25-1.6-.85 0-1.45.6-1.45 1.65v3.45h-2z" />
      </svg>
    ),
  },
  {
    id: 'youtube',
    label: 'YouTube',
    href: siteConfig.social.youtube,
    icon: (
      <svg className="block h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
        <rect x="2.2" y="5.2" width="19.6" height="13.6" rx="4.2" stroke="currentColor" strokeWidth="1.8" />
        <path fill="currentColor" d="M10 8.9l5.4 3.1-5.4 3.1z" />
      </svg>
    ),
  },
]

export default function SocialLinks({ className = '' }) {
  return (
    <nav className={`flex items-center ${className}`} aria-label="Réseaux sociaux">
      {socialLinks.filter((social) => social.href).map((social) => (
        <a
          key={social.id}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={social.label}
          title={social.label}
          className="inline-flex h-11 w-11 items-center justify-center text-neutral-500 transition-colors hover:text-neutral-900 focus-visible:text-neutral-900 dark:text-neutral-500 dark:hover:text-neutral-100 dark:focus-visible:text-neutral-100"
        >
          {social.icon}
        </a>
      ))}
    </nav>
  )
}
