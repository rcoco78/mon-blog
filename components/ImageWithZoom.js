import Image from 'next/image'
import { useState } from 'react'

export default function ImageWithZoom({ src, alt }) {
  const [isZoomed, setIsZoomed] = useState(false)

  return (
    <>
      <div className="relative my-8 cursor-zoom-in" onClick={() => setIsZoomed(true)}>
        <div className="relative w-full aspect-video">
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover rounded-lg"
            quality={90}
            loading="lazy"
          />
        </div>
      </div>

      {isZoomed && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
          onClick={() => setIsZoomed(false)}
        >
          <div className="relative w-[90vw] h-[90vh]">
            <Image
              src={src}
              alt={alt}
              fill
              className="object-contain"
              quality={100}
            />
          </div>
          <button
            className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2"
            onClick={(e) => {
              e.stopPropagation()
              setIsZoomed(false)
            }}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}
    </>
  )
} 