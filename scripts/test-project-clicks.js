#!/usr/bin/env node

/**
 * Script de test pour simuler des clics sur les projets
 * 
 * Usage:
 *   node scripts/test-project-clicks.js <projectId> [count] [--url <baseUrl>]
 * 
 * Exemples:
 *   node scripts/test-project-clicks.js logement-atypique
 *   node scripts/test-project-clicks.js logement-atypique 5
 *   node scripts/test-project-clicks.js logement-atypique 10 --url https://www.corentinrobert.fr
 *   node scripts/test-project-clicks.js all 3
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

// IDs des projets disponibles
const PROJECT_IDS = [
  'logement-atypique',
  'contributeurs-apify',
  'outreacher',
  'rare-item-club',
  'instaninja'
]

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  red: '\x1b[31m',
  gray: '\x1b[90m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Récupère les compteurs actuels pour tous les projets
 */
async function getCurrentClicks(projectIds) {
  try {
    const url = `${BASE_URL}/api/projects/clicks?projectIds=${projectIds.join(',')}`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    log(`❌ Erreur lors de la récupération des clics: ${error.message}`, 'red')
    return {}
  }
}

/**
 * Simule un clic sur un projet
 */
async function simulateClick(projectId) {
  try {
    const url = `${BASE_URL}/api/projects/click`
    const timestamp = Date.now()
    
    const response = await fetch(`${url}?t=${timestamp}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({ projectId })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }
    
    const data = await response.json()
    
    // Vérifier si l'API retourne une erreur
    if (data.error) {
      log(`  ⚠️  ${projectId}: ${data.error}`, 'yellow')
      if (data.error.includes('Blob not configured')) {
        log(`     💡 Configurez BLOB_READ_WRITE_TOKEN dans .env.local`, 'gray')
        log(`     💡 Récupérez le token depuis: https://vercel.com/dashboard`, 'gray')
      }
    }
    
    return data
  } catch (error) {
    log(`❌ Erreur lors du clic sur ${projectId}: ${error.message}`, 'red')
    throw error
  }
}

/**
 * Affiche les compteurs de manière formatée
 */
function displayClicks(clicks, label = 'Compteurs actuels') {
  log(`\n${label}:`, 'bright')
  log('─'.repeat(50), 'gray')
  
  if (Object.keys(clicks).length === 0) {
    log('  Aucun clic enregistré', 'gray')
    return
  }
  
  Object.entries(clicks)
    .sort((a, b) => b[1] - a[1]) // Trier par nombre de clics décroissant
    .forEach(([projectId, count]) => {
      const padding = ' '.repeat(25 - projectId.length)
      log(`  ${projectId}${padding}${count} clic${count > 1 ? 's' : ''}`, 'blue')
    })
  
  log('─'.repeat(50), 'gray')
}

/**
 * Fonction principale
 */
