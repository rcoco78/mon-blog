import Head from 'next/head';
import { useRouter } from 'next/router';
import { siteConfig } from '../../lib/config';
import { validateMetaDescription } from '../../lib/seo';

export default function SEOHead({
  title,
  description,
  canonical,
  noindex = false,
  ogImage,
  ogType = 'website',
  keywords,
  publishedTime,
  modifiedTime,
  tags = [],
  article = false,
  imageAlt
}) {
  const router = useRouter();
  
  // Sécuriser l'accès au router
  const currentPath = router?.asPath ? router.asPath.split('?')[0] : '/';
  
  const finalTitle = title 
    ? `${title} | ${siteConfig.name}`
    : siteConfig.title || 'Corentin Robert';
  
  const finalDescription = validateMetaDescription(description || siteConfig.description || '');
  const finalOGImage = ogImage || siteConfig.ogImage || '';
  const canonicalUrl = canonical || `${siteConfig.url}${currentPath}`;
  const finalImageAlt = imageAlt || finalTitle || 'Corentin Robert';

  return (
    <Head>
      {/* Meta tags essentiels */}
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      
      {/* Title et Description */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      
      {/* Keywords */}
      {keywords && typeof keywords === 'string' && keywords.trim() && (
        <meta name="keywords" content={keywords} />
      )}
      
      {/* Author */}
      <meta name="author" content={siteConfig.author} />
      
      {/* Language */}
      <meta httpEquiv="content-language" content="fr" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Robots */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}
      
      {/* Geo tags (optionnel) */}
      <meta name="geo.region" content="FR" />
      <meta name="geo.placename" content="Paris" />
      
      {/* Open Graph / Facebook - Complet comme logement-atypique */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={finalOGImage} />
      <meta property="og:image:secure_url" content={finalOGImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={finalImageAlt} />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:site_name" content={siteConfig.name} />
      <meta property="og:locale" content="fr_FR" />
      {/* Logo du site (comme logement-atypique) */}
      {siteConfig.ogLogo && (
        <meta property="og:logo" content={siteConfig.ogLogo} />
      )}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalOGImage} />
      <meta name="twitter:image:alt" content={finalImageAlt} />
      {siteConfig.twitter.site && (
        <meta name="twitter:site" content={siteConfig.twitter.site} />
      )}
      {siteConfig.twitter.handle && (
        <meta name="twitter:creator" content={siteConfig.twitter.handle} />
      )}
      
      {/* Article meta tags */}
      {article && (
        <>
          {publishedTime && (
            <meta property="article:published_time" content={new Date(publishedTime).toISOString()} />
          )}
          {modifiedTime && (
            <meta property="article:modified_time" content={new Date(modifiedTime).toISOString()} />
          )}
          <meta property="article:author" content={siteConfig.author} />
          <meta property="article:author:url" content={siteConfig.url} />
          <meta property="article:section" content={tags?.[0] || "Blog"} />
          <meta property="article:locale" content="fr_FR" />
          {tags && Array.isArray(tags) && tags.filter(Boolean).map((tag, index) => (
            <meta key={index} property="article:tag" content={String(tag)} />
          ))}
        </>
      )}
      
      {/* Additional SEO */}
      <meta name="theme-color" content="#000000" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      
      {/* Article-specific SEO */}
      {article && (
        <meta name="article:publisher" content={siteConfig.url} />
      )}
      
      {/* Rich Snippets support */}
      <meta name="application-name" content={siteConfig.name} />
      <meta name="msapplication-TileColor" content="#000000" />
      
      {/* Language alternates */}
      <link rel="alternate" hrefLang="fr" href={canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />
    </Head>
  );
}

