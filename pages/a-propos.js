import Link from 'next/link'
import SEOHead from '../components/seo/SEOHead'
import StructuredData from '../components/seo/StructuredData'
import { generatePageSEO } from '../lib/seo'
import { siteConfig } from '../lib/config'

export default function About() {
  const pageSEO = generatePageSEO({
    title: siteConfig.seo.pages.aPropos.title,
    description: siteConfig.seo.pages.aPropos.description,
    path: '/a-propos',
    keywords: siteConfig.seo.pages.aPropos.keywords
  })

  return (
    <>
      <SEOHead {...pageSEO} />
      <StructuredData type="Person" data={{
        name: siteConfig.author,
        description: siteConfig.seo.pages.aPropos.description,
        url: `${siteConfig.url}/a-propos`
      }} />
      <main className="flex-auto min-w-0 mt-6 flex flex-col">
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <h1 className="font-semibold text-2xl mb-8 tracking-tighter">À propos</h1>
          
          <p className="mb-8 text-neutral-900 dark:text-neutral-100 tracking-tight">
            Je suis <strong>Corentin Robert</strong>, consultant freelance spécialisé en <strong>scraping</strong> et <strong>automatisation</strong>. J'aide les entreprises à transformer des données web en insights actionnables avec des solutions sur-mesure — code, low-code, ou no-code.
          </p>
          
          <p className="mb-8 text-neutral-600 dark:text-neutral-400 tracking-tight">
            J'ai travaillé avec des entreprises tech comme <a href="https://www.airbnb.fr" target="_blank" rel="noopener noreferrer" className="text-neutral-900 dark:text-neutral-100 hover:underline">Airbnb</a> et <a href="https://www.shine.fr" target="_blank" rel="noopener noreferrer" className="text-neutral-900 dark:text-neutral-100 hover:underline">Shine</a>, et j'ai co-fondé plusieurs projets dont <a href="https://logement-atypique.fr" target="_blank" rel="noopener noreferrer" className="text-neutral-900 dark:text-neutral-100 hover:underline">Logement Atypique</a> — une plateforme qui donne de la visibilité aux propriétaires de logements exceptionnels.
          </p>

          <p className="mb-12 text-neutral-600 dark:text-neutral-400 tracking-tight">
            J'aimerais échanger avec vous — <a href="mailto:hello@corentinrobert.fr" className="text-neutral-900 dark:text-neutral-100 hover:underline">hello@corentinrobert.fr</a>.
          </p>

          <div className="lg:mt-[200px]"></div>

          <h2 id="experience" className="font-semibold text-xl mb-6 tracking-tighter">Expérience Professionnelle</h2>
          <ul className="list-none space-y-4 mb-12">
            <li>
              <a href="https://www.malt.fr/profile/growth" target="_blank" rel="noopener noreferrer" className="text-neutral-900 dark:text-neutral-100 hover:underline">
                <strong>Freelance</strong>
              </a> (2020&thinsp;–&thinsp;present) : Consultant en scraping et automatisation. <strong>167 projets réalisés</strong> sur Malt, <strong>20 scrapers publics</strong> sur Apify avec <strong>154 utilisateurs actifs</strong> et <strong>97.3% de taux de succès</strong>.
            </li>
            <li>
              <a href="https://www.airbnb.fr" target="_blank" rel="noopener noreferrer" className="text-neutral-900 dark:text-neutral-100 hover:underline">
                <strong>Airbnb</strong>
              </a> (2020) : Développeur — Contribution à la plateforme et développement de fonctionnalités.
            </li>
            <li>
              <a href="https://www.shine.fr" target="_blank" rel="noopener noreferrer" className="text-neutral-900 dark:text-neutral-100 hover:underline">
                <strong>Shine</strong>
              </a> (2021) : Lead Developer — Développement d'applications web et architecture technique.
            </li>
            <li>
              <strong>White Bird</strong> (2022) : CTO — Direction technique et développement produit.
            </li>
          </ul>

          <h2 id="projets" className="font-semibold text-xl mb-6 tracking-tighter">Projets</h2>
          <ul className="list-none space-y-4 mb-12">
            <li>
              <a href="https://logement-atypique.fr" target="_blank" rel="noopener noreferrer" className="text-neutral-900 dark:text-neutral-100 hover:underline">
                <strong>Logement Atypique</strong>
              </a> (2024&thinsp;–&thinsp;present) : Plateforme de logements exceptionnels — développé avec mon frère.
            </li>
            <li>
              <a href="https://apify.com/corent1robert" target="_blank" rel="noopener noreferrer" className="text-neutral-900 dark:text-neutral-100 hover:underline">
                <strong>Contributeurs Apify</strong>
              </a> (2024&thinsp;–&thinsp;present) : 20 scrapers publics, 154 utilisateurs, 97.3% de succès.
            </li>
            <li>
              <a href="https://www.outreacher.fr" target="_blank" rel="noopener noreferrer" className="text-neutral-900 dark:text-neutral-100 hover:underline">
                <strong>Outreacher</strong>
              </a> (2023&thinsp;–&thinsp;present) : Agence d'outbound marketing — prospection automatisée pour mes clients.
            </li>
            <li>
              <a href="https://datareacher.webflow.io" target="_blank" rel="noopener noreferrer" className="text-neutral-900 dark:text-neutral-100 hover:underline">
                <strong>Datareacher</strong>
              </a> : Mise à disposition de bases de données.
            </li>
            <li>
              <strong>Immoreacher</strong> : Agence de création de contenus pour les agences immobilières.
            </li>
            <li>
              <strong>Rare Item Club</strong> (2022, arrêté) : E-commerce sneakers d'occasion.
            </li>
            <li>
              <strong>InstaNinja</strong> (2019, arrêté) : Automatisation de compte Instagram.
            </li>
          </ul>

          <h2 id="echecs" className="font-semibold text-xl mb-6 tracking-tighter">Échecs et Apprentissages</h2>
          <p className="mb-4 text-neutral-600 dark:text-neutral-400 tracking-tight">
            Sur tous les projets que j'ai lancés, seuls quelques-uns ont réellement fonctionné. <strong>Plus de 95% de tout ce que j'ai fait a échoué</strong>. Mon taux de réussite est d'environ ~5%.
          </p>
          <p className="mb-4 text-neutral-600 dark:text-neutral-400 tracking-tight">
            <strong>Rare Item Club</strong> (2022) : Tentative de créer un marketplace de sneakers d'occasion. Échec après 6 mois — marché saturé, difficultés de logistique, manque de différenciation. <strong>Apprentissage</strong> : Valider le marché avant de construire, et s'assurer d'avoir un avantage concurrentiel clair.
          </p>
          <p className="mb-4 text-neutral-600 dark:text-neutral-400 tracking-tight">
            <strong>InstaNinja</strong> (2019) : Outil d'automatisation Instagram. Arrêté après que les politiques d'Instagram aient changé. <strong>Apprentissage</strong> : Ne pas construire sur des plateformes dont on ne contrôle pas les règles. Privilégier les solutions durables.
          </p>
          <p className="mb-12 text-neutral-600 dark:text-neutral-400 tracking-tight">
            Ces échecs m'ont appris à <strong>valider rapidement</strong>, à <strong>itérer sur ce qui fonctionne</strong>, et à <strong>abandonner rapidement ce qui ne marche pas</strong>. Aujourd'hui, je me concentre sur des projets avec un modèle économique clair dès le départ.
          </p>

          <h2 id="stack" className="font-semibold text-xl mb-6 tracking-tighter">Stack Technique</h2>
          <ul className="list-none space-y-2 mb-12">
            <li><strong>Langages</strong> : JavaScript, TypeScript, Python, Node.js</li>
            <li><strong>Frameworks</strong> : Next.js, React, Express</li>
            <li><strong>Scraping</strong> : Puppeteer, Playwright, Cheerio, Apify</li>
            <li><strong>Bases de données</strong> : PostgreSQL, MongoDB, Redis</li>
            <li><strong>Cloud & DevOps</strong> : Vercel, AWS, Docker</li>
            <li><strong>Outils</strong> : Notion API, Zapier, Make (ex-Integromat)</li>
          </ul>

          <h2 id="temoignages" className="font-semibold text-xl mb-6 tracking-tighter">Témoignages</h2>
          <ul className="list-none space-y-6 mb-12">
            <li>
              <p className="mb-2 text-neutral-600 dark:text-neutral-400 italic">
                "Corentin a su comprendre rapidement mes besoins et proposer des solutions adaptées. Il a parfaitement répondu à mes attentes, je le recommande sans hésiter."
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-500">— Nicolas, Gurubay</p>
            </li>
            <li>
              <p className="mb-2 text-neutral-600 dark:text-neutral-400 italic">
                "Très professionnel dans les échanges et a respecté à la fois la demande et les délais. Corentin a aussi été très clair sur ce qu'il allait faire dès le départ, évitant les déceptions ou mauvaises surprises. Je recommande."
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-500">— Denis, Inovesta</p>
            </li>
            <li>
              <p className="mb-2 text-neutral-600 dark:text-neutral-400 italic">
                "Corentin est très pro. Il connait son métier, est de très bon conseils, et force de proposition."
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-500">— Charlotte, Agence Canopée</p>
            </li>
            <li>
              <p className="mb-2 text-neutral-600 dark:text-neutral-400 italic">
                "Prestation 100% conforme. Bonne communication. Travail très pro."
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-500">— Yanis, Sportintech</p>
            </li>
          </ul>

          <h2 id="formation" className="font-semibold text-xl mb-6 tracking-tighter">Formation</h2>
          <ul className="list-none space-y-4 mb-12">
            <li>
              <strong>HETIC</strong> (2015&thinsp;–&thinsp;2018) : Formation en développement web et entrepreneuriat.
            </li>
          </ul>

          <h2 id="interets" className="font-semibold text-xl mb-6 tracking-tighter">Intérêts</h2>
          <ul className="list-none space-y-2 mb-12">
            <li>Entrepreneuriat et création de produits</li>
            <li>Scraping et automatisation</li>
            <li>Growth hacking et outbound marketing</li>
          </ul>
        </div>
      </main>
    </>
  )
}
