import { useState } from 'react'
import Link from 'next/link'
import SEOHead from '../../components/seo/SEOHead'
import StructuredData from '../../components/seo/StructuredData'
import { generatePageSEO } from '../../lib/seo'
import { siteConfig } from '../../lib/config'

export default function EmailGenerator() {
  const [formData, setFormData] = useState({
    recipientName: '',
    companyName: '',
    industry: '',
    painPoint: '',
    solution: '',
    callToAction: ''
  })

  const [generatedEmail, setGeneratedEmail] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const generateEmail = () => {
    setIsGenerating(true)
    
    // Simulation d'un délai de génération
    setTimeout(() => {
      const template = `
Bonjour ${formData.recipientName},

J'ai remarqué que ${formData.companyName} évolue dans le secteur ${formData.industry} et je pense que vous pourriez être intéressé par ce que j'ai à vous proposer.

Je vois que vous faites face à ${formData.painPoint}, ce qui est un défi courant dans votre industrie.

${formData.solution}

${formData.callToAction}

Cordialement,
Corentin Robert
      `
      setGeneratedEmail(template)
      setIsGenerating(false)
    }, 1500)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedEmail)
  }

  const pageSEO = generatePageSEO({
    title: 'Générateur de Templates d\'Emails Gratuit - Outil Outreach',
    description: 'Générateur de templates d\'emails gratuit pour l\'outreach. Créez des emails performants et personnalisés en quelques clics. Augmentez vos taux de réponse avec cet outil gratuit.',
    path: '/outils/email-generator',
    keywords: ['générateur templates email', 'outil outreach gratuit', 'email generator', 'templates email outreach']
  })

  const toolStructuredData = {
    name: 'Générateur de Templates d\'Emails',
    applicationCategory: 'BusinessApplication',
    price: '0',
    priceCurrency: 'EUR',
    description: 'Créez des templates d\'outreach performants avec notre outil gratuit. Personnalisez vos messages et augmentez vos taux de réponse.',
    url: `${siteConfig.url}/outils/email-generator`,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150'
    }
  }

  return (
    <>
      <SEOHead {...pageSEO} />
      <StructuredData type="SoftwareApplication" data={toolStructuredData} />
    <main className="min-w-0 mt-6 flex flex-col">
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/outils" className="text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200">
            ← Retour aux outils
          </Link>
        </div>
        <h1 className="font-semibold text-2xl mb-4 tracking-tighter">Générateur de Templates d'Emails</h1>
        <p className="mb-8 text-neutral-900 dark:text-neutral-100 tracking-tight">
          Créez des templates d'outreach performants en quelques clics. Personnalisez vos messages et augmentez vos taux de réponse.
        </p>
      </section>

      <section className="mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h2 className="font-semibold text-xl tracking-tighter">Personnalisez votre template</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="recipientName" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Nom du destinataire
                </label>
                <input
                  type="text"
                  id="recipientName"
                  name="recipientName"
                  value={formData.recipientName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-md border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors bg-transparent"
                  placeholder="Ex: Jean Dupont"
                />
              </div>
              
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Nom de l'entreprise
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-md border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors bg-transparent"
                  placeholder="Ex: TechCorp"
                />
              </div>
              
              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Secteur d'activité
                </label>
                <input
                  type="text"
                  id="industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-md border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors bg-transparent"
                  placeholder="Ex: immobilier de luxe"
                />
              </div>
              
              <div>
                <label htmlFor="painPoint" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Point de douleur
                </label>
                <textarea
                  id="painPoint"
                  name="painPoint"
                  value={formData.painPoint}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 rounded-md border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors bg-transparent"
                  placeholder="Ex: la difficulté à trouver des clients qualifiés"
                />
              </div>
              
              <div>
                <label htmlFor="solution" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Votre solution
                </label>
                <textarea
                  id="solution"
                  name="solution"
                  value={formData.solution}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 rounded-md border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors bg-transparent"
                  placeholder="Ex: J'ai développé un outil qui permet d'automatiser la prospection et d'augmenter le taux de conversion de 40%"
                />
              </div>
              
              <div>
                <label htmlFor="callToAction" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Appel à l'action
                </label>
                <textarea
                  id="callToAction"
                  name="callToAction"
                  value={formData.callToAction}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2 rounded-md border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors bg-transparent"
                  placeholder="Ex: Seriez-vous disponible pour un appel de 15 minutes cette semaine pour discuter de comment nous pourrions vous aider ?"
                />
              </div>
              
              <button
                onClick={generateEmail}
                disabled={isGenerating}
                className="w-full px-6 py-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? 'Génération en cours...' : 'Générer mon email'}
              </button>
            </div>
          </div>
          
          <div className="space-y-6">
            <h2 className="font-semibold text-xl tracking-tighter">Votre email généré</h2>
            
            <div className="relative">
              <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 min-h-[400px] whitespace-pre-line">
                {generatedEmail || 'Votre email apparaîtra ici après génération...'}
              </div>
              
              {generatedEmail && (
                <button
                  onClick={copyToClipboard}
                  className="absolute top-4 right-4 px-3 py-1 text-xs bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
                >
                  Copier
                </button>
              )}
            </div>
            
            <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
              <h3 className="font-medium mb-2">Conseils pour un email performant</h3>
              <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-2">
                <li>• Personnalisez chaque email pour augmenter votre taux de réponse</li>
                <li>• Restez concis et direct dans votre message</li>
                <li>• Mettez en avant la valeur que vous apportez</li>
                <li>• Incluez un appel à l'action clair et spécifique</li>
                <li>• Testez différentes versions pour optimiser vos résultats</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      
      <section className="mb-16">
        <h2 className="font-semibold text-xl mb-6 tracking-tighter">Vous souhaitez plus de fonctionnalités ?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <h3 className="font-medium mb-2">Version Pro</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              Accédez à des templates avancés, des analyses de performance et une personnalisation illimitée.
            </p>
            <a
              href="/contact"
              className="inline-block px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors text-sm"
            >
              En savoir plus
            </a>
          </div>
          
          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <h3 className="font-medium mb-2">Formation Outreach</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              Apprenez les meilleures pratiques d'outreach avec notre formation complète.
            </p>
            <a
              href="/contact"
              className="inline-block px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors text-sm"
            >
              Découvrir
            </a>
          </div>
          
          <div className="p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <h3 className="font-medium mb-2">Coaching Personnalisé</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              Bénéficiez d'un accompagnement sur mesure pour optimiser votre stratégie d'outreach.
            </p>
            <a
              href="/contact"
              className="inline-block px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors text-sm"
            >
              Réserver
            </a>
          </div>
        </div>
      </section>
    </main>
    </>
  )
} 