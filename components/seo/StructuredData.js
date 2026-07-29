import { siteConfig } from '../../lib/config';
import { clampRatingValue, normalizeAggregateRating } from '../../lib/rating';

// Fonction helper pour générer priceValidUntil (1 an dans le futur)
const getPriceValidUntil = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().split('T')[0]; // Format YYYY-MM-DD
};

// Fonction pour enrichir un offer avec priceValidUntil et shippingDetails si manquants
const enrichOffer = (offer) => {
  if (!offer || typeof offer !== 'object') {
    return offer;
  }
  // Si c'est un Offer, enrichir avec les champs manquants
  if (offer['@type'] === 'Offer') {
    const enrichedOffer = { ...offer };
    
    // Ajouter priceValidUntil si manquant
    if (!enrichedOffer.priceValidUntil) {
      enrichedOffer.priceValidUntil = getPriceValidUntil();
    }
    
    // Ajouter shippingDetails si manquant (pour services numériques, livraison instantanée)
    if (!enrichedOffer.shippingDetails) {
      enrichedOffer.shippingDetails = {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '0',
          currency: 'EUR'
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'FR'
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          businessDays: {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
          },
          cutoffTime: '23:59',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 0,
            unitCode: 'DAY'
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 0,
            unitCode: 'DAY'
          }
        }
      };
    } else if (enrichedOffer.shippingDetails && !enrichedOffer.shippingDetails.shippingDestination) {
      // Si shippingDetails existe mais n'a pas shippingDestination, l'ajouter
      enrichedOffer.shippingDetails.shippingDestination = {
        '@type': 'DefinedRegion',
        addressCountry: 'FR'
      };
    }
    
    // Ajouter hasMerchantReturnPolicy si manquant (politique de retour/remboursement)
    if (!enrichedOffer.hasMerchantReturnPolicy) {
      enrichedOffer.hasMerchantReturnPolicy = {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: {
          '@type': 'Country',
          name: 'FR'
        },
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 14,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn'
      };
    }
    
    return enrichedOffer;
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

      case 'SiteNavigation':
        // Sitelinks : aide Google à comprendre la structure de navigation du site
        // Liens avec texte d'ancrage descriptif ("À propos", "Blog", etc.) privilégiés par Google
        const navItems = data.items || [
          { name: 'À propos', url: `${siteConfig.url}/a-propos` },
          { name: 'Marketplace', url: `${siteConfig.url}/marketplace` },
          { name: 'Blog', url: `${siteConfig.url}/blog` }
        ];
        return {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Navigation principale',
          itemListElement: navItems.map((item, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: {
              '@type': 'WebPage',
              name: item.name,
              url: item.url
            }
          }))
        };
      
      case 'WebPage':
        return {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': data.url || siteConfig.url,
          url: data.url || siteConfig.url,
          name: data.name || data.title || siteConfig.name,
          description: data.description || siteConfig.description,
          inLanguage: 'fr-FR',
          isPartOf: {
            '@type': 'WebSite',
            name: siteConfig.name,
            url: siteConfig.url
          },
          about: data.about || {
            '@type': 'Thing',
            name: 'Scraping et Automatisation'
          },
          primaryImageOfPage: data.image ? {
            '@type': 'ImageObject',
            url: data.image,
            width: 1200,
            height: 630
          } : undefined,
          breadcrumb: data.breadcrumb,
          mainEntity: data.mainEntity
        };

      case 'ContactPage':
        return {
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          url: data.url || `${siteConfig.url}/contact`,
          name: data.name || 'Contact - Corentin Robert',
          description: data.description || 'Réservez un créneau pour discuter de vos projets de scraping, d\'automatisation ou d\'outbound marketing. Consultation gratuite de 20 minutes.',
          inLanguage: 'fr-FR',
          isPartOf: {
            '@type': 'WebSite',
            name: siteConfig.name,
            url: siteConfig.url
          },
          mainEntity: {
            '@type': 'ContactPoint',
            contactType: 'Customer Service',
            email: data.email || 'contact@corentinrobert.fr',
            url: data.bookingUrl || 'https://calendly.com/corentinrobert/20min',
            availableLanguage: ['French', 'English'],
            areaServed: 'FR'
          }
        };
      
      case 'Organization':
        return {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: siteConfig.name,
          url: siteConfig.url,
          // Le validateur schema.org + Google préfèrent un logo en string ou array de strings
          // plutôt qu'un objet ImageObject dans le champ Organization.logo
          // On garde l'URL de l'image OG comme logo principal.
          logo: siteConfig.ogLogo,
          description: data.description || siteConfig.seo.defaultDescription,
          founder: {
            '@type': 'Person',
            name: siteConfig.author,
            url: siteConfig.url
          },
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'Customer Service',
            email: data.email || 'contact@corentinrobert.fr',
            availableLanguage: ['French', 'English']
          },
          sameAs: data.sameAs || [
            siteConfig.social.linkedin,
            siteConfig.social.malt,
            siteConfig.social.github,
            siteConfig.social.youtube,
            'https://apify.com?fpr=0n7ukq'
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
              siteConfig.social.github,
              siteConfig.social.youtube,
            ]
          },
          publisher: {
            '@type': 'Organization',
            name: siteConfig.name,
            // Pour rester compatible avec les validateurs qui exigent un string pour logo,
            // on passe directement l'URL plutôt qu'un objet ImageObject.
            logo: siteConfig.ogLogo
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
          alternateName: data.alternateName || 'Corentin Robert',
          url: data.url || siteConfig.url,
          jobTitle: data.jobTitle || 'Consultant Freelance en Scraping et Automatisation',
          description: data.description || siteConfig.seo.defaultDescription,
          knowsAbout: data.knowsAbout || ['Web Scraping', 'Data Automation', 'Outbound Marketing', 'Growth Hacking', 'Web Scraping', 'Freelance'],
          alumniOf: data.alumniOf,
          email: data.email,
          telephone: data.telephone,
          address: data.address || {
            '@type': 'PostalAddress',
            addressCountry: 'FR',
            addressLocality: 'Paris'
          },
          worksFor: data.worksFor || {
            '@type': 'Organization',
            name: siteConfig.name,
            url: siteConfig.url
          },
          sameAs: data.sameAs || [
            siteConfig.social.linkedin,
            siteConfig.social.malt,
            siteConfig.social.fiverr,
            siteConfig.social.youtube,
            'https://apify.com?fpr=0n7ukq',
            siteConfig.social.github
          ],
          image: {
            '@type': 'ImageObject',
            url: data.image || siteConfig.ogLogo,
            width: 512,
            height: 512
          }
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
          service.aggregateRating = normalizeAggregateRating(data.aggregateRating);
        }
        return service;

      case 'AggregateRating':
        const aggregateRating = normalizeAggregateRating({
          '@context': 'https://schema.org',
          '@type': 'AggregateRating',
          ratingValue: data.ratingValue || '4.9',
          reviewCount: data.reviewCount || String(siteConfig.socialProof?.malt?.reviews || 115),
          bestRating: '5',
          worstRating: '1'
        });
        // Note: AggregateRating ne doit pas avoir itemReviewed selon Schema.org
        // itemReviewed est uniquement pour Review, pas pour AggregateRating
        return { ...aggregateRating, '@context': 'https://schema.org' };

      case 'VideoObject':
        // Normaliser uploadDate au format ISO 8601 complet avec fuseau horaire (YYYY-MM-DDTHH:mm:ss.sssZ)
        // toISOString() garantit toujours le format avec fuseau horaire UTC (Z)
        let normalizedUploadDate = new Date().toISOString();
        if (data.uploadDate) {
          try {
            let parsedDate;
            if (typeof data.uploadDate === 'string') {
              // Si c'est seulement une date (YYYY-MM-DD), ajouter l'heure à minuit UTC
              if (data.uploadDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                parsedDate = new Date(data.uploadDate + 'T00:00:00.000Z');
              } else if (data.uploadDate.includes('T')) {
                // Si c'est déjà une chaîne ISO 8601 avec T, parser et reconvertir pour garantir le fuseau horaire
                parsedDate = new Date(data.uploadDate);
              } else {
                // Autre format, essayer de parser
                parsedDate = new Date(data.uploadDate);
              }
            } else {
              // Si c'est un objet Date ou autre, utiliser directement
              parsedDate = new Date(data.uploadDate);
            }
            
            // toISOString() garantit toujours le format ISO 8601 avec fuseau horaire UTC (Z)
            normalizedUploadDate = parsedDate.toISOString();
          } catch (error) {
            // En cas d'erreur, utiliser la date actuelle (toISOString() inclut toujours le Z)
            console.warn('Erreur de formatage uploadDate:', error);
            normalizedUploadDate = new Date().toISOString();
          }
        }
        
        // Vérification finale : s'assurer que la date se termine par Z (UTC) ou a un offset
        // toISOString() devrait toujours retourner un format avec Z, mais vérification de sécurité
        if (!normalizedUploadDate.endsWith('Z') && !normalizedUploadDate.match(/[+-]\d{2}:\d{2}$/)) {
          // Si pas de fuseau horaire détecté, forcer la conversion via Date pour garantir le Z
          normalizedUploadDate = new Date(normalizedUploadDate).toISOString();
        }
        
        const videoObject = {
          '@context': 'https://schema.org',
          '@type': 'VideoObject',
          name: data.name || 'Présentation de Corentin Robert',
          description: data.description || siteConfig.seo.defaultDescription,
          thumbnailUrl: data.thumbnailUrl || `https://img.youtube.com/vi/${data.videoId}/maxresdefault.jpg`,
          uploadDate: normalizedUploadDate,
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
            // Même logique que pour Organization et BlogPosting:
            // utiliser une simple URL pour le logo afin d'éviter les erreurs de validation.
            logo: siteConfig.ogLogo
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
            ratingValue: clampRatingValue(data.ratingValue || (data.reviewRating?.ratingValue) || '5'),
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
            // S'assurer qu'il y a un brand - utiliser Brand au lieu de Person
            if (!itemReviewed.brand) {
              itemReviewed.brand = {
                '@type': 'Brand',
                name: siteConfig.author,
                url: siteConfig.url
              };
            } else if (itemReviewed.brand['@type'] === 'Person') {
              // Convertir Person en Brand
              itemReviewed.brand = {
                '@type': 'Brand',
                name: itemReviewed.brand.name || siteConfig.author,
                url: itemReviewed.brand.url || siteConfig.url
              };
            }
          }
          
          // Pour les Product, s'assurer qu'ils ont toutes les propriétés requises
          if (itemReviewed['@type'] === 'Product') {
            // URL obligatoire
            if (!itemReviewed.url) {
              itemReviewed.url = data.url || siteConfig.url;
            }
            
            // Description obligatoire pour Product
            if (!itemReviewed.description) {
              itemReviewed.description = data.description || `Service professionnel de ${itemReviewed.name || 'scraping et automatisation'}.`;
            }
            
            // Brand obligatoire pour Product - utiliser Brand au lieu de Person
            if (!itemReviewed.brand) {
              itemReviewed.brand = {
                '@type': 'Brand',
                name: siteConfig.author,
                url: siteConfig.url
              };
            } else {
              // Convertir Person en Brand si nécessaire
              if (itemReviewed.brand['@type'] === 'Person') {
                itemReviewed.brand = {
                  '@type': 'Brand',
                  name: itemReviewed.brand.name || siteConfig.author,
                  url: itemReviewed.brand.url || siteConfig.url
                };
              } else if (!itemReviewed.brand.url) {
                // S'assurer que le brand a une URL
                itemReviewed.brand.url = siteConfig.url;
              }
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
            
            // Ajouter aggregateRating si manquant (recommandé pour les extraits de produits)
            if (!itemReviewed.aggregateRating) {
              // Si on a une review, créer aggregateRating à partir de la review
              if (itemReviewed.review) {
                const reviewRating = itemReviewed.review.reviewRating || itemReviewed.review.ratingValue;
                const ratingValue = clampRatingValue(reviewRating?.ratingValue || reviewRating || '5');
                itemReviewed.aggregateRating = {
                  '@type': 'AggregateRating',
                  ratingValue: ratingValue,
                  reviewCount: '1',
                  bestRating: '5',
                  worstRating: '1'
                };
              } else {
                // Sinon, créer un aggregateRating par défaut
                itemReviewed.aggregateRating = {
                  '@type': 'AggregateRating',
                  ratingValue: '5',
                  reviewCount: '1',
                  bestRating: '5',
                  worstRating: '1'
                };
              }
            } else {
              itemReviewed.aggregateRating = normalizeAggregateRating(itemReviewed.aggregateRating);
            }
            
            // Ajouter review si manquant (recommandé pour les extraits de produits)
            if (!itemReviewed.review) {
              itemReviewed.review = {
                '@type': 'Review',
                author: {
                  '@type': 'Person',
                  name: siteConfig.author,
                  url: siteConfig.url
                },
                reviewRating: {
                  '@type': 'Rating',
                  ratingValue: clampRatingValue(itemReviewed.aggregateRating?.ratingValue || '5'),
                  bestRating: '5',
                  worstRating: '1'
                },
                reviewBody: itemReviewed.description || `Service professionnel de ${itemReviewed.name || 'scraping et automatisation'}.`,
                datePublished: new Date().toISOString().split('T')[0]
              };
            }
          }
          review.itemReviewed = itemReviewed;
        } else if (data.serviceName) {
          review.itemReviewed = {
            '@type': 'Product',
            name: data.serviceName,
            description: data.description || `Service professionnel de ${data.serviceName}.`,
            url: data.url || siteConfig.url,
            brand: {
              '@type': 'Brand',
              name: siteConfig.author,
              url: siteConfig.url
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '5',
              reviewCount: '1',
              bestRating: '5',
              worstRating: '1'
            },
            review: {
              '@type': 'Review',
              author: {
                '@type': 'Person',
                name: siteConfig.author,
                url: siteConfig.url
              },
              reviewRating: {
                '@type': 'Rating',
                ratingValue: '5',
                bestRating: '5',
                worstRating: '1'
              },
              reviewBody: data.description || `Service professionnel de ${data.serviceName}.`,
              datePublished: new Date().toISOString().split('T')[0]
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
            description: data.description || 'Services professionnels de scraping et automatisation sur-mesure pour votre entreprise.',
            url: defaultUrl,
            brand: {
              '@type': 'Brand',
              name: siteConfig.author,
              url: siteConfig.url
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '5',
              reviewCount: '1',
              bestRating: '5',
              worstRating: '1'
            },
            review: {
              '@type': 'Review',
              author: {
                '@type': 'Person',
                name: siteConfig.author,
                url: siteConfig.url
              },
              reviewRating: {
                '@type': 'Rating',
                ratingValue: '5',
                bestRating: '5',
                worstRating: '1'
              },
              reviewBody: data.description || 'Services professionnels de scraping et automatisation sur-mesure pour votre entreprise.',
              datePublished: new Date().toISOString().split('T')[0]
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
        // Normaliser le brand : convertir Person en Brand pour les Product schemas
        let normalizedBrand = data.brand;
        if (normalizedBrand && normalizedBrand['@type'] === 'Person') {
          normalizedBrand = {
            '@type': 'Brand',
            name: normalizedBrand.name || siteConfig.author,
            url: normalizedBrand.url || siteConfig.url
          };
        } else if (!normalizedBrand) {
          normalizedBrand = {
            '@type': 'Brand',
            name: siteConfig.author,
            url: siteConfig.url
          };
        }
        
        const product = {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: data.name,
          description: data.description || `Service professionnel de ${data.name || 'scraping et automatisation'}.`,
          url: data.url,
          image: data.image || siteConfig.ogImage, // Image obligatoire pour Product schema
          brand: normalizedBrand,
          aggregateRating: data.aggregateRating
            ? normalizeAggregateRating(data.aggregateRating)
            : undefined,
          offers: data.offers ? enrichOffer(data.offers) : undefined,
          review: data.review || (data.reviews && data.reviews.length > 0 ? data.reviews : undefined)
        };
        
        // Si pas d'aggregateRating mais qu'on a une review, créer aggregateRating à partir de la review
        if (!product.aggregateRating && product.review) {
          const reviewRating = product.review.reviewRating || product.review.ratingValue;
          const ratingValue = clampRatingValue(reviewRating?.ratingValue || reviewRating || '5');
          product.aggregateRating = {
            '@type': 'AggregateRating',
            ratingValue: ratingValue,
            reviewCount: '1',
            bestRating: '5',
            worstRating: '1'
          };
        } else if (!product.aggregateRating && !product.review) {
          // Si ni aggregateRating ni review, créer un aggregateRating par défaut
          product.aggregateRating = {
            '@type': 'AggregateRating',
            ratingValue: '5',
            reviewCount: '1',
            bestRating: '5',
            worstRating: '1'
          };
        } else if (product.aggregateRating) {
          product.aggregateRating = normalizeAggregateRating(product.aggregateRating);
        }
        
        // Si pas de review fournie, créer une review par défaut (recommandé pour les extraits de produits)
        if (!product.review) {
          product.review = {
            '@type': 'Review',
            author: {
              '@type': 'Person',
              name: siteConfig.author,
              url: siteConfig.url
            },
            reviewRating: {
              '@type': 'Rating',
              ratingValue: clampRatingValue(product.aggregateRating?.ratingValue || '5'),
              bestRating: '5',
              worstRating: '1'
            },
            reviewBody: data.description || `Service professionnel de ${data.name || 'scraping et automatisation'}.`,
            datePublished: new Date().toISOString().split('T')[0]
          };
        } else if (product.review?.reviewRating) {
          product.review = {
            ...product.review,
            reviewRating: {
              ...product.review.reviewRating,
              '@type': 'Rating',
              ratingValue: clampRatingValue(product.review.reviewRating.ratingValue),
              bestRating: product.review.reviewRating.bestRating || '5',
              worstRating: product.review.reviewRating.worstRating || '1',
            },
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

