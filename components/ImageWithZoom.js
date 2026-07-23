/**
 * Image d'article simple — pas de zoom / lightbox.
 */
export default function ImageWithZoom({ src, alt }) {
  const showCaption =
    alt &&
    alt.trim() &&
    !/^image illustrative/i.test(alt)

  return (
    <figure className="my-8">
      <img
        src={src}
        alt={alt || ''}
        className="w-full h-auto rounded-lg"
        loading="lazy"
      />
      {showCaption ? (
        <figcaption className="mt-2 text-sm text-neutral-500 dark:text-neutral-500">
          {alt}
        </figcaption>
      ) : null}
    </figure>
  )
}
