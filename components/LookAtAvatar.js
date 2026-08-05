import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'

const ALL_DIRECTIONS = [
  'center',
  'top',
  'top-right',
  'right',
  'bottom-right',
  'bottom',
  'bottom-left',
  'left',
  'top-left',
]

/**
 * Angle souris → direction (même logique que dahbiahmed / look-at sprites).
 */
function directionFromPointer(dx, dy) {
  const dist = Math.hypot(dx, dy)
  if (dist < 28) return 'center'
  let deg = (Math.atan2(dy, dx) * 180) / Math.PI
  // 0° = droite, sens horaire ; on décale pour aligner sur nos labels
  deg = (deg + 360 + 90) % 360
  const sector = Math.round(deg / 45) % 8
  return ['top', 'top-right', 'right', 'bottom-right', 'bottom', 'bottom-left', 'left', 'top-left'][
    sector
  ]
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener?.('change', update)
    return () => mq.removeEventListener?.('change', update)
  }, [])
  return reduced
}

/**
 * Avatar interactif :
 * - si `lookDirections` a assez d'angles → swap de photos (effet dahbi)
 * - sinon → léger tilt 3D CSS sur la photo unique (fallback tant que le set n'est pas shooté)
 * Clic = comportement parent (ex. ouvrir la vidéo).
 */
export default function LookAtAvatar({
  src,
  alt = 'Photo de profil',
  size = 64,
  objectPosition = 'center 30%',
  onClick,
  ring,
  lookBasePath = '/images/profile-picture/look',
  lookDirections = [],
  lookExt = 'jpg',
}) {
  const wrapRef = useRef(null)
  const reducedMotion = usePrefersReducedMotion()
  const directionsKey = (lookDirections || []).join(',')
  const available = useMemo(
    () => (lookDirections || []).filter((d) => ALL_DIRECTIONS.includes(d)),
    // directionsKey capture le contenu ; lookDirections est dérivé du parent
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [directionsKey]
  )
  const useSprites = available.length >= 3 && !reducedMotion

  const [direction, setDirection] = useState('center')
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 })

  useEffect(() => {
    if (reducedMotion) return undefined

    const onMove = (clientX, clientY) => {
      const el = wrapRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = clientX - cx
      const dy = clientY - cy

      if (useSprites) {
        const next = directionFromPointer(dx, dy)
        const resolved = available.includes(next)
          ? next
          : available.includes('center')
            ? 'center'
            : available[0]
        setDirection((prev) => (prev === resolved ? prev : resolved))
        return
      }

      // Tilt doux (fallback 1 photo) — max ~10°
      const max = 10
      const nx = Math.max(-1, Math.min(1, dx / 180))
      const ny = Math.max(-1, Math.min(1, dy / 180))
      setTilt({ rx: -ny * max, ry: nx * max })
    }

    const onMouseMove = (e) => onMove(e.clientX, e.clientY)
    const onTouchMove = (e) => {
      const t = e.touches?.[0]
      if (t) onMove(t.clientX, t.clientY)
    }
    const onLeave = () => {
      setDirection('center')
      setTilt({ rx: 0, ry: 0 })
    }

    document.addEventListener('mousemove', onMouseMove, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('blur', onLeave)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('blur', onLeave)
    }
  }, [reducedMotion, useSprites, available])

  // Précharge des angles
  useEffect(() => {
    if (!useSprites) return
    available.forEach((d) => {
      const img = new window.Image()
      img.src = `${lookBasePath}/${d}.${lookExt}`
    })
  }, [useSprites, available, lookBasePath, lookExt])

  const imageSrc = useSprites
    ? `${lookBasePath}/${direction}.${lookExt}`
    : src

  const tiltStyle = useSprites || reducedMotion
    ? undefined
    : {
        transform: `perspective(420px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        transition: 'transform 80ms linear',
        willChange: 'transform',
      }

  return (
    <button
      type="button"
      ref={wrapRef}
      onClick={onClick}
      className="relative inline-block mb-4 group cursor-pointer p-[2px] rounded-full border-0 bg-transparent text-left"
      aria-label={`${alt} — voir la vidéo de présentation`}
      style={{ perspective: useSprites ? undefined : 420 }}
    >
      {ring}
      <div
        className="rounded-full bg-white dark:bg-neutral-900 p-[2px]"
        style={tiltStyle}
      >
        <Image
          src={imageSrc}
          alt={alt}
          width={size}
          height={size}
          sizes={`${size}px`}
          className="rounded-full object-cover transition-opacity group-hover:opacity-95"
          style={{
            width: size,
            height: size,
            objectPosition,
          }}
          priority
        />
      </div>
      {/* Pastille play discrète — ne masque pas le look-at */}
      <span className="pointer-events-none absolute bottom-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900/85 text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-neutral-100/90 dark:text-neutral-900">
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M10.804 8 5 4.633v6.734zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C4.713 12.69 4 12.345 4 11.692V4.308c0-.653.713-.998 1.233-.696z" />
        </svg>
      </span>
    </button>
  )
}
