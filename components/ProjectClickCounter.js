import { useEffect, useState } from 'react'
import { QuietBone } from './QuietSkeleton'

/**
 * Affiche le compteur de clics d'un projet.
 * Si `clicks` (nombre) est fourni par le parent (batch), pas de fetch individuel.
 */
export default function ProjectClickCounter({ projectId, clicks: clicksProp }) {
  const [clicks, setClicks] = useState(typeof clicksProp === 'number' ? clicksProp : null)
  const [loading, setLoading] = useState(typeof clicksProp !== 'number')

  useEffect(() => {
    if (typeof clicksProp === 'number') {
      setClicks(clicksProp)
      setLoading(false)
      return
    }

    if (!projectId) {
      setClicks(0)
      setLoading(false)
      return
    }

    let cancelled = false
    const fetchClicks = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/projects/clicks?projectIds=${projectId}`)
        const data = await response.json()
        if (!cancelled) setClicks(data[projectId] || 0)
      } catch (error) {
        console.error('Erreur lors de la récupération des clics:', error)
        if (!cancelled) setClicks(0)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchClicks()
    return () => {
      cancelled = true
    }
  }, [projectId, clicksProp])

  if (loading) {
    return (
      <span className="text-xs text-neutral-500 dark:text-neutral-500 tabular-nums">
        <QuietBone inline className="h-2.5 w-8" />
      </span>
    )
  }

  return (
    <span className="text-xs text-neutral-500 dark:text-neutral-500 tabular-nums">
      {clicks} {clicks === 1 ? 'clic' : 'clics'}
    </span>
  )
}
