# Application SEO - 3 Pages d'Outils

## Modifications à appliquer sur chaque page

### 1. Imports
```javascript
import BreadcrumbTools from '../../components/BreadcrumbTools'
```

### 2. Ajouter howToSteps dans toolData
```javascript
howToSteps: [
  {
    name: 'Télécharger...',
    text: '...'
  },
  // ... autres étapes
]
```

### 3. Créer faqItems avant pageSEO
```javascript
const faqItems = [
  {
    question: '...',
    answer: '...'
  },
  // ... autres questions
]
```

### 4. Enrichir toolStructuredData
```javascript
const toolStructuredData = {
  // ... existant
  screenshot: toolData.videoThumbnail || `${siteConfig.url}/images/og-default.jpg`,
  featureList: toolData.formats || [],
  // ... reste
}
```

### 5. Modifier SEOHead
```javascript
<SEOHead 
  {...pageSEO} 
  ogType="product"
  ogImage={toolData.videoThumbnail || undefined}
/>
```

### 6. Ajouter VideoObject Schema (si vidéo)
```javascript
{toolData.videoUrl && toolData.videoUrl.includes('youtube.com') && (
  <StructuredData type="VideoObject" data={{...}} />
)}
```

### 7. Ajouter HowTo Schema
```javascript
{toolData.howToSteps && toolData.howToSteps.length > 0 && (
  <StructuredData type="HowTo" data={{...}} />
)}
```

### 8. Ajouter Breadcrumb dans main
```javascript
<main className="min-w-0 mt-6 flex flex-col">
  <BreadcrumbTools toolName={toolData.name} toolPath="/outils/[nom-outil]" />
  {/* ... reste */}
</main>
```

### 9. Modifier Section Témoignages
Ajouter StructuredData Review pour chaque témoignage :
```javascript
{toolData.testimonials.map((testimonial, index) => (
  <div key={index}>
    {/* ... HTML témoignage */}
    <StructuredData
      type="Review"
      data={{
        authorName: testimonial.name,
        datePublished: testimonial.date.split('-').reverse().join('-'),
        reviewBody: testimonial.comment,
        ratingValue: '5',
        itemReviewed: {
          '@type': 'SoftwareApplication',
          name: toolData.name,
          url: `${siteConfig.url}/outils/[nom-outil]`
        }
      }}
    />
  </div>
))}
```

### 10. Modifier Section FAQ
```javascript
<FAQ items={faqItems} />
<StructuredData
  type="FAQPage"
  data={{ questions: faqItems }}
/>
```

## Pages à modifier
- [x] notion-dashboard.js (FAIT)
- [ ] email-generator.js (EN COURS)
- [ ] linkedin-extractor.js
- [ ] real-estate-generator.js

