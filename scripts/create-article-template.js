#!/usr/bin/env node

/**
 * Script pour créer un template d'article dans Notion
 * 
 * Usage:
 *   node scripts/create-article-template.js "Titre de l'article" --type mission
 *   node scripts/create-article-template.js "Titre de l'article" --type weekly
 *   node scripts/create-article-template.js "Titre de l'article" --type spontaneous
 * 
 * Types:
 *   - mission: Article court après une mission
 *   - weekly: Article réflexion hebdomadaire
 *   - spontaneous: Article spontané
 */

const { Client } = require('@notionhq/client')
// Charger les variables d'environnement depuis .env.local
try {
  const fs = require('fs')
  const path = require('path')
  const envPath = path.join(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8')
    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/)
      if (match) {
        process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '')
      }
    })
  }
} catch (e) {
  // Si .env.local n'existe pas, utiliser les variables d'environnement système
}

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

const databaseId = process.env.NOTION_DATABASE_ID

// Templates de contenu selon le type
const templates = {
  mission: {
    title: '[Technique/Solution] : [Résultat obtenu]',
    content: `# [Titre]

[Intro : Hook personnel - 2-3 phrases]
Exemple : "La semaine dernière, un client m'a demandé d'extraire 10 000 profils LinkedIn. En 2h, c'était fait. Voici comment."

## Le problème du client

[Description du besoin / problème rencontré]

## Ma solution technique

[Approche choisie, outils utilisés - léger, pas trop technique]

## Le résultat

[Ce qui a été livré, impact pour le client]

## Ce que j'ai appris

[Leçons tirées, erreurs évitées, optimisations]

## Application pour d'autres cas

[Comment cette solution peut être réutilisée]

---

*Article publié le ${new Date().toLocaleDateString('fr-FR')}*`,
    tags: ['scraping', 'cas-d-usage', 'technique', 'mission'],
    metaDescription: 'Découvrez comment j\'ai résolu [problème] pour un client en utilisant [technique]. Cas d\'usage concret et leçons apprises.'
  },
  weekly: {
    title: '[Sujet] : [Angle personnel]',
    content: `# [Titre]

[Intro : Le déclic / l'observation de la semaine]
Exemple : "Cette semaine, j'ai réalisé quelque chose qui change ma façon de travailler..."

## Pourquoi c'est important

[Le contexte, pourquoi ce sujet mérite réflexion]

## Mon expérience personnelle

[Ce que j'ai vécu, testé, observé]

## Ce que ça change

[Impact sur mon travail, mes clients, ma vision]

## Question ouverte

[Invitation à la réflexion pour le lecteur]

---

*Article publié le ${new Date().toLocaleDateString('fr-FR')}*`,
    tags: ['réflexion', 'entrepreneuriat', 'processus', 'apprentissage'],
    metaDescription: 'Réflexion sur [sujet] : mon expérience et ce que j\'ai appris cette semaine.'
  },
  spontaneous: {
    title: '[Sujet] : [Ton angle]',
    content: `# [Titre]

[Intro : Ce qui t'a inspiré, l'étincelle]
Exemple : "Hier, en discutant avec un ami, j'ai réalisé que..."

## Le contexte

[Pourquoi tu partages ça maintenant]

## Mon point de vue

[Ta réflexion, ton expérience, tes découvertes]

## Pourquoi c'est important pour moi

[Ce que ça représente dans ton parcours]

## Et toi ?

[Ouverture au lecteur]

---

*Article publié le ${new Date().toLocaleDateString('fr-FR')}*`,
    tags: ['introspection', 'réflexion', 'apprentissage'],
    metaDescription: '[Sujet] : une réflexion personnelle sur [thème].'
  }
}