async function main() {
  const args = process.argv.slice(2)
  
  // Parser les arguments
  let projectId = args[0]
  let count = parseInt(args[1]) || 1
  let baseUrl = BASE_URL
  
  // Vérifier l'option --url
  const urlIndex = args.indexOf('--url')
  if (urlIndex !== -1 && args[urlIndex + 1]) {
    baseUrl = args[urlIndex + 1]
  }
  
  // Validation
  if (!projectId) {
    log('❌ Usage: node scripts/test-project-clicks.js <projectId> [count] [--url <baseUrl>]', 'red')
    log('\nProjets disponibles:', 'yellow')
    PROJECT_IDS.forEach(id => log(`  - ${id}`, 'gray'))
    log('  - all (pour tester tous les projets)', 'gray')
    log('\n💡 Note: Pour tester en local, configurez BLOB_READ_WRITE_TOKEN dans .env.local', 'yellow')
    log('   Récupérez le token depuis: https://vercel.com/dashboard → Settings → Storage → Blob', 'gray')
    process.exit(1)
  }
  
  log(`\n🧪 Test de tracking des clics`, 'bright')
  log(`📍 URL de base: ${baseUrl}`, 'gray')
  log(`🎯 Projet(s): ${projectId === 'all' ? 'tous' : projectId}`, 'gray')
  log(`🔢 Nombre de clics: ${count}`, 'gray')
  
  // Déterminer les projets à tester
  const projectsToTest = projectId === 'all' ? PROJECT_IDS : [projectId]
  
  // Vérifier que les projets existent
  const invalidProjects = projectsToTest.filter(id => !PROJECT_IDS.includes(id))
  if (invalidProjects.length > 0) {
    log(`\n❌ Projets invalides: ${invalidProjects.join(', ')}`, 'red')
    log('Projets disponibles:', 'yellow')
    PROJECT_IDS.forEach(id => log(`  - ${id}`, 'gray'))
    process.exit(1)
  }
  
  // Récupérer les compteurs initiaux
  log('\n📊 Récupération des compteurs initiaux...', 'yellow')
  const initialClicks = await getCurrentClicks(projectsToTest)
  displayClicks(initialClicks, '📊 Compteurs initiaux')
  
  // Simuler les clics
  log(`\n🖱️  Simulation de ${count} clic${count > 1 ? 's' : ''}...`, 'yellow')
  
  const results = []
  const startTime = Date.now()
  
  for (let i = 0; i < count; i++) {
    for (const pid of projectsToTest) {
      try {
        log(`  [${i + 1}/${count}] Clic sur ${pid}...`, 'gray')
        const result = await simulateClick(pid)
        results.push({ projectId: pid, success: true, result })
        
        // Petit délai pour éviter de surcharger l'API
        if (i < count - 1 || pid !== projectsToTest[projectsToTest.length - 1]) {
          await sleep(100) // 100ms entre chaque clic
        }
      } catch (error) {
        results.push({ projectId: pid, success: false, error: error.message })
      }
    }
  }
  
  const duration = Date.now() - startTime
  
  // Afficher les résultats
  const successCount = results.filter(r => r.success).length
  const failCount = results.filter(r => !r.success).length
  
  log(`\n✅ ${successCount} clic${successCount > 1 ? 's' : ''} simulé${successCount > 1 ? 's' : ''} avec succès`, 'green')
  if (failCount > 0) {
    log(`❌ ${failCount} clic${failCount > 1 ? 's' : ''} échoué${failCount > 1 ? 's' : ''}`, 'red')
  }
  log(`⏱️  Durée: ${duration}ms`, 'gray')
  
  // Attendre un peu pour que les données soient synchronisées
  log('\n⏳ Attente de la synchronisation...', 'yellow')
  await sleep(1000)
  
  // Récupérer les compteurs finaux
  log('📊 Récupération des compteurs finaux...', 'yellow')
  const finalClicks = await getCurrentClicks(projectsToTest)
  displayClicks(finalClicks, '📊 Compteurs finaux')
  
  // Calculer les différences
  log('\n📈 Différences:', 'bright')
  log('─'.repeat(50), 'gray')
  
  let totalDiff = 0
  projectsToTest.forEach(pid => {
    const initial = initialClicks[pid] || 0
    const final = finalClicks[pid] || 0
    const diff = final - initial
    
    if (diff > 0) {
      const padding = ' '.repeat(25 - pid.length)
      log(`  ${pid}${padding}+${diff} clic${diff > 1 ? 's' : ''} ${colors.green}✓${colors.reset}`, 'blue')
      totalDiff += diff
    } else if (diff < 0) {
      const padding = ' '.repeat(25 - pid.length)
      log(`  ${pid}${padding}${diff} clic${diff < -1 ? 's' : ''} ${colors.red}✗${colors.reset}`, 'red')
    } else {
      const padding = ' '.repeat(25 - pid.length)
      log(`  ${pid}${padding}Aucun changement ${colors.yellow}⚠${colors.reset}`, 'gray')
    }
  })
  
  log('─'.repeat(50), 'gray')
  log(`  Total: +${totalDiff} clic${totalDiff > 1 ? 's' : ''}`, 'bright')
  
  // Vérification finale
  const expectedClicks = count * projectsToTest.length
  if (totalDiff === expectedClicks) {
    log(`\n✅ Test réussi! Tous les clics ont été enregistrés.`, 'green')
  } else if (totalDiff > 0) {
    log(`\n⚠️  Attention: ${totalDiff} clic${totalDiff > 1 ? 's' : ''} enregistré${totalDiff > 1 ? 's' : ''} sur ${expectedClicks} attendu${expectedClicks > 1 ? 's' : ''}`, 'yellow')
  } else {
    log(`\n❌ Aucun clic n'a été enregistré. Vérifiez la configuration.`, 'red')
  }
  
  log('', 'reset')
}

// Exécuter le script
main().catch(error => {
  log(`\n❌ Erreur fatale: ${error.message}`, 'red')
  console.error(error)
  process.exit(1)
})

