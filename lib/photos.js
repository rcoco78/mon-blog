// Photos personnelles organisées par mois/année
// Format inspiré de photos.ben.page
//
// Pour ajouter tes photos :
// 1. Dépose tes fichiers dans public/images/photos/ (jpg, png, webp)
// 2. Ajoute une entrée ici pour chaque photo :
//    { date: 'YYYY-MM-DD', src: '/images/photos/nom-fichier.jpg', alt: '...', location: '...' (optionnel) }
//
export const photos = [
  {
    date: '2026-01-01',
    src: '/images/photos/1 Janv 2026 - Cabaret Sauvage.jpeg',
    alt: 'Cabaret Sauvage',
    location: 'Paris'
  },
  {
    date: '2026-01-02',
    src: '/images/photos/Asnières 2 Janvier 2026.JPG',
    alt: 'Asnières',
    location: 'Asnières-sur-Seine'
  },
  {
    date: '2026-01-15',
    src: '/images/photos/Asnières Janvier 2026.JPG',
    alt: 'Asnières',
    location: 'Asnières-sur-Seine'
  },
  {
    date: '2026-02-01',
    src: '/images/photos/Ajaccio Fev 2026.jpeg',
    alt: 'Ajaccio',
    location: 'Ajaccio, Corse'
  },
  {
    date: '2026-02-15',
    src: '/images/photos/Les Arcs Fev 2026.JPG',
    alt: 'Les Arcs',
    location: 'Les Arcs, Savoie'
  },
]

// Fonction pour grouper les photos par mois/année
export function getPhotosByMonth() {
  const grouped = {}
  
  photos.forEach(photo => {
    const date = new Date(photo.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const monthName = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    
    if (!grouped[monthKey]) {
      grouped[monthKey] = {
        month: monthName,
        year: date.getFullYear(),
        monthNumber: date.getMonth() + 1,
        photos: []
      }
    }
    
    grouped[monthKey].photos.push(photo)
  })
  
  // Trier par date décroissante (plus récent en premier)
  return Object.values(grouped).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return b.monthNumber - a.monthNumber
  })
}
