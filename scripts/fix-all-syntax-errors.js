#!/usr/bin/env node

/**
 * Script pour corriger TOUTES les erreurs de syntaxe dans case-studies-personalized.js
 * Corrige :
 * - Les chaînes non fermées
 * - Les apostrophes non échappées
 * - La fonction getPersonalizedData mal placée
 * - Les structures de tableaux cassées
 */

const fs = require('fs')
const path = require('path')

const PERSONALIZED_FILE = path.join(__dirname, '../lib/case-studies-personalized.js')

function fixAllErrors(content) {
  let fixed = content
  let changes = 0
  
  // 1. Retirer la fonction getPersonalizedData du milieu du fichier
  // Elle doit être uniquement à la fin
  const functionPattern = /\/\/ Fonction helper pour récupérer les données personnalisées d'un cas d'usage\nexport function getPersonalizedData\(slug\) \{\s*return personalizedCaseStudies\[slug\] \|\| null\s*\}\s*\n\s*'([^']+)':/g
  
  fixed = fixed.replace(functionPattern, (match, slug) => {
    changes++
    return `  '${slug}':`
  })
  
  // 2. Corriger les chaînes non fermées dans sampleRows
  // Pattern: ['...' suivi d'un saut de ligne sans fermeture
  const unclosedRowPattern = /(\['[^']*)\n(\s*\/\/|export|'[^']+':)/g
  fixed = fixed.replace(unclosedRowPattern, (match, start, next) => {
    // Si la ligne suivante n'est pas une continuation de tableau, fermer la ligne
    if (next.includes('export') || next.includes("':")) {
      changes++
      // Essayer de deviner les colonnes manquantes
      const cols = start.match(/'/g)?.length || 1
      const missingCols = 4 - cols + 1 // Généralement 4 colonnes
      let closed = start
      for (let i = 0; i < missingCols; i++) {
        closed += ", 'Données'"
      }
      return closed + "']\n        ],\n      },\n      hasContactData: false,\n      videoUrl: null,\n      videoThumbnail: null\n    },\n" + next
    }
    return match
  })
  
  // 3. Corriger les structures où getPersonalizedData est au milieu
  // Chercher: return personalizedCaseStudies[slug] || null suivi d'un slug
  fixed = fixed.replace(/return personalizedCaseStudies\[slug\] \|\| null\s*\n\s*'([^']+)':/g, (match, slug) => {
    changes++
    return `}\n\n// Fonction helper pour récupérer les données personnalisées d'un cas d'usage\nexport function getPersonalizedData(slug) {\n  return personalizedCaseStudies[slug] || null\n}\n\n  '${slug}':`
  })
  
  // 4. S'assurer que getPersonalizedData est à la fin
  // Si elle n'est pas à la fin, l'ajouter
  if (!fixed.includes('export function getPersonalizedData')) {
    // Chercher la fin du fichier (dernière accolade)
    fixed = fixed.replace(/\n\}$/, `\n}\n\n// Fonction helper pour récupérer les données personnalisées d'un cas d'usage\nexport function getPersonalizedData(slug) {\n  return personalizedCaseStudies[slug] || null\n}\n`)
    changes++
  } else {
    // Vérifier qu'elle est bien à la fin
    const funcIndex = fixed.lastIndexOf('export function getPersonalizedData')
    const lastBrace = fixed.lastIndexOf('}')
    if (funcIndex < lastBrace - 100) {
      // La fonction n'est pas à la fin, la déplacer
      const funcMatch = fixed.match(/\/\/ Fonction helper[^}]+getPersonalizedData\(slug\) \{[^}]+\}/)
      if (funcMatch) {
        const func = funcMatch[0]
        fixed = fixed.replace(func + '\n\n', '')
        fixed = fixed.replace(/\n\}$/, `\n}\n\n${func}\n`)
        changes++
      }
    }
  }
  
  // 5. Corriger les apostrophes non échappées dans les chaînes de texte
  const textProps = ['problemsSolved', 'concreteExamples', 'businessImpact', 'intro']
  textProps.forEach(prop => {
    const regex = new RegExp(`(${prop}:\\s*')([^']*(?:'[^',}]*)*)(')`, 'g')
    fixed = fixed.replace(regex, (match, prefix, content, suffix) => {
      // Échapper les apostrophes sauf celles déjà échappées
      const escaped = content.replace(/(?<!\\)'/g, "\\'")
      if (escaped !== content) {
        changes++
        return prefix + escaped + suffix
      }
      return match
    })
  })
  
  return { content: fixed, changes }
}

function main() {
  console.log('🔧 Correction complète des erreurs de syntaxe...\n')
  
  if (!fs.existsSync(PERSONALIZED_FILE)) {
    console.error('❌ Fichier non trouvé')
    process.exit(1)
  }
  
  const original = fs.readFileSync(PERSONALIZED_FILE, 'utf-8')
  console.log(`📖 Fichier chargé (${(original.length / 1024).toFixed(1)} KB)\n`)
  
  // Backup
  const backup = PERSONALIZED_FILE + '.backup-final'
  fs.writeFileSync(backup, original)
  console.log(`💾 Backup: ${backup}\n`)
  
  // Corriger
  console.log('🔍 Correction en cours...')
  const { content: fixed, changes } = fixAllErrors(original)
  
  if (changes > 0) {
    fs.writeFileSync(PERSONALIZED_FILE, fixed)
    console.log(`✅ ${changes} corrections appliquées\n`)
  }
  
  // Vérifier
  console.log('🔍 Vérification syntaxe...')
  try {
    const tempFile = path.join(__dirname, '../lib/.check-syntax.js')
    const tempContent = fixed
      .replace(/export const personalizedCaseStudies/g, 'const personalizedCaseStudies')
      .replace(/export function getPersonalizedData/g, 'function getPersonalizedData')
      + '\n\nmodule.exports = { personalizedCaseStudies, getPersonalizedData }'
    
    fs.writeFileSync(tempFile, tempContent)
    delete require.cache[require.resolve(tempFile)]
    require(tempFile)
    fs.unlinkSync(tempFile)
    
    console.log('✅ Syntaxe valide !\n')
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    const lineMatch = error.stack?.match(/:(\d+):/)
    if (lineMatch) {
      const lineNum = parseInt(lineMatch[1])
      console.error(`\n📍 Ligne ${lineNum}:`)
      const lines = fixed.split('\n')
      const start = Math.max(0, lineNum - 3)
      const end = Math.min(lines.length, lineNum + 2)
      for (let i = start; i < end; i++) {
        console.error(`${i + 1}: ${lines[i]}`)
      }
    }
    process.exit(1)
  }
}

main()




