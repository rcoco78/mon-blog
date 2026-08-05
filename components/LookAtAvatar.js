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
function directionFromPointer(dx, dy, deadZone = 36) {
  const dist = Math.hypot(dx, dy)
  if (dist < deadZone) return 'center'
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
 * Avatar look-at :
 * - si `lookDirections` a assez d'angles → swap de photos
 * - sinon → léger tilt 3D CSS sur la photo unique
 */
export default function LookAtAvatar({
  src,
  alt = 'Photo de profil',
  size = 120,
  objectPosition = 'center 30%',
  lookBasePath = '/images/profile-picture/look',
  lookDirections = [],
  lookExt = 'jpg',
}) {
  const wrapRef = useRef(null)
  const reducedMotion = usePrefersReducedMotion()
  const directionsKey = (lookDirections || []).join(',')
  const available = useMemo(
    () => (lookDirections || []).filter((d) => ALL_DIRECTIONS.includes(d)),
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
        const next = directionFromPointer(dx, dy, Math.max(36, size * 0.28))
        const resolved = available.includes(next)
          ? next
          : available.includes('center')
            ? 'center'
            : available[0]
        setDirection((prev) => (prev === resolved ? prev : resolved))
        return
      }

      const max = 10
      const nx = Math.max(-1, Math.min(1, dx / 220))
      const ny = Math.max(-1, Math.min(1, dy / 220))
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
  }, [reducedMotion, useSprites, available, size])

  useEffect(() => {
    if (!useSprites) return
    available.forEach((d) => {
      const img = new window.Image()
      img.src = `${lookBasePath}/${d}.${lookExt}`
    })
  }, [useSprites, available, lookBasePath, lookExt])

  const imageSrc = useSprites ? `${lookBasePath}/${direction}.${lookExt}` : src

  const tiltStyle =
    useSprites || reducedMotion
      ? undefined
      : {
          transform: `perspective(520px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transition: 'transform 80ms linear',
          willChange: 'transform',
        }

  return (
    <div
      ref={wrapRef}
      className="relative inline-block mb-5 select-none"
      aria-hidden={false}
      style={{ perspective: useSprites ? undefined : 520 }}
    >
      <div className="rounded-full overflow-hidden" style={tiltStyle}>
        <Image
          src={imageSrc}
          alt={alt}
          width={Math.max(size * 3, 360)}
          height={Math.max(size * 3, 360)}
          sizes={`(max-width: 640px) ${size}px, ${size * 2}px`}
          className="rounded-full object-cover"
          style={{
            width: size,
            height: size,
            objectPosition,
          }}
          quality={92}
          priority
        />
      </div>
    </div>
  )
}
