import { siteConfig } from '../../lib/config';

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
        return {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: data.title,
          description: data.description,
          image: data.image || siteConfig.ogImage,
          datePublished: data.datePublished,
          dateModified: data.dateModified || data.datePublished,
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
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': data.url
          }
        };
      
      case 'Person':
        return {
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: siteConfig.author,
          url: siteConfig.url,
          jobTitle: 'Consultant Freelance en Scraping et Automatisation',
          description: siteConfig.seo.defaultDescription,
          sameAs: [
            siteConfig.social.linkedin,
            siteConfig.social.malt,
            'https://apify.com?fpr=0n7ukq',
            'https://github.com/rcoco78'
          ],
          image: siteConfig.ogLogo
        };
      
      case 'BreadcrumbList':
        return {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: data.items || []
        };
      
      case 'Service':
        return {
          '@context': 'https://schema.org',
          '@type': 'Service',
          serviceType: data.serviceType || 'Consulting',
          provider: {
            '@type': 'Person',
            name: siteConfig.author,
            url: siteConfig.url
          },
          areaServed: 'FR',
          description: data.description || siteConfig.seo.defaultDescription
        };

      case 'VideoObject':
        return {
          '@context': 'https://schema.org',
          '@type': 'VideoObject',
          name: data.name || 'Présentation de Corentin Robert',
          description: data.description || siteConfig.seo.defaultDescription,
          thumbnailUrl: data.thumbnailUrl || `https://img.youtube.com/vi/${data.videoId}/maxresdefault.jpg`,
          uploadDate: data.uploadDate || new Date().toISOString(),
          duration: data.duration,
          contentUrl: data.contentUrl || `https://www.youtube.com/watch?v=${data.videoId}`,
          embedUrl: data.embedUrl || `https://www.youtube.com/embed/${data.videoId}`,
          publisher: {
            '@type': 'Person',
            name: siteConfig.author,
            url: siteConfig.url
          }
        };
      
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

