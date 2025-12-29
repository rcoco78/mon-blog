// Photos personnelles organisées par mois/année
// Format inspiré de photos.ben.page
export const photos = [
  // Photos Unsplash pour test - à remplacer par vos vraies photos
  {
    date: '2025-01-15',
    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    alt: 'Paysage montagneux',
    location: 'Alpes, France'
  },
  {
    date: '2025-01-10',
    src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80',
    alt: 'Forêt en automne',
    location: 'Normandie, France'
  },
  {
    date: '2025-01-05',
    src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    alt: 'Plage tropicale',
    location: 'Bretagne, France'
  },
  {
    date: '2024-12-20',
    src: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80',
    alt: 'Coucher de soleil',
    location: 'Paris, France'
  },
  {
    date: '2024-12-15',
    src: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80',
    alt: 'Ville la nuit',
    location: 'Lyon, France'
  },
  {
    date: '2024-12-10',
    src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
    alt: 'Sentier forestier',
    location: 'Vosges, France'
  },
  {
    date: '2024-11-25',
    src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80',
    alt: 'Lac de montagne',
    location: 'Savoie, France'
  },
  {
    date: '2024-11-20',
    src: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&q=80',
    alt: 'Architecture moderne',
    location: 'Paris, France'
  },
  {
    date: '2024-11-15',
    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    alt: 'Paysage hivernal',
    location: 'Jura, France'
  },
  {
    date: '2024-10-30',
    src: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80',
    alt: 'Vue urbaine',
    location: 'Marseille, France'
  },
  {
    date: '2024-10-25',
    src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
    alt: 'Nature sauvage',
    location: 'Cévennes, France'
  },
  {
    date: '2024-10-20',
    src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80',
    alt: 'Reflet dans l\'eau',
    location: 'Lac d\'Annecy, France'
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

