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

function isImageReady(img) {
  return Boolean(img && img.complete && img.naturalWidth > 0)
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
 * Look-at sans flash blanc :
 * - les 9 photos restent empilées (opacity), déjà décodées
 * - on n’affiche la suivante que quand elle est ready
 * - le fond du cercle = photo center (plus de bg blanc)
 */
export default function LookAtAvatar({
  src,
  alt = 'Photo de profil',
  size = 96,
  objectPosition = 'center 28%',
  lookBasePath = '/images/profile-picture/look',
  lookDirections = [],
  lookExt = 'jpg',
  showRing = true,
}) {
  const wrapRef = useRef(null)
  const imgRef = useRef(null)
  const layerRefs = useRef({})
  const directionRef = useRef('center')
  const pointerRef = useRef({ x: 0, y: 0, has: false })
  const rafRef = useRef(0)
  const availableRef = useRef([])

  const reducedMotion = usePrefersReducedMotion()
  const [ringDrawn, setRingDrawn] = useState(reducedMotion)
  const directionsKey = (lookDirections || []).join(',')
  const available = useMemo(
    () => (lookDirections || []).filter((d) => ALL_DIRECTIONS.includes(d)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [directionsKey]
  )
  availableRef.current = available
  const useSprites = available.length >= 3 && !reducedMotion

  const urlFor = (d) => `${lookBasePath}/${d}.${lookExt}`
  const centerKey = available.includes('center') ? 'center' : available[0]
  const centerUrl = useSprites ? urlFor(centerKey) : src

  const [tilt, setTilt] = useState({ rx: 0, ry: 0 })

  useEffect(() => {
    if (reducedMotion || !showRing) {
      setRingDrawn(true)
      return
    }
    const id = window.requestAnimationFrame(() => setRingDrawn(true))
    return () => window.cancelAnimationFrame(id)
  }, [reducedMotion, showRing])

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

    const paintDirection = (resolved) => {
      const layers = layerRefs.current
      Object.entries(layers).forEach(([key, el]) => {
        if (!el) return
        el.style.opacity = key === resolved ? '1' : '0'
      })
      directionRef.current = resolved
    }

    const setDirection = (next) => {
      if (!useSprites) return
      const list = availableRef.current
      const resolved = list.includes(next)
        ? next
        : list.includes('center')
          ? 'center'
          : list[0]
      if (!resolved || resolved === directionRef.current) return

      const nextImg = layerRefs.current[resolved]
      const show = () => paintDirection(resolved)

      if (isImageReady(nextImg)) {
        show()
        return
      }

      // Garde l’image actuelle visible tant que la suivante n’est pas décodée
      const reveal = () => {
        if (isImageReady(nextImg)) show()
      }
      if (nextImg?.decode) {
        nextImg.decode().then(show).catch(reveal)
      } else if (nextImg) {
        nextImg.addEventListener('load', reveal, { once: true })
      }
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

  const ringC = 2 * Math.PI * 47

  return (
    <div
      ref={wrapRef}
      className={`relative inline-block mb-5 select-none ${showRing ? 'p-[3px]' : ''}`}
      style={{ perspective: useSprites ? undefined : 520 }}
    >
      {showRing && (
        <svg
          className="absolute inset-0 pointer-events-none"
          viewBox="0 0 100 100"
          aria-hidden="true"
          style={{ transform: 'rotate(-90deg)' }}
        >
          <defs>
            <linearGradient id="avatar-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f09433" />
              <stop offset="25%" stopColor="#e6683c" />
              <stop offset="50%" stopColor="#dc2743" />
              <stop offset="75%" stopColor="#cc2366" />
              <stop offset="100%" stopColor="#bc1888" />
            </linearGradient>
          </defs>
          <circle
            cx="50"
            cy="50"
            r="47"
            fill="none"
            stroke="url(#avatar-ring-gradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={ringC}
            strokeDashoffset={ringDrawn ? 0 : ringC}
            style={{
              transition: reducedMotion ? undefined : 'stroke-dashoffset 1.4s ease-out',
            }}
          />
        </svg>
      )}

      <div
        className="rounded-full overflow-hidden"
        style={{
          ...tiltStyle,
          padding: showRing ? 2 : 0,
          backgroundImage: `url(${centerUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: objectPosition,
        }}
      >
        <div className="relative overflow-hidden rounded-full" style={{ width: size, height: size }}>
          {useSprites ? (
            available.map((d) => (
              <img
                key={d}
                ref={(el) => {
                  if (el) layerRefs.current[d] = el
                  else delete layerRefs.current[d]
                }}
                src={urlFor(d)}
                alt={d === centerKey ? alt : ''}
                aria-hidden={d === centerKey ? undefined : true}
                width={size * 2}
                height={size * 2}
                decoding="async"
                fetchPriority={d === centerKey ? 'high' : 'low'}
                draggable={false}
                style={{
                  ...imgStyle,
                  position: 'absolute',
                  inset: 0,
                  opacity: d === centerKey ? 1 : 0,
                }}
              />
            ))
          ) : (
            <img
              ref={imgRef}
              src={src}
              alt={alt}
              width={size * 2}
              height={size * 2}
              decoding="async"
              fetchPriority="high"
              draggable={false}
              style={imgStyle}
            />
          )}
        </div>
      </div>
    </div>
  )
}
