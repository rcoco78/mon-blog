// Cas d'usage de scraping et automatisation par secteur
// Utilisé pour générer des pages pSEO (programmatic SEO)

export const caseStudies = [
  // IMMOBILIER
  {
    slug: 'scraping-agents-immobiliers',
    sector: 'Immobilier',
    title: 'Scraping agents immobiliers : récupérer toutes les données des agences',
    description: 'Extraction complète des données d\'agents immobiliers depuis Safti, IAD, Century 21, Orpi et autres réseaux. Coordonnées, spécialités, zones d\'intervention, performances.',
    useCase: 'Récupérer l\'ensemble des informations sur les agents immobiliers de Safti, IAD, Century 21, Orpi, Foncia, Laforêt et autres agences immobilières.',
    dataExtracted: [
      'Nom et coordonnées complètes',
      'Agence d\'appartenance',
      'Zones d\'intervention géographiques',
      'Spécialités (vente, location, neuf, etc.)',
      'Nombre de biens en portefeuille',
      'Performance et avis clients',
      'Liens réseaux sociaux et site web'
    ],
    benefits: [
      'Prospection ciblée des agents immobiliers',
      'Analyse de marché et concurrence',
      'Identification d\'opportunités de partenariats',
      'Veille concurrentielle automatique'
    ],
    examples: ['Safti', 'IAD', 'Century 21', 'Orpi', 'Foncia', 'Laforêt', 'Guy Hoquet', 'Nexity'],
    keywords: ['scraping agents immobiliers', 'extraction données agences immobilières', 'base de données agents immobiliers']
  },
  {
    slug: 'scraping-biens-immobiliers',
    sector: 'Immobilier',
    title: 'Scraping biens immobiliers : extraction de toutes les annonces',
    description: 'Extraction automatique de toutes les annonces immobilières depuis SeLoger, Leboncoin, PAP, Logic-immo. Prix, caractéristiques, localisation, photos.',
    useCase: 'Récupérer toutes les annonces immobilières avec prix, caractéristiques, localisation et photos depuis les principaux portails immobiliers.',
    dataExtracted: [
      'Prix et type de transaction',
      'Caractéristiques du bien (surface, pièces, etc.)',
      'Localisation précise',
      'Photos et descriptions',
      'Contact vendeur/agence',
      'Historique des prix',
      'Comparaison avec marché local'
    ],
    benefits: [
      'Analyse de marché en temps réel',
      'Détection d\'opportunités',
      'Veille concurrentielle automatique',
      'Estimation automatique de biens'
    ],
    examples: ['SeLoger', 'Leboncoin', 'PAP', 'Logic-immo', 'Bien\'ici', 'ParuVendu'],
    keywords: ['scraping annonces immobilières', 'extraction données biens immobiliers', 'scraping immobilier']
  },
  {
    slug: 'scraping-notaires',
    sector: 'Immobilier',
    title: 'Scraping notaires : base de données complète des notaires de France',
    description: 'Extraction des données de tous les notaires français : coordonnées, spécialités, zones d\'intervention, tarifs.',
    useCase: 'Récupérer l\'ensemble des informations sur les notaires de France pour prospection et analyse de marché.',
    dataExtracted: [
      'Nom et coordonnées complètes',
      'Cabinet et associés',
      'Spécialités (immobilier, succession, etc.)',
      'Zones d\'intervention',
      'Tarifs et honoraires',
      'Avis clients'
    ],
    benefits: [
      'Prospection ciblée notaires',
      'Analyse de marché notarial',
      'Identification partenaires potentiels'
    ],
    examples: ['Conseil Supérieur du Notariat', 'Annuaire notaires', 'Notaires de France'],
    keywords: ['scraping notaires', 'base de données notaires', 'extraction données notaires']
  },

  // ARTISANAT
  {
    slug: 'scraping-artisans',
    sector: 'Artisanat',
    title: 'Scraping artisans : extraction complète des artisans de France',
    description: 'Extraction de toutes les données d\'artisans depuis CAPEB, annuaires professionnels. Coordonnées, spécialités, certifications, zones d\'intervention.',
    useCase: 'Récupérer tous les artisans de France avec leurs coordonnées, spécialités, certifications RGE et zones d\'intervention.',
    dataExtracted: [
      'Nom et coordonnées complètes',
      'Spécialité principale et secondaires',
      'Certifications (RGE, Qualibat, etc.)',
      'Zones d\'intervention',
      'Avis clients et notes',
      'Années d\'expérience'
    ],
    benefits: [
      'Prospection ciblée artisans',
      'Analyse de marché artisanal',
      'Identification artisans certifiés RGE',
      'Veille concurrentielle'
    ],
    examples: ['CAPEB', 'Qualit\'EnR', 'Annuaire artisans', 'Artisans du Bâtiment'],
    keywords: ['scraping artisans', 'base de données artisans', 'extraction données artisans CAPEB']
  },
  {
    slug: 'scraping-artisans-rge',
    sector: 'Artisanat',
    title: 'Scraping artisans RGE : extraction des artisans certifiés',
    description: 'Extraction spécifique des artisans certifiés RGE (Reconnu Garant de l\'Environnement) pour rénovation énergétique.',
    useCase: 'Récupérer tous les artisans certifiés RGE avec leurs spécialités et zones d\'intervention pour rénovation énergétique.',
    dataExtracted: [
      'Certifications RGE détaillées',
      'Spécialités énergétiques',
      'Zones d\'intervention',
      'Coordonnées complètes',
      'Avis clients rénovation'
    ],
    benefits: [
      'Prospection artisans RGE',
      'Analyse marché rénovation énergétique',
      'Identification experts certifiés'
    ],
    examples: ['Qualit\'EnR', 'France Rénov', 'CAPEB RGE'],
    keywords: ['scraping artisans RGE', 'extraction artisans certifiés', 'base de données RGE']
  },

  // SANTÉ
  {
    slug: 'scraping-doctolib',
    sector: 'Santé',
    title: 'Scraping Doctolib : extraction complète des professionnels de santé',
    description: 'Extraction de toutes les données de professionnels de santé depuis Doctolib : médecins, spécialistes, disponibilités, avis patients.',
    useCase: 'Récupérer tout de Doctolib : professionnels de santé, spécialités, disponibilités, avis patients, coordonnées.',
    dataExtracted: [
      'Nom et spécialité',
      'Coordonnées et localisation',
      'Disponibilités et créneaux',
      'Avis patients et notes',
      'Tarifs et remboursements',
      'Langues parlées',
      'Modes de consultation'
    ],
    benefits: [
      'Analyse marché santé',
      'Prospection professionnels de santé',
      'Veille disponibilités',
      'Analyse avis patients'
    ],
    examples: ['Doctolib', 'Maiia', 'Qare'],
    keywords: ['scraping Doctolib', 'extraction données Doctolib', 'scraping professionnels santé']
  },
  {
    slug: 'scraping-pharmacies',
    sector: 'Santé',
    title: 'Scraping pharmacies : base de données complète des pharmacies',
    description: 'Extraction de toutes les pharmacies de France : coordonnées, horaires, services, pharmaciens responsables.',
    useCase: 'Récupérer toutes les pharmacies avec coordonnées, horaires, services proposés et pharmaciens responsables.',
    dataExtracted: [
      'Nom et coordonnées complètes',
      'Horaires d\'ouverture',
      'Services proposés',
      'Pharmacien responsable',
      'Garde de nuit',
      'Avis clients'
    ],
    benefits: [
      'Prospection pharmacies',
      'Analyse de marché pharmaceutique',
      'Identification pharmacies de garde',
      'Veille concurrentielle'
    ],
    examples: ['Ordre des Pharmaciens', 'Annuaire pharmacies', 'Pharmacies de garde'],
    keywords: ['scraping pharmacies', 'base de données pharmacies', 'extraction pharmacies']
  },
  {
    slug: 'scraping-laboratoires',
    sector: 'Santé',
    title: 'Scraping laboratoires : extraction des laboratoires d\'analyses',
    description: 'Extraction des données de laboratoires d\'analyses médicales : coordonnées, examens proposés, tarifs, délais.',
    useCase: 'Récupérer tous les laboratoires d\'analyses avec leurs examens proposés, tarifs et délais de rendu.',
    dataExtracted: [
      'Nom et coordonnées',
      'Examens proposés',
      'Tarifs et remboursements',
      'Délais de rendu',
      'Horaires prélèvements',
      'Avis patients'
    ],
    benefits: [
      'Prospection laboratoires',
      'Analyse marché analyses médicales',
      'Comparaison tarifs'
    ],
    examples: ['Biogroup', 'Cerba', 'Eurofins', 'Synlab'],
    keywords: ['scraping laboratoires', 'extraction laboratoires analyses', 'base de données laboratoires']
  },
  {
    slug: 'scraping-dentistes',
    sector: 'Santé',
    title: 'Scraping dentistes : extraction des dentistes et chirurgiens-dentistes',
    description: 'Extraction de toutes les données de dentistes : coordonnées, spécialités, tarifs, disponibilités.',
    useCase: 'Récupérer tous les dentistes avec leurs spécialités, tarifs et disponibilités pour analyse de marché.',
    dataExtracted: [
      'Nom et coordonnées',
      'Spécialités dentaires',
      'Tarifs et remboursements',
      'Disponibilités',
      'Avis patients',
      'Équipements et techniques'
    ],
    benefits: [
      'Prospection dentistes',
      'Analyse marché dentaire',
      'Veille tarifs'
    ],
    examples: ['Ordre des Chirurgiens-Dentistes', 'Doctolib dentistes', 'Annuaire dentistes'],
    keywords: ['scraping dentistes', 'extraction dentistes', 'base de données dentistes']
  },

  // FINANCE
  {
    slug: 'scraping-cgp',
    sector: 'Finance',
    title: 'Scraping CGP : extraction des conseillers en gestion de patrimoine',
    description: 'Extraction complète des données de CGP (Conseillers en Gestion de Patrimoine) : coordonnées, spécialités, performances.',
    useCase: 'Récupérer l\'ensemble des informations sur les CGP de France pour prospection et analyse de marché.',
    dataExtracted: [
      'Nom et coordonnées complètes',
      'Cabinet d\'appartenance',
      'Spécialités patrimoniales',
      'Zones d\'intervention',
      'Certifications et formations',
      'Avis clients'
    ],
    benefits: [
      'Prospection CGP',
      'Analyse marché gestion de patrimoine',
      'Identification experts spécialisés'
    ],
    examples: ['CGP France', 'CGPI', 'Annuaire CGP'],
    keywords: ['scraping CGP', 'extraction CGP', 'base de données conseillers patrimoine']
  },
  {
    slug: 'scraping-banques',
    sector: 'Finance',
    title: 'Scraping banques : extraction des agences bancaires',
    description: 'Extraction de toutes les agences bancaires : coordonnées, horaires, services, conseillers.',
    useCase: 'Récupérer toutes les agences bancaires avec leurs services, horaires et conseillers pour analyse de marché.',
    dataExtracted: [
      'Nom et coordonnées agence',
      'Horaires d\'ouverture',
      'Services proposés',
      'Conseillers disponibles',
      'Avis clients',
      'Spécialités'
    ],
    benefits: [
      'Prospection banques',
      'Analyse réseau bancaire',
      'Veille concurrentielle'
    ],
    examples: ['BNP Paribas', 'Crédit Agricole', 'Société Générale', 'LCL'],
    keywords: ['scraping banques', 'extraction agences bancaires', 'base de données banques']
  },
  {
    slug: 'scraping-assureurs',
    sector: 'Finance',
    title: 'Scraping assureurs : extraction des agences d\'assurance',
    description: 'Extraction des agences d\'assurance : coordonnées, produits, conseillers, tarifs.',
    useCase: 'Récupérer toutes les agences d\'assurance avec leurs produits, conseillers et tarifs.',
    dataExtracted: [
      'Nom et coordonnées',
      'Produits d\'assurance proposés',
      'Conseillers disponibles',
      'Tarifs et devis',
      'Avis clients',
      'Spécialités'
    ],
    benefits: [
      'Prospection assureurs',
      'Analyse marché assurance',
      'Comparaison produits'
    ],
    examples: ['Allianz', 'AXA', 'Groupama', 'Macif'],
    keywords: ['scraping assureurs', 'extraction agences assurance', 'base de données assurance']
  },

  // E-COMMERCE
  {
    slug: 'scraping-produits-ecommerce',
    sector: 'E-commerce',
    title: 'Scraping produits e-commerce : extraction de catalogues produits',
    description: 'Extraction automatique de catalogues produits depuis Amazon, Cdiscount, Fnac, Darty. Prix, descriptions, avis, stocks.',
    useCase: 'Récupérer tous les produits avec prix, descriptions, avis clients et stocks depuis les principaux sites e-commerce.',
    dataExtracted: [
      'Nom et description produit',
      'Prix et promotions',
      'Avis clients et notes',
      'Stock et disponibilité',
      'Caractéristiques techniques',
      'Images produits'
    ],
    benefits: [
      'Veille prix concurrentielle',
      'Analyse marché produits',
      'Détection opportunités',
      'Monitoring stocks'
    ],
    examples: ['Amazon', 'Cdiscount', 'Fnac', 'Darty', 'Boulanger', 'LDLC'],
    keywords: ['scraping e-commerce', 'extraction produits', 'scraping prix produits']
  },
  {
    slug: 'scraping-avis-clients',
    sector: 'E-commerce',
    title: 'Scraping avis clients : extraction des avis et reviews',
    description: 'Extraction automatique des avis clients depuis sites e-commerce, Trustpilot, Google Reviews.',
    useCase: 'Récupérer tous les avis clients avec notes, commentaires et dates pour analyse de réputation.',
    dataExtracted: [
      'Note et commentaire',
      'Date de publication',
      'Auteur et vérification',
      'Produit ou service concerné',
      'Réponse entreprise',
      'Utilité de l\'avis'
    ],
    benefits: [
      'Analyse réputation',
      'Veille e-réputation',
      'Analyse sentiment',
      'Identification problèmes'
    ],
    examples: ['Trustpilot', 'Google Reviews', 'Amazon Reviews', 'Avis Vérifiés'],
    keywords: ['scraping avis clients', 'extraction reviews', 'scraping e-réputation']
  },

  // RESTAURATION
  {
    slug: 'scraping-restaurants',
    sector: 'Restauration',
    title: 'Scraping restaurants : extraction des restaurants et établissements',
    description: 'Extraction de tous les restaurants depuis LaFourchette, TripAdvisor, Google Maps. Menus, avis, horaires, coordonnées.',
    useCase: 'Récupérer tous les restaurants avec menus, avis, horaires et coordonnées pour analyse de marché.',
    dataExtracted: [
      'Nom et coordonnées',
      'Type de cuisine',
      'Menus et prix',
      'Horaires d\'ouverture',
      'Avis clients et notes',
      'Photos et descriptions'
    ],
    benefits: [
      'Prospection restaurants',
      'Analyse marché restauration',
      'Veille concurrentielle',
      'Analyse avis clients'
    ],
    examples: ['LaFourchette', 'TripAdvisor', 'Google Maps', 'Yelp'],
    keywords: ['scraping restaurants', 'extraction restaurants', 'base de données restaurants']
  },
  {
    slug: 'scraping-deliveroo-ubereats',
    sector: 'Restauration',
    title: 'Scraping Deliveroo/UberEats : extraction des restaurants livraison',
    description: 'Extraction des restaurants disponibles sur Deliveroo, UberEats, Just Eat. Menus, prix, délais, avis.',
    useCase: 'Récupérer tous les restaurants de livraison avec menus, prix, délais et avis pour analyse de marché.',
    dataExtracted: [
      'Nom restaurant',
      'Menus et plats',
      'Prix et frais de livraison',
      'Délais de livraison',
      'Avis clients',
      'Zone de livraison'
    ],
    benefits: [
      'Analyse marché livraison',
      'Veille concurrentielle',
      'Analyse prix',
      'Détection tendances'
    ],
    examples: ['Deliveroo', 'UberEats', 'Just Eat', 'Stuart'],
    keywords: ['scraping Deliveroo', 'scraping UberEats', 'extraction livraison']
  },

  // ÉDUCATION
  {
    slug: 'scraping-ecoles',
    sector: 'Éducation',
    title: 'Scraping écoles : extraction des établissements scolaires',
    description: 'Extraction de toutes les écoles, collèges, lycées : coordonnées, spécialités, résultats, avis.',
    useCase: 'Récupérer tous les établissements scolaires avec leurs spécialités, résultats et avis pour analyse.',
    dataExtracted: [
      'Nom et coordonnées',
      'Niveau (primaire, collège, lycée)',
      'Spécialités et options',
      'Résultats examens',
      'Avis parents',
      'Effectifs'
    ],
    benefits: [
      'Prospection établissements',
      'Analyse marché éducatif',
      'Comparaison établissements'
    ],
    examples: ['Ministère Éducation', 'Annuaire écoles', 'L\'Étudiant'],
    keywords: ['scraping écoles', 'extraction établissements scolaires', 'base de données écoles']
  },
  {
    slug: 'scraping-formations',
    sector: 'Éducation',
    title: 'Scraping formations : extraction des centres de formation',
    description: 'Extraction des centres de formation professionnelle : coordonnées, formations proposées, tarifs, avis.',
    useCase: 'Récupérer tous les centres de formation avec leurs formations, tarifs et avis pour analyse.',
    dataExtracted: [
      'Nom et coordonnées',
      'Formations proposées',
      'Tarifs et financements',
      'Durées et modalités',
      'Avis stagiaires',
      'Certifications'
    ],
    benefits: [
      'Prospection centres formation',
      'Analyse marché formation',
      'Comparaison offres'
    ],
    examples: ['Pôle Emploi', 'CPF', 'Annuaire formations'],
    keywords: ['scraping formations', 'extraction centres formation', 'base de données formations']
  },

  // SPORT & LOISIRS
  {
    slug: 'scraping-salles-sport',
    sector: 'Sport & Loisirs',
    title: 'Scraping salles de sport : extraction des salles et clubs',
    description: 'Extraction de toutes les salles de sport : coordonnées, équipements, tarifs, avis.',
    useCase: 'Récupérer toutes les salles de sport avec équipements, tarifs et avis pour analyse de marché.',
    dataExtracted: [
      'Nom et coordonnées',
      'Équipements disponibles',
      'Tarifs et abonnements',
      'Horaires',
      'Avis clients',
      'Services proposés'
    ],
    benefits: [
      'Prospection salles sport',
      'Analyse marché fitness',
      'Comparaison tarifs',
      'Veille concurrentielle'
    ],
    examples: ['Basic-Fit', 'Fitness Park', 'KeepCool', 'Orange Bleue'],
    keywords: ['scraping salles sport', 'extraction salles fitness', 'base de données salles sport']
  },
  {
    slug: 'scraping-clubs-sport',
    sector: 'Sport & Loisirs',
    title: 'Scraping clubs sportifs : extraction des clubs et associations',
    description: 'Extraction des clubs sportifs : coordonnées, disciplines, tarifs, horaires.',
    useCase: 'Récupérer tous les clubs sportifs avec leurs disciplines, tarifs et horaires.',
    dataExtracted: [
      'Nom et coordonnées',
      'Disciplines proposées',
      'Tarifs et cotisations',
      'Horaires entraînements',
      'Avis membres',
      'Équipements'
    ],
    benefits: [
      'Prospection clubs sportifs',
      'Analyse marché sport',
      'Identification opportunités'
    ],
    examples: ['FFR', 'FFT', 'FFFA', 'Fédérations sportives'],
    keywords: ['scraping clubs sportifs', 'extraction clubs sport', 'base de données clubs']
  },

  // BEAUTÉ & BIEN-ÊTRE
  {
    slug: 'scraping-salons-coiffure',
    sector: 'Beauté & Bien-être',
    title: 'Scraping salons de coiffure : extraction des salons',
    description: 'Extraction de tous les salons de coiffure : coordonnées, services, tarifs, avis.',
    useCase: 'Récupérer tous les salons de coiffure avec services, tarifs et avis pour analyse.',
    dataExtracted: [
      'Nom et coordonnées',
      'Services proposés',
      'Tarifs',
      'Horaires',
      'Avis clients',
      'Coiffeurs disponibles'
    ],
    benefits: [
      'Prospection salons',
      'Analyse marché coiffure',
      'Comparaison tarifs'
    ],
    examples: ['SalonLook', 'Google Maps', 'PagesJaunes'],
    keywords: ['scraping salons coiffure', 'extraction salons', 'base de données coiffure']
  },
  {
    slug: 'scraping-instituts-beaute',
    sector: 'Beauté & Bien-être',
    title: 'Scraping instituts de beauté : extraction des instituts',
    description: 'Extraction des instituts de beauté : coordonnées, soins proposés, tarifs, avis.',
    useCase: 'Récupérer tous les instituts de beauté avec soins, tarifs et avis.',
    dataExtracted: [
      'Nom et coordonnées',
      'Soins proposés',
      'Tarifs',
      'Horaires',
      'Avis clients',
      'Équipements'
    ],
    benefits: [
      'Prospection instituts',
      'Analyse marché beauté',
      'Veille concurrentielle'
    ],
    examples: ['Google Maps', 'PagesJaunes', 'Yelp'],
    keywords: ['scraping instituts beauté', 'extraction instituts', 'base de données beauté']
  },

  // AUTOMOBILE
  {
    slug: 'scraping-concessionnaires',
    sector: 'Automobile',
    title: 'Scraping concessionnaires : extraction des concessions auto',
    description: 'Extraction de toutes les concessions automobiles : coordonnées, modèles, prix, stocks.',
    useCase: 'Récupérer toutes les concessions avec modèles disponibles, prix et stocks pour analyse.',
    dataExtracted: [
      'Nom et coordonnées',
      'Marques représentées',
      'Modèles disponibles',
      'Prix et promotions',
      'Stocks véhicules',
      'Services proposés'
    ],
    benefits: [
      'Prospection concessionnaires',
      'Analyse marché automobile',
      'Veille prix',
      'Détection opportunités'
    ],
    examples: ['LaCentrale', 'L\'Argus', 'AutoScout24'],
    keywords: ['scraping concessionnaires', 'extraction concessions auto', 'base de données auto']
  },
  {
    slug: 'scraping-annonces-voitures',
    sector: 'Automobile',
    title: 'Scraping annonces voitures : extraction des véhicules d\'occasion',
    description: 'Extraction automatique des annonces de véhicules depuis LaCentrale, Leboncoin, AutoScout24.',
    useCase: 'Récupérer toutes les annonces de véhicules avec prix, caractéristiques et localisation.',
    dataExtracted: [
      'Marque et modèle',
      'Prix et kilométrage',
      'Caractéristiques techniques',
      'Localisation',
      'Photos',
      'Historique véhicule'
    ],
    benefits: [
      'Analyse marché occasion',
      'Veille prix',
      'Détection opportunités',
      'Comparaison offres'
    ],
    examples: ['LaCentrale', 'Leboncoin', 'AutoScout24', 'ParuVendu'],
    keywords: ['scraping annonces voitures', 'extraction véhicules', 'scraping auto occasion']
  },

  // HÔTELLERIE
  {
    slug: 'scraping-hotels',
    sector: 'Hôtellerie',
    title: 'Scraping hôtels : extraction des établissements hôteliers',
    description: 'Extraction de tous les hôtels depuis Booking, Expedia, Hotels.com. Prix, disponibilités, avis.',
    useCase: 'Récupérer tous les hôtels avec prix, disponibilités et avis pour analyse de marché.',
    dataExtracted: [
      'Nom et coordonnées',
      'Prix et disponibilités',
      'Équipements et services',
      'Avis clients',
      'Notes et classements',
      'Photos'
    ],
    benefits: [
      'Prospection hôtels',
      'Analyse marché hôtelier',
      'Veille prix',
      'Analyse avis'
    ],
    examples: ['Booking', 'Expedia', 'Hotels.com', 'TripAdvisor'],
    keywords: ['scraping hôtels', 'extraction hôtels', 'base de données hôtels']
  },
  {
    slug: 'scraping-campings',
    sector: 'Hôtellerie',
    title: 'Scraping campings : extraction des campings',
    description: 'Extraction de tous les campings : coordonnées, équipements, tarifs, avis.',
    useCase: 'Récupérer tous les campings avec équipements, tarifs et avis.',
    dataExtracted: [
      'Nom et coordonnées',
      'Équipements',
      'Tarifs et disponibilités',
      'Avis clients',
      'Services proposés',
      'Localisation'
    ],
    benefits: [
      'Prospection campings',
      'Analyse marché camping',
      'Comparaison offres'
    ],
    examples: ['CampingFrance', 'HPA', 'Google Maps'],
    keywords: ['scraping campings', 'extraction campings', 'base de données campings']
  },

  // JURIDIQUE
  {
    slug: 'scraping-avocats',
    sector: 'Juridique',
    title: 'Scraping avocats : extraction des cabinets d\'avocats',
    description: 'Extraction de tous les cabinets d\'avocats : coordonnées, spécialités, tarifs, avis.',
    useCase: 'Récupérer tous les cabinets d\'avocats avec spécialités, tarifs et avis pour prospection.',
    dataExtracted: [
      'Nom et coordonnées',
      'Spécialités juridiques',
      'Tarifs et honoraires',
      'Avis clients',
      'Barreau d\'appartenance',
      'Expérience'
    ],
    benefits: [
      'Prospection avocats',
      'Analyse marché juridique',
      'Identification experts spécialisés'
    ],
    examples: ['Ordre des Avocats', 'Annuaire avocats', 'Avocat.fr'],
    keywords: ['scraping avocats', 'extraction avocats', 'base de données avocats']
  },
  {
    slug: 'scraping-huissiers',
    sector: 'Juridique',
    title: 'Scraping huissiers : extraction des études d\'huissiers',
    description: 'Extraction des études d\'huissiers de justice : coordonnées, compétences, tarifs.',
    useCase: 'Récupérer toutes les études d\'huissiers avec compétences et tarifs.',
    dataExtracted: [
      'Nom et coordonnées',
      'Compétences',
      'Tarifs',
      'Zone d\'intervention',
      'Avis clients'
    ],
    benefits: [
      'Prospection huissiers',
      'Analyse marché huissiers',
      'Identification experts'
    ],
    examples: ['Chambre Nationale Huissiers', 'Annuaire huissiers'],
    keywords: ['scraping huissiers', 'extraction huissiers', 'base de données huissiers']
  },

  // IMMOBILIER PROFESSIONNEL
  {
    slug: 'scraping-bureaux',
    sector: 'Immobilier Professionnel',
    title: 'Scraping bureaux : extraction des espaces de bureaux',
    description: 'Extraction des espaces de bureaux et coworking : coordonnées, surfaces, prix, disponibilités.',
    useCase: 'Récupérer tous les espaces de bureaux avec surfaces, prix et disponibilités pour analyse.',
    dataExtracted: [
      'Nom et coordonnées',
      'Surface disponible',
      'Prix et charges',
      'Disponibilités',
      'Équipements',
      'Avis locataires'
    ],
    benefits: [
      'Prospection bureaux',
      'Analyse marché immobilier pro',
      'Veille prix',
      'Détection opportunités'
    ],
    examples: ['BureauxLocaux', 'SeLoger Pro', 'Century 21 Pro'],
    keywords: ['scraping bureaux', 'extraction bureaux', 'base de données bureaux']
  },
  {
    slug: 'scraping-locaux-commerciaux',
    sector: 'Immobilier Professionnel',
    title: 'Scraping locaux commerciaux : extraction des commerces',
    description: 'Extraction des locaux commerciaux à vendre ou louer : coordonnées, surfaces, prix.',
    useCase: 'Récupérer tous les locaux commerciaux avec surfaces, prix et localisation.',
    dataExtracted: [
      'Type de local',
      'Surface',
      'Prix et charges',
      'Localisation',
      'Disponibilité',
      'Caractéristiques'
    ],
    benefits: [
      'Prospection locaux commerciaux',
      'Analyse marché immobilier pro',
      'Détection opportunités'
    ],
    examples: ['SeLoger Pro', 'Logic-immo Pro', 'Century 21 Pro'],
    keywords: ['scraping locaux commerciaux', 'extraction commerces', 'base de données locaux']
  },

  // TRANSPORT & LOGISTIQUE
  {
    slug: 'scraping-transporteurs',
    sector: 'Transport & Logistique',
    title: 'Scraping transporteurs : extraction des entreprises de transport',
    description: 'Extraction des entreprises de transport : coordonnées, services, tarifs, zones.',
    useCase: 'Récupérer toutes les entreprises de transport avec services, tarifs et zones d\'intervention.',
    dataExtracted: [
      'Nom et coordonnées',
      'Services proposés',
      'Tarifs',
      'Zones d\'intervention',
      'Avis clients',
      'Flotte véhicules'
    ],
    benefits: [
      'Prospection transporteurs',
      'Analyse marché transport',
      'Comparaison tarifs'
    ],
    examples: ['PagesJaunes', 'Google Maps', 'Annuaire transport'],
    keywords: ['scraping transporteurs', 'extraction transport', 'base de données transport']
  },
  {
    slug: 'scraping-logisticiens',
    sector: 'Transport & Logistique',
    title: 'Scraping logisticiens : extraction des prestataires logistiques',
    description: 'Extraction des prestataires logistiques : coordonnées, services, capacités, tarifs.',
    useCase: 'Récupérer tous les prestataires logistiques avec services et capacités.',
    dataExtracted: [
      'Nom et coordonnées',
      'Services logistiques',
      'Capacités de stockage',
      'Tarifs',
      'Zones d\'intervention',
      'Avis clients'
    ],
    benefits: [
      'Prospection logisticiens',
      'Analyse marché logistique',
      'Identification partenaires'
    ],
    examples: ['PagesJaunes', 'Google Maps', 'Annuaire logistique'],
    keywords: ['scraping logisticiens', 'extraction logistique', 'base de données logistique']
  },

  // TECH & STARTUPS
  {
    slug: 'scraping-startups',
    sector: 'Tech & Startups',
    title: 'Scraping startups : extraction des startups françaises',
    description: 'Extraction des startups depuis LaFrenchTech, Crunchbase, LinkedIn. Financements, équipes, secteurs.',
    useCase: 'Récupérer toutes les startups avec financements, équipes et secteurs pour analyse.',
    dataExtracted: [
      'Nom et coordonnées',
      'Secteur d\'activité',
      'Financements levés',
      'Équipe et fondateurs',
      'Stade de développement',
      'Technologies utilisées'
    ],
    benefits: [
      'Prospection startups',
      'Analyse écosystème tech',
      'Veille concurrentielle',
      'Identification opportunités'
    ],
    examples: ['LaFrenchTech', 'Crunchbase', 'LinkedIn', 'Station F'],
    keywords: ['scraping startups', 'extraction startups', 'base de données startups']
  },
  {
    slug: 'scraping-freelances',
    sector: 'Tech & Startups',
    title: 'Scraping freelances : extraction des freelances tech',
    description: 'Extraction des freelances depuis Malt, Comet, Upwork. Compétences, tarifs, avis.',
    useCase: 'Récupérer tous les freelances avec compétences, tarifs et avis pour analyse de marché.',
    dataExtracted: [
      'Nom et coordonnées',
      'Compétences techniques',
      'Tarifs',
      'Avis clients',
      'Disponibilité',
      'Portfolio'
    ],
    benefits: [
      'Analyse marché freelance',
      'Veille concurrentielle',
      'Comparaison tarifs'
    ],
    examples: ['Malt', 'Comet', 'Upwork', 'Fiverr'],
    keywords: ['scraping freelances', 'extraction freelances', 'base de données freelances']
  },

  // RÉSEAUX SOCIAUX & LEAD GENERATION
  {
    slug: 'scraping-linkedin-profiles',
    sector: 'Réseaux Sociaux & Lead Generation',
    title: 'Scraping LinkedIn : extraction de profils et entreprises',
    description: 'Extraction complète de profils LinkedIn, entreprises, employés, posts et jobs. Recherche avancée avec filtres, extraction d\'emails, coordonnées complètes.',
    useCase: 'Récupérer tous les profils LinkedIn correspondant à vos critères de recherche : poste, localisation, entreprise, secteur. Extraction d\'emails et coordonnées pour prospection.',
    dataExtracted: [
      'Nom et coordonnées complètes',
      'Poste actuel et historique',
      'Entreprise et secteur',
      'Localisation',
      'Email professionnel',
      'URL LinkedIn',
      'Expérience et formation',
      'Compétences'
    ],
    benefits: [
      'Prospection B2B ciblée',
      'Lead generation automatisée',
      'Analyse de marché RH',
      'Veille concurrentielle'
    ],
    examples: ['LinkedIn', 'LinkedIn Sales Navigator', 'LinkedIn Recruiter'],
    keywords: ['scraping LinkedIn', 'extraction profils LinkedIn', 'lead generation LinkedIn', 'scraping entreprises LinkedIn']
  },
  {
    slug: 'scraping-linkedin-jobs',
    sector: 'Réseaux Sociaux & Lead Generation',
    title: 'Scraping LinkedIn Jobs : extraction des offres d\'emploi',
    description: 'Extraction automatique de toutes les offres d\'emploi LinkedIn avec détails complets : entreprise, localisation, salaire, description, candidats.',
    useCase: 'Récupérer toutes les offres d\'emploi LinkedIn par secteur, localisation ou entreprise pour analyse de marché RH et veille concurrentielle.',
    dataExtracted: [
      'Titre et description du poste',
      'Entreprise et localisation',
      'Salaire et avantages',
      'Type de contrat',
      'Nombre de candidats',
      'Date de publication',
      'URL de l\'offre'
    ],
    benefits: [
      'Analyse marché de l\'emploi',
      'Veille salaires',
      'Identification opportunités',
      'Analyse concurrentielle RH'
    ],
    examples: ['LinkedIn Jobs', 'Indeed', 'Welcome to the Jungle'],
    keywords: ['scraping LinkedIn Jobs', 'extraction offres emploi', 'scraping jobs', 'analyse marché RH']
  },
  {
    slug: 'scraping-instagram',
    sector: 'Réseaux Sociaux & Lead Generation',
    title: 'Scraping Instagram : extraction de posts, followers, mentions',
    description: 'Extraction complète de données Instagram : posts, followers, following, mentions, hashtags, commentaires, likes. Analyse de performance et engagement.',
    useCase: 'Récupérer tous les posts Instagram d\'un compte, d\'un hashtag ou d\'une localisation. Analyser les followers, mentions et engagement pour veille concurrentielle.',
    dataExtracted: [
      'Posts et descriptions',
      'Hashtags et mentions',
      'Followers et following',
      'Commentaires et likes',
      'Localisation',
      'Date de publication',
      'Métriques d\'engagement'
    ],
    benefits: [
      'Veille concurrentielle social media',
      'Analyse d\'influenceurs',
      'Monitoring de marque',
      'Lead generation Instagram'
    ],
    examples: ['Instagram', 'Instagram Business', 'Creator Studio'],
    keywords: ['scraping Instagram', 'extraction Instagram', 'scraping followers Instagram', 'analyse Instagram']
  },
  {
    slug: 'scraping-twitter-x',
    sector: 'Réseaux Sociaux & Lead Generation',
    title: 'Scraping Twitter/X : extraction de tweets, followers, profils',
    description: 'Extraction complète de données Twitter/X : tweets, replies, followers, following, profils. Analyse de tendances et monitoring de marque.',
    useCase: 'Récupérer tous les tweets d\'un compte, d\'un hashtag ou d\'une recherche. Analyser les followers et engagement pour veille concurrentielle et monitoring.',
    dataExtracted: [
      'Tweets et replies',
      'Followers et following',
      'Profils utilisateurs',
      'Hashtags et mentions',
      'Likes et retweets',
      'Date de publication',
      'Métriques d\'engagement'
    ],
    benefits: [
      'Monitoring de marque',
      'Veille concurrentielle',
      'Analyse de tendances',
      'Lead generation Twitter'
    ],
    examples: ['Twitter', 'X.com', 'TweetDeck'],
    keywords: ['scraping Twitter', 'scraping X', 'extraction tweets', 'scraping followers Twitter']
  },
  {
    slug: 'scraping-youtube-comments',
    sector: 'Réseaux Sociaux & Lead Generation',
    title: 'Scraping YouTube : extraction de commentaires et métriques',
    description: 'Extraction automatique des commentaires YouTube, métriques vidéos, abonnés, vues. Analyse de sentiment et engagement.',
    useCase: 'Récupérer tous les commentaires d\'une vidéo YouTube ou d\'une chaîne pour analyse de sentiment, monitoring de marque ou lead generation.',
    dataExtracted: [
      'Commentaires et réponses',
      'Auteur et date',
      'Likes et réactions',
      'Métriques vidéo (vues, likes)',
      'Abonnés chaîne',
      'Description et tags'
    ],
    benefits: [
      'Analyse de sentiment',
      'Monitoring de marque',
      'Veille concurrentielle',
      'Lead generation YouTube'
    ],
    examples: ['YouTube', 'YouTube Studio', 'YouTube Analytics'],
    keywords: ['scraping YouTube', 'extraction commentaires YouTube', 'scraping métriques YouTube']
  },
  {
    slug: 'scraping-facebook-marketplace',
    sector: 'E-commerce',
    title: 'Scraping Facebook Marketplace : extraction d\'annonces',
    description: 'Extraction automatique des annonces Facebook Marketplace : produits, prix, localisation, vendeurs. Analyse de marché et veille concurrentielle.',
    useCase: 'Récupérer toutes les annonces Facebook Marketplace par catégorie, localisation ou prix pour analyse de marché et veille concurrentielle.',
    dataExtracted: [
      'Produit et description',
      'Prix et négociation',
      'Localisation',
      'Vendeur et contact',
      'Photos et caractéristiques',
      'Date de publication',
      'Statut (disponible/vendu)'
    ],
    benefits: [
      'Analyse de marché',
      'Veille concurrentielle',
      'Détection opportunités',
      'Monitoring prix'
    ],
    examples: ['Facebook Marketplace', 'Facebook Groups'],
    keywords: ['scraping Facebook Marketplace', 'extraction annonces Facebook', 'scraping marketplace']
  },
  {
    slug: 'scraping-amazon-reviews',
    sector: 'E-commerce',
    title: 'Scraping Amazon : extraction d\'avis clients et produits',
    description: 'Extraction automatique des avis clients Amazon, notes, commentaires, questions/réponses. Analyse de sentiment et monitoring de produits.',
    useCase: 'Récupérer tous les avis clients d\'un produit Amazon pour analyse de sentiment, monitoring de réputation ou veille concurrentielle.',
    dataExtracted: [
      'Avis et notes',
      'Commentaires détaillés',
      'Auteur et date',
      'Utilité de l\'avis',
      'Questions/réponses',
      'Caractéristiques produit',
      'Prix et disponibilité'
    ],
    benefits: [
      'Analyse de sentiment',
      'Monitoring de réputation',
      'Veille concurrentielle',
      'Amélioration produit'
    ],
    examples: ['Amazon', 'Amazon.fr', 'Amazon Marketplace'],
    keywords: ['scraping Amazon', 'extraction avis Amazon', 'scraping reviews Amazon', 'analyse sentiment Amazon']
  },
  {
    slug: 'scraping-google-trends',
    sector: 'SEO & Analytics',
    title: 'Scraping Google Trends : extraction de tendances de recherche',
    description: 'Extraction automatique des données Google Trends : tendances par région, requêtes associées, intérêt dans le temps. Analyse SEO et veille marché.',
    useCase: 'Récupérer les tendances de recherche Google par mot-clé, région ou période pour analyse SEO, veille marché ou identification d\'opportunités.',
    dataExtracted: [
      'Tendances de recherche',
      'Intérêt par région',
      'Requêtes associées',
      'Évolution dans le temps',
      'Catégories',
      'Comparaison de mots-clés'
    ],
    benefits: [
      'Analyse SEO',
      'Veille marché',
      'Identification tendances',
      'Optimisation contenu'
    ],
    examples: ['Google Trends', 'Google Keyword Planner'],
    keywords: ['scraping Google Trends', 'extraction tendances Google', 'analyse SEO', 'veille tendances']
  },
  {
    slug: 'scraping-indeed-jobs',
    sector: 'Recrutement & RH',
    title: 'Scraping Indeed : extraction d\'offres d\'emploi',
    description: 'Extraction automatique des offres d\'emploi Indeed : poste, entreprise, localisation, salaire, description. Analyse de marché RH et veille salaires.',
    useCase: 'Récupérer toutes les offres d\'emploi Indeed par secteur, localisation ou salaire pour analyse de marché RH, veille salaires ou identification d\'opportunités.',
    dataExtracted: [
      'Titre et description du poste',
      'Entreprise et localisation',
      'Salaire et avantages',
      'Type de contrat',
      'Date de publication',
      'URL de l\'offre',
      'Requis et qualifications'
    ],
    benefits: [
      'Analyse marché RH',
      'Veille salaires',
      'Identification opportunités',
      'Benchmarking'
    ],
    examples: ['Indeed', 'Indeed.fr', 'Indeed Recruiter'],
    keywords: ['scraping Indeed', 'extraction offres emploi Indeed', 'scraping jobs Indeed', 'analyse marché RH']
  },
  {
    slug: 'scraping-zillow-immobilier',
    sector: 'Immobilier',
    title: 'Scraping Zillow : extraction de biens immobiliers',
    description: 'Extraction automatique des biens immobiliers Zillow : prix, caractéristiques, localisation, historique. Analyse de marché immobilier.',
    useCase: 'Récupérer tous les biens immobiliers Zillow par code postal, prix ou caractéristiques pour analyse de marché immobilier et veille concurrentielle.',
    dataExtracted: [
      'Prix et type de transaction',
      'Caractéristiques du bien',
      'Localisation précise',
      'Photos et descriptions',
      'Historique des prix',
      'Estimation Zillow',
      'Contact agent'
    ],
    benefits: [
      'Analyse marché immobilier',
      'Veille prix',
      'Détection opportunités',
      'Benchmarking'
    ],
    examples: ['Zillow', 'Zillow.com', 'Zillow Premier Agent'],
    keywords: ['scraping Zillow', 'extraction biens Zillow', 'scraping immobilier USA', 'analyse marché immobilier']
  },
  {
    slug: 'scraping-g2-reviews',
    sector: 'SaaS & Tech',
    title: 'Scraping G2 : extraction d\'avis produits SaaS',
    description: 'Extraction automatique des avis produits G2 : notes, commentaires, fonctionnalités, comparaisons. Analyse de marché SaaS et veille concurrentielle.',
    useCase: 'Récupérer tous les avis G2 d\'un produit SaaS pour analyse de sentiment, monitoring de réputation ou veille concurrentielle.',
    dataExtracted: [
      'Avis et notes',
      'Commentaires détaillés',
      'Fonctionnalités évaluées',
      'Comparaisons produits',
      'Auteur et entreprise',
      'Date de publication',
      'Recommandation'
    ],
    benefits: [
      'Analyse marché SaaS',
      'Veille concurrentielle',
      'Monitoring de réputation',
      'Amélioration produit'
    ],
    examples: ['G2', 'G2.com', 'G2 Crowd'],
    keywords: ['scraping G2', 'extraction avis G2', 'scraping reviews SaaS', 'analyse marché SaaS']
  },
  {
    slug: 'scraping-pinterest',
    sector: 'E-commerce & Marketing',
    title: 'Scraping Pinterest : extraction de pins et boards',
    description: 'Extraction automatique de données Pinterest : pins, boards, utilisateurs, hashtags, prix. Analyse de tendances et veille concurrentielle.',
    useCase: 'Récupérer tous les pins Pinterest d\'un compte, d\'un board ou d\'un hashtag pour analyse de tendances, veille concurrentielle ou lead generation.',
    dataExtracted: [
      'Pins et descriptions',
      'Boards et catégories',
      'Utilisateurs et followers',
      'Hashtags et mentions',
      'Prix et liens produits',
      'Images et vidéos',
      'Métriques d\'engagement'
    ],
    benefits: [
      'Analyse de tendances',
      'Veille concurrentielle',
      'Lead generation',
      'Monitoring de marque'
    ],
    examples: ['Pinterest', 'Pinterest Business', 'Pinterest Analytics'],
    keywords: ['scraping Pinterest', 'extraction pins Pinterest', 'scraping boards Pinterest', 'analyse Pinterest']
  },
  {
    slug: 'scraping-skip-trace',
    sector: 'Recherche & Investigation',
    title: 'Skip Trace : localisation de personnes difficiles à trouver',
    description: 'Extraction de données de localisation depuis TruePeopleSearch, Fastpeoplesearch, Lead Finder, Truthfinder, Spokeo, BeenVerified. Recherche de personnes.',
    useCase: 'Localiser des personnes difficiles à trouver en croisant plusieurs sources de données publiques pour recherche, investigation ou vérification d\'identité.',
    dataExtracted: [
      'Nom et coordonnées',
      'Adresses actuelles et passées',
      'Numéros de téléphone',
      'Emails',
      'Réseaux sociaux',
      'Historique d\'adresses',
      'Liens familiaux'
    ],
    benefits: [
      'Recherche de personnes',
      'Vérification d\'identité',
      'Investigation',
      'Localisation contacts'
    ],
    examples: ['TruePeopleSearch', 'Fastpeoplesearch', 'Spokeo', 'BeenVerified', 'Truthfinder'],
    keywords: ['skip trace', 'localisation personnes', 'recherche personnes', 'investigation']
  },
  {
    slug: 'scraping-leads-avec-emails',
    sector: 'Réseaux Sociaux & Lead Generation',
    title: 'Scraping leads avec emails : extraction de contacts B2B',
    description: 'Extraction de leads B2B avec emails vérifiés depuis LinkedIn, Apollo, ZoomInfo, Lusha. Profils complets avec coordonnées, poste, entreprise.',
    useCase: 'Récupérer jusqu\'à 50 000 leads B2B avec emails vérifiés, numéros de téléphone et profils LinkedIn complets pour prospection automatisée.',
    dataExtracted: [
      'Nom et coordonnées',
      'Email professionnel vérifié',
      'Numéro de téléphone',
      'Poste et entreprise',
      'URL LinkedIn',
      'Localisation',
      'Secteur d\'activité'
    ],
    benefits: [
      'Lead generation B2B',
      'Prospection automatisée',
      'Enrichissement CRM',
      'Campagnes emailing'
    ],
    examples: ['Apollo', 'ZoomInfo', 'Lusha', 'LinkedIn Sales Navigator'],
    keywords: ['scraping leads', 'extraction emails B2B', 'lead generation', 'prospection automatisée']
  }
]

// Fonction pour obtenir tous les cas d'usage d'un secteur
export function getCaseStudiesBySector(sector) {
  return caseStudies.filter(cs => cs.sector === sector)
}

// Fonction pour obtenir un cas d'usage par slug
export function getCaseStudyBySlug(slug) {
  return caseStudies.find(cs => cs.slug === slug)
}

// Fonction pour obtenir tous les secteurs uniques
export function getAllSectors() {
  return [...new Set(caseStudies.map(cs => cs.sector))]
}

// Fonction pour obtenir les cas d'usage les plus pertinents (pour suggestions)
export function getRelatedCaseStudies(currentSlug, limit = 3) {
  const current = getCaseStudyBySlug(currentSlug)
  if (!current) return []
  
  return caseStudies
    .filter(cs => cs.slug !== currentSlug && cs.sector === current.sector)
    .slice(0, limit)
}

