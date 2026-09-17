import { FAQS } from '@/lib/site'

export default function FaqList() {
  return (
    <div className="divide-y divide-line border-y border-line">
      {FAQS.map((item) => (
        <details key={item.q} className="group py-5">
          <summary className="cursor-pointer list-none font-display text-xl text-ink [&::-webkit-details-marker]:hidden">
            <span className="flex items-baseline justify-between gap-6">
              {item.q}
              <span className="text-mute group-open:hidden">+</span>
              <span className="hidden text-mute group-open:inline">−</span>
            </span>
          </summary>
          <p className="mt-3 max-w-2xl text-mute">{item.a}</p>
        </details>
      ))}
    </div>
  )
}
