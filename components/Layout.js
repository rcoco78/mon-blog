import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { siteConfig } from '../lib/config'

export default function Layout({ children }) {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Vérifier si une musique est en cours d'écoute
  useEffect(() => {
    const checkCurrentlyPlaying = async () => {
      try {
        const response = await fetch('/api/spotify/data')
        const data = await response.json()
        setIsPlaying(!!data.currentlyPlaying)
      } catch (error) {
        // Silencieux en cas d'erreur
        setIsPlaying(false)
      }
    }

    checkCurrentlyPlaying()
    // Vérifier toutes les 30 secondes
    const interval = setInterval(checkCurrentlyPlaying, 30000)
    return () => clearInterval(interval)
  }, [])

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
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col min-h-screen mt-8 sm:mt-8">
        <nav className="flex flex-row items-center justify-between relative px-0 pb-8 fade md:overflow-auto scroll-pr-6 md:relative" id="nav">
          <div className="flex flex-row items-center space-x-1 sm:space-x-2 flex-wrap">
            <Link 
              className={`transition-all hover:text-neutral-800 dark:hover:text-neutral-200 flex align-middle relative py-1 pl-0 pr-2 sm:pr-3 rounded-md ${
                router.pathname === '/' ? 'text-neutral-900 dark:text-neutral-100 font-medium' : 'text-neutral-600 dark:text-neutral-400'
              }`} 
              href="/"
            >
              accueil
            </Link>
            <Link 
              className={`transition-all hover:text-neutral-800 dark:hover:text-neutral-200 flex align-middle relative py-1 px-2 sm:px-3 rounded-md ${
                router.pathname.startsWith('/blog') ? 'text-neutral-900 dark:text-neutral-100 font-medium' : 'text-neutral-600 dark:text-neutral-400'
              }`} 
              href="/blog"
            >
              blog
            </Link>
            <Link 
              className={`transition-all hover:text-neutral-800 dark:hover:text-neutral-200 flex align-middle relative py-1 px-2 sm:px-3 rounded-md ${
                router.pathname === '/a-propos' ? 'text-neutral-900 dark:text-neutral-100 font-medium' : 'text-neutral-600 dark:text-neutral-400'
              }`} 
              href="/a-propos"
            >
              à propos
            </Link>
            <Link 
              className={`transition-all hover:text-neutral-800 dark:hover:text-neutral-200 flex align-middle relative py-1 px-2 sm:px-3 rounded-md ${
                router.pathname === '/outils' ? 'text-neutral-900 dark:text-neutral-100 font-medium' : 'text-neutral-600 dark:text-neutral-400'
              }`} 
              href="/outils"
            >
              outils
            </Link>
            <Link 
              className={`transition-all hover:text-neutral-800 dark:hover:text-neutral-200 flex align-middle relative py-1 px-2 sm:px-3 rounded-md ${
                router.pathname === '/donnees-publiques' ? 'text-neutral-900 dark:text-neutral-100 font-medium' : 'text-neutral-600 dark:text-neutral-400'
              }`} 
              href="/donnees-publiques"
            >
              <span className="hidden sm:inline">données publiques</span>
              <span className="sm:hidden">données</span>
            </Link>
          </div>
          <div className="flex justify-end items-center gap-0.5 max-[480px]:hidden">
            <button
              onClick={() => {
                if (typeof window !== 'undefined' && window.Calendly) {
                  window.Calendly.initPopupWidget({
                    url: 'https://calendly.com/corentinrobert/20min'
                  })
                } else {
                  // Charger Calendly si pas déjà chargé
                  if (!document.querySelector('link[href*="calendly.com"]')) {
                    const link = document.createElement('link')
                    link.href = 'https://assets.calendly.com/assets/external/widget.css'
                    link.rel = 'stylesheet'
                    document.head.appendChild(link)
                  }
                  const script = document.createElement('script')
                  script.src = 'https://assets.calendly.com/assets/external/widget.js'
                  script.type = 'text/javascript'
                  script.async = true
                  script.onload = () => {
                    if (window.Calendly) {
                      window.Calendly.initPopupWidget({
                        url: 'https://calendly.com/corentinrobert/20min'
                      })
                    }
                  }
                  document.head.appendChild(script)
                }
              }}
              aria-label="Réserver un appel"
              type="button"
              className="flex items-center justify-center transition-all py-1 px-2 sm:px-3 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 relative"
            >
              <div className="relative flex items-center justify-center w-5 h-5">
                {/* Effet de déflagration uniquement */}
                <span className="absolute inset-0 rounded-full border border-neutral-400 dark:border-neutral-500 animate-ping opacity-75"></span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="w-4 h-4 relative z-10">
                  <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.6 17.6 0 0 0 4.168 6.608 17.6 17.6 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.68.68 0 0 0-.58-.122l-2.19.547a1.75 1.75 0 0 1-1.657-.459L5.482 8.062a1.75 1.75 0 0 1-.46-1.657l.548-2.19a.68.68 0 0 0-.122-.58zM1.884.511a1.745 1.745 0 0 1 2.612.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.68.68 0 0 0 .178.643l2.457 2.457a.68.68 0 0 0 .644.178l2.189-.547a1.75 1.75 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.6 18.6 0 0 1-7.01-4.42 18.6 18.6 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877zM11 .5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V1.707l-4.146 4.147a.5.5 0 0 1-.708-.708L14.293 1H11.5a.5.5 0 0 1-.5-.5"/>
                </svg>
              </div>
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
                  <ul className="font-sm mt-8 flex flex-row flex-wrap gap-4 text-neutral-600 dark:text-neutral-300">
                    <li>
                      <Link
                        href="/contact"
                        className="flex items-center transition-all hover:text-neutral-800 dark:hover:text-neutral-100"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                        </svg>
                        <p className="ml-2 h-7">contact</p>
                      </Link>
                    </li>
                    <li>
                      <a
                        className="flex items-center transition-all hover:text-neutral-800 dark:hover:text-neutral-100"
                        rel="noopener noreferrer"
                        target="_blank"
                        href="https://www.linkedin.com/in/robertcorentin/"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                        </svg>
                        <p className="ml-2 h-7">linkedin</p>
                      </a>
                    </li>
                    <li>
                      <a
                        className="flex items-center transition-all hover:text-neutral-800 dark:hover:text-neutral-100"
                        rel="noopener noreferrer"
                        target="_blank"
                        href="https://www.malt.fr/profile/growth"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                        </svg>
                        <p className="ml-2 h-7">malt</p>
                      </a>
                    </li>
                    <li>
                      <a
                        className="flex items-center transition-all hover:text-neutral-800 dark:hover:text-neutral-100"
                        rel="noopener noreferrer"
                        target="_blank"
                        href="https://fr.pro.fiverr.com/sellers/corentinrobert"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                        </svg>
                        <p className="ml-2 h-7">fiverr</p>
                      </a>
                    </li>
                    <li>
                      <a
                        className="flex items-center transition-all hover:text-neutral-800 dark:hover:text-neutral-100"
                        rel="noopener noreferrer"
                        target="_blank"
                        href="https://apify.com?fpr=0n7ukq"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                        </svg>
                        <p className="ml-2 h-7">apify</p>
                      </a>
                    </li>
                    <li>
                      <Link
                        className="flex items-center transition-all hover:text-neutral-800 dark:hover:text-neutral-100"
                        href="/spotify"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                        </svg>
                        <p className="ml-2 h-7 flex items-center">
                          <span>spotify</span>
                          {isPlaying && (
                            <span className="relative flex h-2 w-2 ml-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                          )}
                        </p>
                      </Link>
                    </li>
                  </ul>
                </footer>
      </div>
    </div>
  )
} 