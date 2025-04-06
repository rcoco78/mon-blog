import Head from 'next/head'

export default function Contact() {
  return (
    <>
      <Head>
        <title>Contact - Corentin Robert</title>
        <meta name="description" content="Réservez un créneau pour discuter de vos projets avec Corentin Robert." />
      </Head>

      <div className="flex-auto min-w-0 mt-6 flex flex-col">
        <header className="mb-9 space-y-1">
          <h1 className="font-semibold text-2xl mb-2 tracking-tighter">Contact</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Réservez un créneau pour discuter de vos projets.
          </p>
        </header>

        <div className="h-[600px] rounded-lg overflow-hidden">
          <iframe
            src="https://calendly.com/corentinrobert/20min?embed_type=Inline&hide_event_type_details=1&hide_gdpr_banner=1&hide_cookie_banner=1"
            width="100%"
            height="100%"
            frameBorder="0"
            title="Calendly Scheduling"
          />
        </div>
      </div>
    </>
  )
} 