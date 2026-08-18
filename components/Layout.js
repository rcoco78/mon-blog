import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { siteConfig } from '../lib/config'
import { openCalendlyPopup } from '../lib/calendly'

const ArrowIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
  </svg>
)

function FooterArrowLink({ href, children, active, external, isPlaying, title, onHover }) {
  const linkClass = `flex items-center transition-all hover:text-neutral-800 dark:hover:text-neutral-100 ${active ? 'text-neutral-900 dark:text-neutral-100 font-medium' : ''}`
  const hoverProps = onHover ? { onMouseEnter: onHover, onFocus: onHover } : {}
  const content = (
    <>
      <ArrowIcon />
      <p className="ml-2 h-7">
        {children}
        {isPlaying && (
          <span className="relative inline-flex h-2 w-2 ml-2 align-middle">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
        )}
      </p>
    </>
  )
  if (external) {
    return (
      <li>
        <a className={linkClass} href={href} target="_blank" rel="noopener noreferrer" title={title} {...hoverProps}>
          {content}
        </a>
      </li>
    )
  }
  return (
    <li>
      <Link className={linkClass} href={href} title={title} {...hoverProps}>
        {content}
      </Link>
    </li>
  )
}

export default function Layout({ children }) {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const spotifyFetchedRef = useRef(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSpotifyHover = () => {
    if (spotifyFetchedRef.current) return
    spotifyFetchedRef.current = true
    fetch('/api/spotify/data')
      .then((res) => res.json())
      .then((data) => setIsPlaying(!!data?.currentlyPlaying))
      .catch(() => setIsPlaying(false))
  }

  const toggleTheme = () => {
    if (!mounted) return
    
    // Utiliser resolvedTheme qui est le thème réellement appliqué
    const currentTheme = resolvedTheme || theme || 'light'
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
    
    setTheme(newTheme)
  }

  // Utiliser resolvedTheme qui est toujours défini (même si theme peut être 'system')
  const currentTheme = mounted ? (resolvedTheme || 'light') : 'light'

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      <div className="flex flex-col min-h-screen mt-8 sm:mt-8">
        <nav className="flex flex-row items-center justify-between relative px-0 pb-8 fade md:overflow-auto scroll-pr-6 md:relative" id="nav">
          <div className="flex flex-row items-start sm:items-center flex-wrap gap-x-1 sm:gap-x-2 gap-y-1">
            <Link 
              className={`transition-all hover:text-neutral-800 dark:hover:text-neutral-200 flex align-middle relative py-1 pl-0 pr-2 sm:pr-3 rounded-md ${
                router.pathname === '/' ? 'text-neutral-900 dark:text-neutral-100 font-medium' : 'text-neutral-600 dark:text-neutral-400'
              }`} 
              href="/"
            >
              accueil
            </Link>
            <Link 
              className={`transition-all hover:text-neutral-800 dark:hover:text-neutral-200 flex align-middle relative py-1 pl-0 pr-2 sm:pr-3 rounded-md ${
                router.pathname.startsWith('/blog') ? 'text-neutral-900 dark:text-neutral-100 font-medium' : 'text-neutral-600 dark:text-neutral-400'
              }`} 
              href="/blog"
            >
              blog
            </Link>
            <Link 
              className={`transition-all hover:text-neutral-800 dark:hover:text-neutral-200 flex align-middle relative py-1 pl-0 pr-2 sm:pr-3 rounded-md ${
                router.pathname === '/a-propos' ? 'text-neutral-900 dark:text-neutral-100 font-medium' : 'text-neutral-600 dark:text-neutral-400'
              }`} 
              href="/a-propos"
            >
              à propos
            </Link>
            <Link 
              className={`transition-all hover:text-neutral-800 dark:hover:text-neutral-200 flex align-middle relative py-1 pl-0 pr-2 sm:pr-3 rounded-md ${
                router.pathname === '/marketplace' ? 'text-neutral-900 dark:text-neutral-100 font-medium' : 'text-neutral-600 dark:text-neutral-400'
              }`} 
              href="/marketplace"
            >
              marketplace
            </Link>
            <Link 
              className={`transition-all hover:text-neutral-800 dark:hover:text-neutral-200 flex align-middle relative py-1 pl-0 pr-2 sm:pr-3 rounded-md ${
                router.pathname === '/objectifs' ? 'text-neutral-900 dark:text-neutral-100 font-medium' : 'text-neutral-600 dark:text-neutral-400'
              }`} 
              href="/objectifs"
            >
              objectifs
            </Link>
          </div>
          <div className="flex justify-end items-center gap-0.5 max-[480px]:hidden">
            <button
              onClick={() => openCalendlyPopup('nav')}
              type="button"
              className="transition-all hover:text-neutral-800 dark:hover:text-neutral-200 flex align-middle relative py-1 pl-2 pr-2 sm:pr-3 rounded-md text-neutral-600 dark:text-neutral-400"
            >
              appel
            </button>
            <button
              aria-label="Toggle Dark Mode"
              type="button"
              className="flex items-center justify-center transition-all py-1 px-2 sm:px-3 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 min-w-[40px]"
              onClick={toggleTheme}
              disabled={!mounted}
            >
            {currentTheme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="w-4 h-4">
                <path d="M12 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0M8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0m0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13m8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5M3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8m10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0m-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0m9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707M4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="w-4 h-4">
                <path d="M6 .278a.77.77 0 0 1 .08.858 7.2 7.2 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277q.792-.001 1.533-.16a.79.79 0 0 1 .81.316.73.73 0 0 1-.031.893A8.35 8.35 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.75.75 0 0 1 6 .278M4.858 1.311A7.27 7.27 0 0 0 1.025 7.71c0 4.02 3.279 7.276 7.319 7.276a7.32 7.32 0 0 0 5.205-2.162q-.506.063-1.029.063c-4.61 0-8.343-3.714-8.343-8.29 0-1.167.242-2.278.681-3.286"/>
              </svg>
            )}
          </button>
          </div>
        </nav>

        <div>
          {children}
        </div>

                <footer className="mt-8 mb-16 px-2 md:px-0">
                  {/* Boutons mobile pour dark mode et appel (affichés uniquement sur mobile) */}
                  <div className="flex items-center justify-center gap-4 mb-6 sm:hidden">
                    <button
                      onClick={() => openCalendlyPopup('footer_mobile')}
                      type="button"
                      className="flex items-center justify-center transition-all py-2 px-4 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 text-sm"
                    >
                      appel
                    </button>
                    <button
                      aria-label="Toggle Dark Mode"
                      type="button"
                      className="flex items-center justify-center transition-all py-2 px-4 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 min-w-[40px]"
                      onClick={toggleTheme}
                      disabled={!mounted}
                    >
                      {currentTheme === 'dark' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="w-4 h-4">
                          <path d="M12 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0M8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0m0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13m8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5M3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8m10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0m-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0m9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707M4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708"/>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="w-4 h-4">
                          <path d="M6 .278a.77.77 0 0 1 .08.858 7.2 7.2 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277q.792-.001 1.533-.16a.79.79 0 0 1 .81.316.73.73 0 0 1-.031.893A8.35 8.35 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.75.75 0 0 1 6 .278M4.858 1.311A7.27 7.27 0 0 0 1.025 7.71c0 4.02 3.279 7.276 7.319 7.276a7.32 7.32 0 0 0 5.205-2.162q-.506.063-1.029.063c-4.61 0-8.343-3.714-8.343-8.29 0-1.167.242-2.278.681-3.286"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  <ul className="font-sm mt-8 flex flex-row flex-wrap gap-4 text-neutral-600 dark:text-neutral-300">
                    <FooterArrowLink href="/contact" active={router.pathname === '/contact'}>contact</FooterArrowLink>
                    <FooterArrowLink href="/confidentialite" active={router.pathname === '/confidentialite'}>confidentialité</FooterArrowLink>
                    <FooterArrowLink href="/cas-usage" active={router.pathname === '/cas-usage' || router.pathname.startsWith('/cas-usage/')}>cas d&apos;usage</FooterArrowLink>
                    <FooterArrowLink href="/newsletter" active={router.pathname === '/newsletter'}>newsletter</FooterArrowLink>
                    <FooterArrowLink href={siteConfig.social.youtube} external active={false}>youtube</FooterArrowLink>
                    <FooterArrowLink href="https://www.linkedin.com/in/robertcorentin/" external active={false}>linkedin</FooterArrowLink>
                    <FooterArrowLink href="/spotify" active={router.pathname === '/spotify'} isPlaying={isPlaying} onHover={handleSpotifyHover}>spotify</FooterArrowLink>
                  </ul>
                </footer>
      </div>
    </div>
  )
} 