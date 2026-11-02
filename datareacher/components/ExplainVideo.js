import { EXPLAIN_VIDEO } from '@/lib/site'

export default function ExplainVideo() {
  return (
    <div className="relative aspect-video w-full overflow-hidden border border-line bg-ink">
      <iframe
        src={`${EXPLAIN_VIDEO.embedUrl}?seo=true&videoFoam=true`}
        title={EXPLAIN_VIDEO.title}
        allow="autoplay; fullscreen"
        allowFullScreen
        className="absolute inset-0 h-full w-full"
      />
    </div>
  )
}
