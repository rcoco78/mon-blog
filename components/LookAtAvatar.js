import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

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

/** Cache module-level : reste chaud entre navigations client. */
const preloadedUrls = new Set()

function preloadUrl(url) {
  if (!url || preloadedUrls.has(url) || typeof window === 'undefined') return
  preloadedUrls.add(url)
  const img = new window.Image()
  img.decoding = 'async'
  img.src = url
}

/** Secteurs alignés dahbiahmed (atan2). */
function directionFromPointer(dx, dy, deadZone = 40) {
  if (Math.hypot(dx, dy) < deadZone) return 'center'
  const deg = (Math.atan2(dy, dx) * 180) / Math.PI
  if (deg >= -22.5 && deg < 22.5) return 'right'
  if (deg >= 22.5 && deg < 67.5) return 'bottom-right'
  if (deg >= 67.5 && deg < 112.5) return 'bottom'
  if (deg >= 112.5 && deg < 157.5) return 'bottom-left'
  if (deg >= 157.5 || deg < -157.5) return 'left'
  if (deg >= -157.5 && deg < -112.5) return 'top-left'
  if (deg >= -112.5 && deg < -67.5) return 'top'
  if (deg >= -67.5 && deg < -22.5) return 'top-right'
  return 'center'
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
 * Look-at fluide (approche dahbi) :
 * - <img> natif + précharge (pas Next/Image → pas de cold-load /_next/image)
 * - swap immédiat de src dès que l'angle change
 */
export default function LookAtAvatar({
  src,
  alt = 'Photo de profil',
  size = 120,
  objectPosition = 'center 28%',
  lookBasePath = '/images/profile-picture/look',
  lookDirections = [],
  lookExt = 'jpg',
}) {
  const wrapRef = useRef(null)
  const imgRef = useRef(null)
  const directionRef = useRef('center')
  const pointerRef = useRef({ x: 0, y: 0, has: false })
  const rafRef = useRef(0)
  const availableRef = useRef([])

  const reducedMotion = usePrefersReducedMotion()
  const directionsKey = (lookDirections || []).join(',')
  const available = useMemo(
    () => (lookDirections || []).filter((d) => ALL_DIRECTIONS.includes(d)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [directionsKey]
  )
  availableRef.current = available
  const useSprites = available.length >= 3 && !reducedMotion

  const urlFor = (d) => `${lookBasePath}/${d}.${lookExt}`
  const centerUrl = useSprites
    ? urlFor(available.includes('center') ? 'center' : available[0])
    : src

  const [tilt, setTilt] = useState({ rx: 0, ry: 0 })

  // Précharge dès le montage (Image + link preload)
  useEffect(() => {
    if (!useSprites) {
      preloadUrl(src)
      return undefined
    }
    const urls = available.map((d) => urlFor(d))
    urls.forEach(preloadUrl)
    const links = urls.map((href) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = href
      document.head.appendChild(link)
      return link
    })
    return () => links.forEach((l) => l.remove())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useSprites, directionsKey, lookBasePath, lookExt, src])

  useLayoutEffect(() => {
    if (reducedMotion) return undefined

    const setDirection = (next) => {
      if (!useSprites) return
      const list = availableRef.current
      const resolved = list.includes(next)
        ? next
        : list.includes('center')
          ? 'center'
          : list[0]
      if (!resolved || resolved === directionRef.current) return
      const url = urlFor(resolved)
      preloadUrl(url)
      const img = imgRef.current
      if (img) img.src = url
      directionRef.current = resolved
    }

    const sample = () => {
      rafRef.current = 0
      const el = wrapRef.current
      if (!el || !pointerRef.current.has) return
      const rect = el.getBoundingClientRect()
      const dx = pointerRef.current.x - (rect.left + rect.width / 2)
      const dy = pointerRef.current.y - (rect.top + rect.height / 2)

      if (useSprites) {
        setDirection(directionFromPointer(dx, dy, Math.max(40, size * 0.35)))
        return
      }

      const max = 10
      const nx = Math.max(-1, Math.min(1, dx / 220))
      const ny = Math.max(-1, Math.min(1, dy / 220))
      setTilt({ rx: -ny * max, ry: nx * max })
    }

    const schedule = () => {
      if (rafRef.current) return
      rafRef.current = window.requestAnimationFrame(sample)
    }

    const onMouseMove = (e) => {
      pointerRef.current = { x: e.clientX, y: e.clientY, has: true }
      schedule()
    }
    const onTouchMove = (e) => {
      const t = e.touches?.[0]
      if (!t) return
      pointerRef.current = { x: t.clientX, y: t.clientY, has: true }
      schedule()
    }
    const onReset = () => {
      pointerRef.current.has = false
      if (useSprites) setDirection('center')
      else setTilt({ rx: 0, ry: 0 })
    }

    document.addEventListener('mousemove', onMouseMove, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: true })
    document.addEventListener('mouseleave', onReset)
    document.addEventListener('touchend', onReset, { passive: true })
    window.addEventListener('blur', onReset)

    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('mouseleave', onReset)
      document.removeEventListener('touchend', onReset)
      window.removeEventListener('blur', onReset)
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion, useSprites, directionsKey, size, lookBasePath, lookExt])

  const imgStyle = {
    width: size,
    height: size,
    objectFit: 'cover',
    objectPosition,
    borderRadius: '9999px',
    display: 'block',
  }

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
      style={{ width: size, height: size, perspective: useSprites ? undefined : 520 }}
    >
      {/* Force decode navigateur avant le 1er move */}
      {useSprites && (
        <div aria-hidden className="absolute w-0 h-0 overflow-hidden opacity-0 pointer-events-none">
          {available.map((d) => (
            <img key={d} src={urlFor(d)} alt="" width={1} height={1} />
          ))}
        </div>
      )}

      <div
        className="relative rounded-full overflow-hidden"
        style={{ width: size, height: size, ...tiltStyle }}
      >
        <img
          ref={imgRef}
          src={useSprites ? centerUrl : src}
          alt={alt}
          width={size * 2}
          height={size * 2}
          decoding="async"
          fetchPriority="high"
          draggable={false}
          style={imgStyle}
        />
      </div>
    </div>
  )
}
