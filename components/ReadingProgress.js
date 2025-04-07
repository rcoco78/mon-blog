import { useState, useEffect } from 'react'

export default function ReadingProgress({ content }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Gérer la barre de progression
    const handleScroll = () => {
      const element = document.documentElement
      const scrollTop = element.scrollTop || document.body.scrollTop
      const scrollHeight = element.scrollHeight || document.body.scrollHeight
      const clientHeight = element.clientHeight
      
      const windowHeight = scrollHeight - clientHeight
      const progress = (scrollTop / windowHeight) * 100
      
      setProgress(progress)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="fixed top-0 left-0 w-full h-0.5 bg-neutral-100 dark:bg-neutral-800 z-50">
      <div 
        className="h-full bg-neutral-900 dark:bg-white transition-all duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
} 