import Newsletter from '../components/Newsletter'

export default function NewsletterPage() {
  return (
    <main className="flex-auto min-w-0 mt-6 flex flex-col">
      <section className="max-w-2xl mx-auto w-full">
        <h1 className="font-semibold text-2xl mb-8 tracking-tighter">Newsletter</h1>
        <div className="prose dark:prose-invert mb-8">
          <p>
            Restez informé de mes derniers articles et découvertes. Je partage régulièrement mes réflexions sur le développement web, 
            mes expériences de voyage et mes découvertes technologiques.
          </p>
          <p>
            En vous inscrivant, vous recevrez un email à chaque nouvelle publication, sans spam, et vous pourrez vous désinscrire à tout moment.
          </p>
        </div>
        <Newsletter />
      </section>
    </main>
  )
} 