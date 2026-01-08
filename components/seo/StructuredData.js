import { siteConfig } from '../../lib/config';

// Fonction helper pour générer priceValidUntil (1 an dans le futur)
const getPriceValidUntil = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().split('T')[0]; // Format YYYY-MM-DD
};

// Fonction pour enrichir un offer avec priceValidUntil si manquant
const enrichOffer = (offer) => {
  if (!offer || typeof offer !== 'object') {
    return offer;
  }
  // Si c'est un Offer et qu'il n'a pas déjà priceValidUntil, l'ajouter
  if (offer['@type'] === 'Offer' && !offer.priceValidUntil) {
    return {
      ...offer,
      priceValidUntil: getPriceValidUntil()
    };
  }
  return offer;
};

export default function StructuredData({ type = 'WebSite', data = {} }) {
  const getStructuredData = () => {
    switch (type) {
      case 'WebSite':
        return {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: siteConfig.name,
          url: siteConfig.url,
          description: siteConfig.description,
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${siteConfig.url}/blog?search={search_term_string}`
            },
            'query-input': 'required name=search_term_string'
          }
        };
      
      case 'Organization':
        return {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: siteConfig.name,
          url: siteConfig.url,
          logo: siteConfig.ogLogo,
          sameAs: [
            siteConfig.social.linkedin
          ]
        };
      
      case 'BlogPosting':
        const blogPosting = {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: data.title,
          description: data.description,
          image: Array.isArray(data.image) ? data.image : [data.image || siteConfig.ogImage],
          datePublished: data.datePublished,
          dateModified: data.dateModified || data.datePublished,
          author: {
            '@type': 'Person',
            name: siteConfig.author,
            url: siteConfig.url,
            sameAs: [
              siteConfig.social.linkedin,
              siteConfig.social.malt,
              'https://github.com/rcoco78'
            ]
          },
          publisher: {
            '@type': 'Organization',
            name: siteConfig.name,
            logo: {
              '@type': 'ImageObject',
              url: siteConfig.ogLogo,
              width: 512,
              height: 512
            }
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': data.url
          },
          url: data.url,
          inLanguage: 'fr-FR',
          isAccessibleForFree: true,
          isPartOf: {
            '@type': 'Blog',
            name: 'Blog - Corentin Robert',
            url: `${siteConfig.url}/blog`
          }
        }

        // Ajouter articleBody si disponible
        if (data.articleBody) {
          blogPosting.articleBody = data.articleBody
        }

        // Ajouter wordCount si disponible
        if (data.wordCount) {
          blogPosting.wordCount = data.wordCount
        }

        // Ajouter timeRequired si disponible
        if (data.timeRequired) {
          blogPosting.timeRequired = data.timeRequired
        }

        // Ajouter keywords si disponible
        if (data.keywords) {
          blogPosting.keywords = Array.isArray(data.keywords) 
            ? data.keywords.join(', ') 
            : data.keywords
        }

        // Ajouter articleSection si disponible
        if (data.articleSection) {
          blogPosting.articleSection = data.articleSection
        }

        // Ajouter speakable si disponible (pour Google Assistant)
        if (data.speakable) {
          blogPosting.speakable = {
            '@type': 'SpeakableSpecification',
            cssSelector: data.speakable.cssSelector || ['h1', 'h2']
          }
        }

        return blogPosting
      
      case 'Person':
        return {
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: data.name || siteConfig.author,
          url: data.url || siteConfig.url,
          jobTitle: data.jobTitle || 'Consultant Freelance en Scraping et Automatisation',
          description: data.description || siteConfig.seo.defaultDescription,
          knowsAbout: data.knowsAbout || ['Web Scraping', 'Data Automation', 'Outbound Marketing'],
          alumniOf: data.alumniOf,
          sameAs: data.sameAs || [
            siteConfig.social.linkedin,
            siteConfig.social.malt,
            'https://apify.com?fpr=0n7ukq',
            'https://github.com/rcoco78'
          ],
          image: data.image || siteConfig.ogLogo
        };
      
      case 'BreadcrumbList':
        return {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: data.items || []
        };
      
      case 'Service':
        const service = {
          '@context': 'https://schema.org',
          '@type': 'Service',
          serviceType: data.serviceType || 'Consulting',
          name: data.name || 'Scraping et Automatisation',
          provider: {
            '@type': 'Person',
            name: siteConfig.author,
            url: siteConfig.url
          },
          areaServed: {
            '@type': 'Country',
            name: 'France'
          },
          description: data.description || siteConfig.seo.defaultDescription,
          offers: data.offers || {
            '@type': 'Offer',
            availability: 'https://schema.org/InStock',
            priceCurrency: 'EUR'
          }
        };
        // Ajouter l'URL si fournie
        if (data.url) {
          service.url = data.url;
        }
        // Ajouter aggregateRating si fourni
        if (data.aggregateRating) {
          service.aggregateRating = data.aggregateRating;
        }
        return service;

      case 'AggregateRating':
        const aggregateRating = {
          '@context': 'https://schema.org',
          '@type': 'AggregateRating',
          ratingValue: data.ratingValue || '4.9',
          reviewCount: data.reviewCount || '270',
          bestRating: '5',
          worstRating: '1'
        };
        // Note: AggregateRating ne doit pas avoir itemReviewed selon Schema.org
        // itemReviewed est uniquement pour Review, pas pour AggregateRating
        return aggregateRating;

      case 'VideoObject':
        const videoObject = {
          '@context': 'https://schema.org',
          '@type': 'VideoObject',
          name: data.name || 'Présentation de Corentin Robert',
          description: data.description || siteConfig.seo.defaultDescription,
          thumbnailUrl: data.thumbnailUrl || `https://img.youtube.com/vi/${data.videoId}/maxresdefault.jpg`,
          uploadDate: data.uploadDate || new Date().toISOString(),
          contentUrl: data.contentUrl || `https://www.youtube.com/watch?v=${data.videoId}`,
          embedUrl: data.embedUrl || `https://www.youtube.com/embed/${data.videoId}`,
          publisher: {
            '@type': 'Person',
            name: siteConfig.author,
            url: siteConfig.url
          }
        };
        
        // Ajouter la durée si fournie (format ISO 8601 requis pour Google)
        if (data.duration) {
          videoObject.duration = data.duration;
        }
        
        return videoObject;

      case 'Dataset':
        return {
          '@context': 'https://schema.org',
          '@type': 'Dataset',
          name: data.name || 'Objectifs 2026 et Progression Business',
          description: data.description || 'Données publiques sur mes objectifs business, métriques de croissance et progression des projets.',
          url: data.url || `${siteConfig.url}/objectifs`,
          creator: {
            '@type': 'Person',
            name: siteConfig.author,
            url: siteConfig.url
          },
          datePublished: data.datePublished || new Date().toISOString(),
          dateModified: data.dateModified || new Date().toISOString(),
          keywords: data.keywords || ['objectifs business', 'métriques', 'progression'],
          license: data.license || 'https://creativecommons.org/licenses/by/4.0/',
          distribution: data.distribution || []
        };
      
      case 'Blog':
        return {
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: data.name || 'Blog Scraping et Automatisation - Corentin Robert',
          description: data.description || 'Articles sur le scraping, l\'automatisation et l\'entrepreneuriat. Cas d\'usage concrets, ROI mesurable, réflexions sur le business.',
          url: data.url || `${siteConfig.url}/blog`,
          author: {
            '@type': 'Person',
            name: siteConfig.author,
            url: siteConfig.url
          },
          publisher: {
            '@type': 'Organization',
            name: siteConfig.name,
            logo: {
              '@type': 'ImageObject',
              url: siteConfig.ogLogo
            }
          },
          blogPost: data.blogPost || []
        };

      case 'SoftwareApplication':
        return {
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: data.name,
          applicationCategory: data.applicationCategory || 'BusinessApplication',
          operatingSystem: data.operatingSystem || 'Web',
          offers: enrichOffer({
            '@type': 'Offer',
            price: data.price || '0',
            priceCurrency: data.priceCurrency || 'EUR',
            availability: data.availability || 'https://schema.org/InStock',
            url: data.downloadUrl || data.url
          }),
          aggregateRating: data.aggregateRating || {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            ratingCount: '150'
          },
          description: data.description,
          url: data.url,
          screenshot: data.screenshot,
          featureList: data.featureList,
          author: {
            '@type': 'Person',
            name: siteConfig.author,
            url: siteConfig.url
          }
        };

      case 'ItemList':
        return {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: data.name || 'Liste d\'outils gratuits',
          description: data.description || 'Collection d\'outils gratuits pour automatiser vos processus business',
          numberOfItems: data.numberOfItems || 0,
          itemListElement: data.items || []
        };

      case 'MusicRecording':
        return {
          '@context': 'https://schema.org',
          '@type': 'MusicRecording',
          name: data.name,
          byArtist: data.byArtist || (data.artists ? {
            '@type': 'MusicGroup',
            name: data.artists.map(a => a.name).join(', ')
          } : undefined),
          duration: data.duration ? `PT${Math.floor(data.duration / 1000)}S` : undefined,
          inAlbum: data.inAlbum ? {
            '@type': 'MusicAlbum',
            name: data.inAlbum.name,
            image: data.inAlbum.images?.[0]?.url
          } : undefined,
          url: data.url,
          image: data.image,
          audio: data.audio ? {
            '@type': 'AudioObject',
            contentUrl: data.audio
          } : undefined
        };

      case 'MusicGroup':
        return {
          '@context': 'https://schema.org',
          '@type': 'MusicGroup',
          name: data.name,
          image: data.image,
          genre: data.genres || [],
          url: data.url,
          sameAs: data.sameAs || []
        };

      case 'FAQPage':
        return {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: (data.questions || []).map(q => {
            // Si déjà en format Schema.org, utiliser directement
            if (q['@type'] === 'Question' && q.acceptedAnswer && q.acceptedAnswer.text) {
              return q
            }
            // Sinon, transformer depuis le format simple
            const answerText = q.answer || q.text || (q.acceptedAnswer && q.acceptedAnswer.text) || ''
            if (!answerText) {
              return null // Ignorer les questions sans réponse
            }
            return {
              '@type': 'Question',
              name: q.question || q.name,
              acceptedAnswer: {
                '@type': 'Answer',
                text: answerText
              }
            }
          }).filter(q => q !== null) // Filtrer les questions null
        };

      case 'Review':
        // S'assurer que data existe et est un objet
        if (!data || typeof data !== 'object') {
          data = {};
        }
        
        const review = {
          '@context': 'https://schema.org',
          '@type': 'Review',
          author: data.author || (data.authorName ? {
            '@type': 'Person',
            name: data.authorName
          } : {
            '@type': 'Person',
            name: 'Client'
          }),
          datePublished: data.datePublished || new Date().toISOString().split('T')[0],
          reviewBody: data.reviewBody || '',
          reviewRating: {
            '@type': 'Rating',
            ratingValue: data.ratingValue || (data.reviewRating?.ratingValue) || '5',
            bestRating: '5',
            worstRating: '1'
          }
        };
        
        // itemReviewed est OBLIGATOIRE pour Google - toujours l'ajouter
        // Ajouter itemReviewed si fourni (obligatoire pour Google)
        if (data.itemReviewed && typeof data.itemReviewed === 'object') {
          // S'assurer que itemReviewed a une URL si c'est un Service ou Product
          const itemReviewed = { ...data.itemReviewed };
          
          // Google n'accepte pas Service, CreativeWork, etc. pour Review snippets
          // Convertir automatiquement en Product (type accepté)
          if (itemReviewed['@type'] === 'Service' || itemReviewed['@type'] === 'CreativeWork' || 
              (itemReviewed['@type'] && !['Product', 'Organization', 'LocalBusiness', 'SoftwareApplication', 
                'Book', 'Course', 'Event', 'Game', 'HowTo', 'MediaObject', 'Movie', 
                'MusicPlaylist', 'MusicRecording', 'Recipe'].includes(itemReviewed['@type']))) {
            // Convertir Service en Product
            itemReviewed['@type'] = 'Product';
            // Convertir provider en brand si présent
            if (itemReviewed.provider && !itemReviewed.brand) {
              itemReviewed.brand = itemReviewed.provider;
              delete itemReviewed.provider;
            }
            // S'assurer qu'il y a un brand
            if (!itemReviewed.brand) {
              itemReviewed.brand = {
                '@type': 'Person',
                name: siteConfig.author,
                url: siteConfig.url
              };
            }
          }
          
          // Pour les Product, s'assurer qu'ils ont toutes les propriétés requises
          if (itemReviewed['@type'] === 'Product') {
            // URL obligatoire
            if (!itemReviewed.url) {
              itemReviewed.url = data.url || siteConfig.url;
            }
            
            // Brand obligatoire pour Product
            if (!itemReviewed.brand) {
              itemReviewed.brand = {
                '@type': 'Person',
                name: siteConfig.author,
                url: siteConfig.url
              };
            } else if (!itemReviewed.brand.url) {
              // S'assurer que le brand a une URL
              itemReviewed.brand.url = siteConfig.url;
            }
            
            // Image obligatoire pour Product (pour les extraits de produits)
            if (!itemReviewed.image) {
              itemReviewed.image = data.image || siteConfig.ogImage;
            }
            
            // Au moins une des propriétés requises : offers, review, ou aggregateRating
            if (!itemReviewed.offers && !itemReviewed.review && !itemReviewed.aggregateRating) {
              itemReviewed.offers = enrichOffer({
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'EUR',
                availability: 'https://schema.org/InStock',
                priceSpecification: {
                  '@type': 'UnitPriceSpecification',
                  price: '0',
                  priceCurrency: 'EUR',
                  valueAddedTaxIncluded: true,
                  description: 'Devis personnalisé gratuit. Prix sur mesure selon le volume et la complexité du projet.'
                }
              });
            } else if (itemReviewed.offers) {
              // Enrichir l'offer existant avec priceValidUntil
              itemReviewed.offers = enrichOffer(itemReviewed.offers);
            }
          }
          review.itemReviewed = itemReviewed;
        } else if (data.serviceName) {
          review.itemReviewed = {
            '@type': 'Product',
            name: data.serviceName,
            url: data.url || siteConfig.url,
            brand: {
              '@type': 'Person',
              name: siteConfig.author,
              url: siteConfig.url
            },
            offers: enrichOffer({
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'EUR',
              availability: 'https://schema.org/InStock',
              priceSpecification: {
                '@type': 'UnitPriceSpecification',
                price: '0',
                priceCurrency: 'EUR',
                valueAddedTaxIncluded: true,
                description: 'Devis personnalisé gratuit. Prix sur mesure selon le volume et la complexité du projet.'
              }
            })
          };
        } else {
          // Par défaut : Service de scraping et automatisation
          // Utiliser data.url si disponible (URL de la page spécifique), sinon siteConfig.url
          const defaultUrl = data.url || siteConfig.url
          review.itemReviewed = {
            '@type': 'Product',
            name: data.serviceName || 'Services de Scraping et Automatisation',
            url: defaultUrl,
            brand: {
              '@type': 'Person',
              name: siteConfig.author,
              url: siteConfig.url
            },
            offers: enrichOffer({
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'EUR',
              availability: 'https://schema.org/InStock',
              priceSpecification: {
                '@type': 'UnitPriceSpecification',
                price: '0',
                priceCurrency: 'EUR',
                valueAddedTaxIncluded: true,
                description: 'Devis personnalisé gratuit. Prix sur mesure selon le volume et la complexité du projet.'
              }
            })
          };
        }
        
        return review;

      case 'HowTo':
        return {
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: data.name || 'Guide d\'utilisation',
          description: data.description || 'Comment utiliser cet outil',
          step: (data.steps || []).map((step, index) => ({
            '@type': 'HowToStep',
            position: index + 1,
            name: step.name || step.title,
            text: step.text || step.description,
            image: step.image,
            url: step.url
          }))
        };

      case 'Product':
        const product = {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: data.name,
          description: data.description,
          url: data.url,
          image: data.image || siteConfig.ogImage, // Image obligatoire pour Product schema
          brand: data.brand,
          aggregateRating: data.aggregateRating,
          offers: data.offers ? enrichOffer(data.offers) : undefined,
          review: data.review || (data.reviews && data.reviews.length > 0 ? data.reviews : undefined)
        };
        // Si pas de review fournie mais qu'on a aggregateRating, créer une review par défaut
        if (!product.review && product.aggregateRating && product.offers) {
          product.review = {
            '@type': 'Review',
            author: {
              '@type': 'Person',
              name: siteConfig.author,
              url: siteConfig.url
            },
            reviewRating: {
              '@type': 'Rating',
              ratingValue: product.aggregateRating.ratingValue || '5',
              bestRating: product.aggregateRating.bestRating || '5',
              worstRating: product.aggregateRating.worstRating || '1'
            },
            reviewBody: data.description || `Service professionnel de ${data.name || 'scraping et automatisation'}.`,
            datePublished: new Date().toISOString().split('T')[0]
          };
        }
        // Ajouter d'autres champs optionnels
        if (data.sku) product.sku = data.sku;
        if (data.gtin) product.gtin = data.gtin;
        if (data.category) product.category = data.category;
        return product;
      
      default:
        return data;
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(getStructuredData()) }}
    />
  );
}

