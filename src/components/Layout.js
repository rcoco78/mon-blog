import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import ViewCounter from './ViewCounter'
import { useRouter } from 'next/router'

export default function Layout({ children }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="mx-auto max-w-2xl px-6 lg:px-8">
      <div className="flex flex-col min-h-screen mt-8">
        <div className="flex flex-col items-center">
          <div className="w-full max-w-xl px-4">
            <aside className="-ml-[8px] mb-16 tracking-tight">
              <div className="lg:sticky lg:top-20">
                <nav className="flex flex-row items-start relative px-0 pb-0 fade md:overflow-auto scroll-pr-6 md:relative" id="nav">
                  <div className="flex flex-row space-x-0 pr-10">
                    <Link href="/" className="transition-all hover:text-neutral-800 dark:hover:text-neutral-200 flex align-middle relative py-1 px-2 m-1">
                      home
                    </Link>
                    <Link href="/blog" className="transition-all hover:text-neutral-800 dark:hover:text-neutral-200 flex align-middle relative py-1 px-2 m-1">
                      blog
                    </Link>
                    <Link href="/about" className="transition-all hover:text-neutral-800 dark:hover:text-neutral-200 flex align-middle relative py-1 px-2 m-1">
                      à propos
                    </Link>
                    <button
                      aria-label="Toggle Dark Mode"
                      type="button"
                      className="flex items-center justify-center transition-all py-1 px-2 m-1"
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    >
                      {theme === 'dark' ? '🌞' : '🌙'}
                    </button>
                  </div>
                </nav>
              </div>
            </aside>

            {children}

            {router.pathname.startsWith('/blog/') && (
              <div className="mt-8 mb-8">
                <ViewCounter slug={router.query.slug} />
              </div>
            )}

            <footer className="mb-16">
              <ul className="font-sm mt-8 flex flex-col space-x-0 space-y-2 text-neutral-600 md:flex-row md:space-x-4 md:space-y-0 dark:text-neutral-300">
                <li>
                  <a
                    className="flex items-center transition-all hover:text-neutral-800 dark:hover:text-neutral-100"
                    rel="noopener noreferrer"
                    target="_blank"
                    href="https://calendly.com/corentinrobert/20min"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                    </svg>
                    <p className="ml-2 h-7">calendly</p>
                  </a>
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
              </ul>
            </footer>
          </div>
        </div>
      </div>
    </div>
  )
} 