import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { siteConfig } from '../lib/config'

export default function Layout({ children }) {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
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
          <div className="flex flex-row items-center space-x-1 sm:space-x-2">
            <Link 
              className={`transition-all hover:text-neutral-800 dark:hover:text-neutral-200 flex align-middle relative py-1 px-2 sm:px-3 rounded-md ${
                router.pathname === '/' ? 'text-neutral-900 dark:text-neutral-100 font-medium' : 'text-neutral-600 dark:text-neutral-400'
              }`} 
              href="/"
            >
              home
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
                router.pathname === '/open' ? 'text-neutral-900 dark:text-neutral-100 font-medium' : 'text-neutral-600 dark:text-neutral-400'
              }`} 
              href="/open"
            >
              open
            </Link>
          </div>
          <button
            aria-label="Toggle Dark Mode"
            type="button"
            className="flex items-center justify-center transition-all py-1 px-2 sm:px-3 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 min-w-[40px]"
            onClick={toggleTheme}
            disabled={!mounted}
          >
            {currentTheme === 'dark' ? '🌞' : '🌙'}
          </button>
        </nav>

        <div>
          {children}
        </div>

                <footer className="mt-12 mb-16">
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
                        href="https://github.com/rcoco78"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                        </svg>
                        <p className="ml-2 h-7">github</p>
                      </a>
                    </li>
                    {siteConfig.social.spotify && (
                      <li>
                        <a
                          className="flex items-center transition-all hover:text-neutral-800 dark:hover:text-neutral-100"
                          rel="noopener noreferrer"
                          target="_blank"
                          href={siteConfig.social.spotify}
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                          </svg>
                          <p className="ml-2 h-7">spotify</p>
                        </a>
                      </li>
                    )}
                  </ul>
                </footer>
      </div>
    </div>
  )
} 