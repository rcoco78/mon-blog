import { useEffect, useState } from 'react'

export default function ProjectClickCounter({ projectId }) {
  const [clicks, setClicks] = useState(null)

  useEffect(() => {
    const fetchClicks = async () => {
      try {
        const response = await fetch(`/api/projects/clicks?projectIds=${projectId}`)
        const data = await response.json()
        setClicks(data[projectId] || 0)
      } catch (error) {
        console.error('Erreur lors de la récupération des clics:', error)
        setClicks(0)
      }
    }

    fetchClicks()
  }, [projectId])

  if (clicks === null) {
    return null // Ne rien afficher pendant le chargement
  }

  return (
    <span className="text-xs text-neutral-500 dark:text-neutral-500 tabular-nums">
      {clicks} {clicks === 1 ? 'clic' : 'clics'}
    </span>
  )
}

