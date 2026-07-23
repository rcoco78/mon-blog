import { useState, useEffect } from 'react'

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0

    const handleScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const element = document.documentElement
        const scrollTop = element.scrollTop || document.body.scrollTop
        const scrollHeight = element.scrollHeight || document.body.scrollHeight
        const clientHeight = element.clientHeight
        const windowHeight = Math.max(scrollHeight - clientHeight, 1)
        setProgress(Math.min(100, Math.max(0, (scrollTop / windowHeight) * 100)))
      })
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  return (
    <div
      className="fixed top-0 left-0 w-full h-0.5 bg-neutral-200 dark:bg-neutral-800 z-50"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Progression de lecture"
    >
      <div
        className="h-full bg-neutral-900 dark:bg-neutral-100 transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