async function createArticleTemplate(title, type = 'spontaneous') {
  if (!databaseId) {
    console.error('❌ NOTION_DATABASE_ID n\'est pas défini dans .env.local')
    process.exit(1)
  }

  if (!notion) {
    console.error('❌ NOTION_TOKEN n\'est pas défini dans .env.local')
    process.exit(1)
  }

  const template = templates[type] || templates.spontaneous

  try {
    // Créer la page dans Notion
    const response = await notion.pages.create({
      parent: {
        database_id: databaseId,
      },
      properties: {
        Title: {
          title: [
            {
              text: {
                content: title || template.title,
              },
            },
          ],
        },
        Date: {
          date: {
            start: new Date().toISOString().split('T')[0],
          },
        },
        Tags: {
          multi_select: template.tags.map(tag => ({ name: tag })),
        },
        'Meta Description': {
          rich_text: [
            {
              text: {
                content: template.metaDescription,
              },
            },
          ],
        },
      },
    })

    // Ajouter le contenu template
    const contentBlocks = template.content.split('\n\n').map(paragraph => {
      if (paragraph.startsWith('#')) {
        // Titre
        const level = (paragraph.match(/^#+/)[0].length)
        return {
          object: 'block',
          type: `heading_${level}`,
          [`heading_${level}`]: {
            rich_text: [
              {
                text: {
                  content: paragraph.replace(/^#+\s*/, ''),
                },
              },
            ],
          },
        }
      } else if (paragraph.startsWith('##')) {
        // Sous-titre
        return {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [
              {
                text: {
                  content: paragraph.replace(/^##\s*/, ''),
                },
              },
            ],
          },
        }
      } else if (paragraph.startsWith('---')) {
        // Séparateur
        return {
          object: 'block',
          type: 'divider',
          divider: {},
        }
      } else if (paragraph.startsWith('*') && paragraph.endsWith('*')) {
        // Italique
        return {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                text: {
                  content: paragraph.replace(/\*/g, ''),
                },
                annotations: {
                  italic: true,
                },
              },
            ],
          },
        }
      } else {
        // Paragraphe normal
        return {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                text: {
                  content: paragraph,
                },
              },
            ],
          },
        }
      }
    })

    // Ajouter les blocs de contenu
    await notion.blocks.children.append({
      block_id: response.id,
      children: contentBlocks,
    })

    console.log('✅ Article template créé dans Notion !')
    console.log(`📝 Titre : ${title || template.title}`)
    console.log(`🏷️  Tags : ${template.tags.join(', ')}`)
    console.log(`🔗 Lien : ${response.url}`)
    console.log('\n💡 Tu peux maintenant éditer l\'article dans Notion et le publier !')

    return response
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'article :', error.message)
    if (error.message.includes('API token')) {
      console.error('💡 Vérifie que NOTION_TOKEN est correct dans .env.local')
    }
    if (error.message.includes('database')) {
      console.error('💡 Vérifie que NOTION_DATABASE_ID est correct dans .env.local')
    }
    process.exit(1)
  }
}

// Récupérer les arguments
const args = process.argv.slice(2)
const title = args.find(arg => !arg.startsWith('--'))
const typeArg = args.find(arg => arg.startsWith('--type'))
const type = typeArg ? typeArg.split('=')[1] || 'spontaneous' : 'spontaneous'

if (!title && !typeArg) {
  console.log(`
📝 Créer un template d'article dans Notion

Usage:
  node scripts/create-article-template.js "Titre de l'article" --type=mission
  node scripts/create-article-template.js "Titre de l'article" --type=weekly
  node scripts/create-article-template.js "Titre de l'article" --type=spontaneous

Types disponibles:
  - mission    : Article court après une mission (tags: scraping, cas-d-usage, technique, mission)
  - weekly      : Article réflexion hebdomadaire (tags: réflexion, entrepreneuriat, processus, apprentissage)
  - spontaneous : Article spontané (tags: introspection, réflexion, apprentissage)

Exemples:
  node scripts/create-article-template.js "Scraping LinkedIn : Comment j'ai extrait 5000 profils" --type=mission
  node scripts/create-article-template.js "Pourquoi j'ai arrêté de promettre des délais fixes" --type=weekly
  node scripts/create-article-template.js "Cette API que j'utilise maintenant partout" --type=spontaneous
`)
  process.exit(0)
}

createArticleTemplate(title, type)

