export default function PersonalVideo({ title = "Un mot de Corentin" }) {
  return (
    <div className="mb-8">
      <div className="relative rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
          <iframe 
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
            src="https://www.tella.tv/video/vid_cmk2d068v00xf04k15y3y0vaf/embed?b=1&title=1&a=1&loop=0&t=0&muted=0&wt=0"
            allowFullScreen
            allowTransparency
            title={title}
          />
        </div>
      </div>
      {title && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-3 text-center">
          {title}
        </p>
      )}
    </div>
  )
}

