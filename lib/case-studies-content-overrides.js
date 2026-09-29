/**
 * Overrides de contenu pour les fiches /cas-usage qui reçoivent du trafic search.
 * Pas de chiffres inventés, pas de clients fictifs.
 * Appliqué au chargement de la fiche (blob + props), sans toucher au chrome UI.
 */

/** @typedef {{
 *   description?: string,
 *   metaDescription?: string,
 *   dataExtracted?: string[],
 *   benefits?: string[],
 *   examples?: string[],
 *   relatedInternal?: { href: string, label: string },
 *   personalized?: {
 *     whyUseCase?: {
 *       problemsSolved?: string,
 *       concreteExamples?: string,
 *       businessImpact?: string,
 *     }
 *   }
 * }} CaseStudyContentOverride */

/** @type {Record<string, CaseStudyContentOverride>} */
export const CASE_STUDY_CONTENT_OVERRIDES = {
  'scraping-telegram-extraction-des-membres-de-groupes': {
    description:
      'Collecte les membres visibles d’un groupe ou canal Telegram : identifiant, username, nom affiché. Le fichier sert à constituer une liste de contacts pour un outreach manuel ou un CRM, à partir d’un groupe déjà ciblé.',
    metaDescription:
      'Extraction des membres de groupes Telegram : username, nom, id. Pour outreach et CRM, à partir d’un groupe ciblé.',
    dataExtracted: [
      'Identifiant utilisateur Telegram',
      'Username',
      'Nom affiché',
      'Statut / rôle dans le groupe (si visible)',
    ],
    benefits: [
      'Liste de membres exportable',
      'Ciblage par groupe thématique',
      'Alimentation CRM / outreach',
      'Pas de saisie manuelle membre par membre',
    ],
    examples: ['Telegram (groupes et canaux publics ou accessibles)'],
    personalized: {
      whyUseCase: {
        problemsSolved:
          'Sur Telegram, les membres d’un groupe pertinent sont souvent la vraie liste de prospects, mais les copier à la main ne tient pas dès que le groupe dépasse quelques dizaines de personnes. Cette fiche vise l’export structuré des profils visibles (id, username, nom) pour un usage commercial ou communautaire.',
        concreteExamples:
          'Exemple : un éditeur B2B qui suit un groupe métier récupère les usernames pour une séquence d’approche hors plateforme. Autre usage : qualifier une audience avant d’animer un canal ou une campagne, en partant du groupe où elle est déjà présente.',
        businessImpact:
          'Le livrable est un fichier (CSV / Excel / JSON) prêt à importer. Pas de volume ni de taux de conversion promis ici : ça dépend du groupe et de votre process d’outreach.',
      },
    },
  },

  'scraping-letrot-extraction-des-donnees-de-courses': {
    description:
      'Extraction des données de courses de trot sur letrot.com : réunions, partants, résultats et cotes quand elles sont publiées. Pour analyse de résultats ou modèles, pas pour contourner les conditions du site.',
    metaDescription:
      'Scraping LeTrot : partants, résultats et cotes de courses de trot sur letrot.com, en fichier structuré.',
    dataExtracted: [
      'Date et hippodrome / réunion',
      'Nom de la course',
      'Partants (chevaux)',
      'Drivers / jockeys (si affichés)',
      'Résultats et positions',
      'Cotes (si publiées)',
    ],
    benefits: [
      'Historique de courses structuré',
      'Suivi de partants et résultats',
      'Entrée pour analyse / modèles',
      'Export CSV ou JSON',
    ],
    examples: ['letrot.com'],
    personalized: {
      whyUseCase: {
        problemsSolved:
          'Les pages LeTrot exposent réunions, partants et résultats, mais pas un export propre pour croiser plusieurs réunions. La collecte manuelle casse dès qu’on veut un historique ou un fichier prêt pour un tableur / un modèle.',
        concreteExamples:
          'Construire un historique de résultats sur une période, suivre les partants d’un cheval, ou alimenter un modèle local avec courses + cotes affichées — sans inventer de champs absents de la page.',
        businessImpact:
          'Le fichier reprend ce que le site affiche (réunions, partants, résultats, cotes). Aucun pourcentage de gain ni promesse de performance de paris.',
      },
    },
  },

  'scraping-zeturf-extraction-des-donnees-de-courses': {
    description:
      'Extraction sur Zeturf.fr des programmes, résultats et stats de courses hippiques affichés : date, course, cheval, position, cote. Pour suivi et analyse, en respectant les règles du site.',
    metaDescription:
      'Scraping Zeturf : programmes, résultats et cotes de courses hippiques, export CSV / JSON.',
    dataExtracted: [
      'Date',
      'Course',
      'Cheval',
      'Jockey (si affiché)',
      'Position / résultat',
      'Cote (si affichée)',
    ],
    benefits: [
      'Programmes et résultats en fichier',
      'Suivi de performances affichées',
      'Base pour analyse personnelle',
      'Moins de copier-coller',
    ],
    examples: ['zeturf.fr'],
    personalized: {
      whyUseCase: {
        problemsSolved:
          'Zeturf publie programmes et résultats course par course. Pour un historique exploitable (filtre, jointure, modèle), il faut un export tabulaire plutôt que des captures d’écran.',
        concreteExamples:
          'Suivre les résultats d’un cheval sur plusieurs réunions, constituer un fichier de cotes affichées, ou préparer une analyse offline à partir des colonnes date / course / cheval / position / cote.',
        businessImpact:
          'Livrable : fichier structuré aligné sur les colonnes visibles (date, course, cheval, jockey, temps/position, cote). Pas de gain de paris annoncé.',
      },
    },
  },

  'scraping-doctolib-suivi-disponibilites-medicales': {
    description:
      'Suivi des créneaux visibles sur Doctolib pour un médecin, un centre ou une spécialité : praticien, spécialité, prochain créneau affiché. Utile pour alerter quand un créneau se libère — dans le cadre autorisé par la plateforme.',
    metaDescription:
      'Suivi des disponibilités Doctolib : praticien, spécialité, créneaux affichés, alertes possibles.',
    dataExtracted: [
      'Nom du praticien',
      'Spécialité',
      'Créneaux / prochaines disponibilités affichées',
      'Lieu / cabinet (si affiché)',
    ],
    benefits: [
      'Veille de créneaux affichés',
      'Moins de rafraîchissement manuel',
      'Alerte possible sur nouveau créneau',
      'Export pour suivi interne',
    ],
    examples: ['doctolib.fr'],
    personalized: {
      whyUseCase: {
        problemsSolved:
          'Les créneaux Doctolib se remplissent vite. Vérifier à la main plusieurs praticiens ou lieux prend du temps et reste incomplet. Un suivi automatisé des disponibilités affichées limite les passages à vide.',
        concreteExamples:
          'Surveiller un spécialiste précis et notifier quand un créneau apparaît, ou comparer les prochaines dispos visibles entre plusieurs cabinets d’une même zone.',
        businessImpact:
          'On extrait uniquement ce que la fiche publique montre (praticien, spécialité, créneau). Aucun chiffre de « créneaux vides » ou de CA inventé.',
      },
    },
  },

  'scraping-fnac-extraction-des-donnees-produits': {
    description:
      'Extraction catalogue Fnac : titre produit, prix, disponibilité, et avis quand ils sont sur la fiche. Pour veille prix / assortiment, pas pour du lead gen.',
    metaDescription:
      'Scraping Fnac : nom, prix, disponibilité et avis produits, pour veille e-commerce.',
    dataExtracted: [
      'Nom du produit',
      'Prix',
      'Disponibilité',
      'Avis / note (si présents)',
      'Référence / EAN (si affiché)',
    ],
    benefits: [
      'Veille prix concurrente',
      'Suivi de stock affiché',
      'Collecte d’avis publics',
      'Export catalogue ciblé',
    ],
    examples: ['fnac.com'],
    personalized: {
      whyUseCase: {
        problemsSolved:
          'Comparer à la main les prix et la dispo Fnac sur une liste de références est lent et se périme vite. Un export structuré sert à la veille assortiment / pricing.',
        concreteExamples:
          'Suivre le prix d’une sélection de SKU, détecter une rupture affichée, ou récupérer les avis publics d’une fiche pour une analyse qualitative — sans promettre un volume d’avis.',
        businessImpact:
          'Fichier produits (nom, prix, dispo, avis si présents). Les bénéfices marketing génériques (CRM, emailing) ne correspondent pas à ce cas : ici c’est de la data catalogue.',
      },
    },
  },

  'scraping-instagram-extraction-des-commentaires-gratuits': {
    description:
      'Export des commentaires visibles sous un post ou un Reel Instagram : texte, auteur, date, likes si affichés. Pour lecture des retours et veille, sur des contenus auxquels vous avez accès.',
    metaDescription:
      'Extraction des commentaires Instagram (texte, auteur, date) pour veille et analyse.',
    dataExtracted: [
      'Texte du commentaire',
      'Auteur (username)',
      'Date',
      'Likes du commentaire (si affiché)',
    ],
    benefits: [
      'Lecture des retours en fichier',
      'Veille sur un post précis',
      'Analyse qualitative offline',
      'Moins de scroll manuel',
    ],
    examples: ['Instagram (posts / Reels)'],
    personalized: {
      whyUseCase: {
        problemsSolved:
          'Les commentaires Instagram se lisent mal hors de l’app dès qu’il y en a beaucoup. L’export texte + auteur + date permet de classer, chercher ou partager hors plateforme.',
        concreteExamples:
          'Récupérer les questions sous un Reel produit, lister les mentions d’une marque sur un post concurrent public, ou préparer une revue qualitative pour une équipe.',
        businessImpact:
          'Pas de taux de leads inventé ici : le livrable est la liste des commentaires visibles au moment de la collecte.',
      },
    },
  },

  'scraping-onlyfans-telechargement-de-contenu-multimedia': {
    description:
      'Collecte automatisée de contenus multimédias OnlyFans auxquels le compte a déjà accès (abonnement / achat) : fichiers, métadonnées de publication. Pas un contournement de paywall.',
    metaDescription:
      'Automatisation du téléchargement de contenus OnlyFans déjà accessibles au compte connecté.',
    dataExtracted: [
      'Fichiers média accessibles',
      'Titre / légende (si présent)',
      'Date de publication',
      'Type de média',
    ],
    benefits: [
      'Archivage des contenus achetés',
      'Moins de téléchargements manuels',
      'Métadonnées associées',
      'Organisation locale',
    ],
    examples: ['OnlyFans (compte avec accès)'],
    personalized: {
      whyUseCase: {
        problemsSolved:
          'Télécharger un par un les médias d’un abonnement déjà payé est long. L’automatisation cible l’archivage de ce à quoi le compte a droit, pas l’accès non autorisé.',
        concreteExamples:
          'Archiver les publications d’un créateur suivi pour usage personnel autorisé, ou organiser une bibliothèque locale avec date et type de média.',
        businessImpact:
          'Périmètre : contenus déjà accessibles au compte. Aucun volume de téléchargement ni chiffre d’affaires annoncé.',
      },
    },
  },

  'scraping-credit-agricole-offres-bancaires': {
    description:
      'Collecte des offres bancaires publiques affichées sur les pages Crédit Agricole : intitulé, conditions visibles, liens. Pour veille concurrentielle ou comparatif interne.',
    metaDescription:
      'Extraction des offres bancaires publiques Crédit Agricole pour veille et comparatif.',
    dataExtracted: [
      'Intitulé de l’offre',
      'Type de produit (si indiqué)',
      'Conditions / mentions affichées',
      'URL de la fiche',
    ],
    benefits: [
      'Veille offres publiques',
      'Comparatif structuré',
      'Suivi des changements de page',
      'Export pour analyse interne',
    ],
    examples: ['Pages publiques Crédit Agricole'],
    personalized: {
      whyUseCase: {
        problemsSolved:
          'Les offres bancaires évoluent et sont dispersées sur plusieurs pages. Un export des intitulés et conditions affichées évite de tout revérifier à la main à chaque revue.',
        concreteExamples:
          'Constituer un tableau des offres visibles à une date donnée, ou détecter qu’une fiche publique a changé de libellé / conditions affichées.',
        businessImpact:
          'On ne reprend que le texte public. Pas de taux de conversion ni de parts de marché inventés.',
      },
    },
  },

  'scraping-jobteaser-extraction-des-offres-d-emploi': {
    description:
      'Extraction des offres JobTeaser visibles : titre, entreprise, localisation, lien. Pour suivi stages / premiers emplois sur les pages accessibles.',
    metaDescription:
      'Scraping JobTeaser : titre, entreprise, lieu et lien des offres visibles.',
    dataExtracted: [
      'Titre du poste',
      'Entreprise',
      'Localisation',
      'Type de contrat (si affiché)',
      'URL de l’offre',
    ],
    benefits: [
      'Suivi d’offres étudiants / jeunes diplômés',
      'Veille employeurs',
      'Export pour scoring interne',
      'Moins de surveillance manuelle',
    ],
    examples: ['JobTeaser'],
    personalized: {
      whyUseCase: {
        problemsSolved:
          'JobTeaser concentre beaucoup d’offres stages / junior. Les suivre par employeur ou mot-clé sans fichier structuré oblige à revenir souvent sur le site.',
        concreteExamples:
          'Alerter sur de nouvelles offres d’une entreprise cible, ou constituer un historique d’annonces pour une école / un cabinet de recrutement junior.',
        businessImpact:
          'Livrable : lignes offre (titre, entreprise, lieu, URL). Pas de volume d’offres garanti.',
      },
    },
  },

  'scraping-telegram-ajout-de-membres-a-un-groupe-ou-canal': {
    description:
      'Automatisation d’ajout de membres à un groupe ou canal Telegram à partir d’une liste d’identifiants / usernames que vous fournissez. Sujet aux limites et règles Telegram.',
    metaDescription:
      'Ajout automatisé de membres Telegram à un groupe/canal à partir d’une liste fournie.',
    dataExtracted: [
      'Username / identifiant traité',
      'Statut de l’ajout (succès / échec / déjà membre)',
      'Horodatage',
    ],
    benefits: [
      'Traitement d’une liste fournie',
      'Journal des succès / échecs',
      'Moins d’ajouts manuels',
      'Traçabilité',
    ],
    examples: ['Telegram (groupe ou canal administré)'],
    personalized: {
      whyUseCase: {
        problemsSolved:
          'Ajouter des centaines de membres à la main depuis une liste est lent et opaque (doublons, refus). Un run automatisé avec journal d’état clarifie ce qui a été traité.',
        concreteExamples:
          'Importer une liste d’usernames dans un groupe que vous administrez, et récupérer un fichier succès / échec pour retraiter les erreurs.',
        businessImpact:
          'Dépend des limites Telegram et de la qualité de la liste. Aucun taux de réussite inventé.',
      },
    },
  },

  'scraping-entreprise-trouver-le-numero-de-telephone': {
    description:
      'Recherche et extraction de numéros de téléphone professionnels visibles sur des sources publiques (fiches entreprise, annuaires, sites). Pour enrichir une liste de sociétés déjà connue.',
    metaDescription:
      'Trouver des numéros de téléphone d’entreprise sur sources publiques, pour enrichissement B2B.',
    dataExtracted: [
      'Raison sociale / nom',
      'Numéro de téléphone (si public)',
      'Source / URL',
      'Ville (si affichée)',
    ],
    benefits: [
      'Enrichissement d’une base existante',
      'Sources tracées',
      'Moins de recherche manuelle',
      'Export pour appel / CRM',
    ],
    examples: ['Fiches entreprise et annuaires publics'],
    personalized: {
      whyUseCase: {
        problemsSolved:
          'Beaucoup de listes B2B n’ont que le nom et le site. Retrouver le téléphone public demande des allers-retours sur plusieurs pages.',
        concreteExamples:
          'Enrichir un fichier SIREN / raison sociale avec le numéro affiché sur la fiche publique, en gardant l’URL source pour vérification.',
        businessImpact:
          'Couverture = présence réelle du numéro en public. Pas de taux de match inventé.',
      },
    },
  },

  'scraping-snapchat-extraction-des-stories-utilisateurs': {
    description:
      'Collecte de métadonnées / médias de Stories Snapchat accessibles au compte : auteur, horodatage, type de média. Pour archivage ou veille sur des comptes suivis.',
    metaDescription:
      'Extraction de Stories Snapchat accessibles : média et métadonnées pour veille / archive.',
    dataExtracted: [
      'Compte / auteur',
      'Type de média',
      'Horodatage (si disponible)',
      'Fichier média (si accessible)',
    ],
    benefits: [
      'Archive de stories suivies',
      'Veille créative',
      'Moins de capture manuelle',
      'Métadonnées associées',
    ],
    examples: ['Snapchat (comptes / stories accessibles)'],
    personalized: {
      whyUseCase: {
        problemsSolved:
          'Les Stories disparaissent vite. Si vous devez les revoir ou les classer, une collecte au moment où elles sont visibles évite de tout perdre.',
        concreteExamples:
          'Archiver les stories d’un compte suivi pour une revue créative, ou garder une trace datée d’une campagne éphémère.',
        businessImpact:
          'Uniquement le contenu accessible au moment du run. Pas de volume de stories promis.',
      },
    },
  },

  'scraping-instagram-extraction-des-numeros-de-telephone': {
    description:
      'Extraction des numéros de téléphone affichés sur des profils Instagram professionnels (bio, bouton contact) lorsque le profil les rend publics.',
    metaDescription:
      'Récupérer les téléphones publics des fiches Instagram pro (bio / contact).',
    dataExtracted: [
      'Username Instagram',
      'Nom affiché',
      'Téléphone (si public)',
      'Lien externe (si présent)',
    ],
    benefits: [
      'Enrichissement depuis profils pro',
      'Liste de contacts publics',
      'Traçabilité du profil source',
      'Export CRM',
    ],
    examples: ['Profils Instagram professionnels publics'],
    personalized: {
      whyUseCase: {
        problemsSolved:
          'Certains comptes pro affichent un téléphone, d’autres non. Parcourir une liste de usernames à la main pour trouver ceux qui l’affichent est lent.',
        concreteExamples:
          'Partir d’une liste de comptes locaux (resto, artisan) et ne garder que ceux avec un numéro public, pour un appel ou un SMS hors Instagram.',
        businessImpact:
          'Seuls les numéros déjà affichés sont récupérés. Pas de taux de remplissage inventé.',
      },
    },
  },

  'scraping-meilleursagents-previsions-marche-immobilier': {
    description:
      'Collecte des indicateurs et estimations affichés sur Meilleurs Agents (prix au m², tendances de zone) pour une adresse ou un secteur. Pour veille marché, pas une estimation notariale.',
    metaDescription:
      'Extraction Meilleurs Agents : prix au m² et tendances de zone affichés, pour veille immobilière.',
    dataExtracted: [
      'Zone / adresse interrogée',
      'Prix au m² affiché',
      'Tendance / évolution affichée',
      'Type de bien (si précisé)',
    ],
    benefits: [
      'Veille de zone',
      'Comparaison de secteurs',
      'Export pour reporting',
      'Moins de saisies manuelles',
    ],
    examples: ['meilleursagents.com'],
    personalized: {
      whyUseCase: {
        problemsSolved:
          'Les estimations Meilleurs Agents sont utiles en veille, mais les recopier pour plusieurs zones dans un tableur est fastidieux.',
        concreteExamples:
          'Suivre le prix au m² affiché sur une liste de communes, ou documenter une tendance de quartier pour un dossier interne.',
        businessImpact:
          'Ce sont les chiffres affichés par le site, pas une garantie de prix de vente. Aucune « prévision » inventée de notre côté.',
      },
    },
  },

  'scraping-vinted-extraction-des-informations-des-vendeurs': {
    description:
      'Extraction des infos vendeur visibles sur Vinted : pseudo, localisation affichée, note, volume d’avis si présent. Pour qualifier des vendeurs ou une niche produit.',
    metaDescription:
      'Infos vendeurs Vinted publiques : pseudo, note, localisation affichée.',
    dataExtracted: [
      'Pseudo vendeur',
      'Localisation affichée',
      'Note / avis (si affichés)',
      'URL du profil',
    ],
    benefits: [
      'Qualification de vendeurs',
      'Veille niche / sourcing',
      'Export structuré',
      'Moins de navigation manuelle',
    ],
    examples: ['vinted.fr'],
    personalized: {
      whyUseCase: {
        problemsSolved:
          'Sur Vinted, le profil vendeur compte autant que l’annonce. Collecter note et infos visibles pour une liste d’annonces ou de vendeurs évite d’ouvrir chaque fiche.',
        concreteExamples:
          'Qualifiers les vendeurs d’une catégorie (ex. sneakers) avant contact, ou suivre l’activité affichée d’un panel de comptes.',
        businessImpact:
          'Uniquement les champs publics du profil. Pas de volume de vendeurs promis.',
      },
    },
  },

  'scraping-facebook-extraction-emails-marketing': {
    description:
      'Récupération d’adresses e-mail lorsqu’elles sont publiées sur des pages ou profils Facebook accessibles (section contact, à propos). Pour enrichissement, pas pour contourner les réglages privés.',
    metaDescription:
      'E-mails publics sur pages Facebook (contact / à propos), pour enrichissement marketing.',
    dataExtracted: [
      'Nom de la page / profil',
      'E-mail (si public)',
      'URL source',
      'Téléphone (si aussi public)',
    ],
    benefits: [
      'Enrichissement depuis pages publiques',
      'Source tracée',
      'Export pour campagne autorisée',
      'Moins de copier-coller',
    ],
    examples: ['Pages Facebook publiques'],
    personalized: {
      whyUseCase: {
        problemsSolved:
          'Certaines pages pro affichent un e-mail de contact. Les repérer dans une liste de pages sans ouvrir chaque onglet « À propos » fait gagner du temps.',
        concreteExamples:
          'Enrichir une liste de pages locales avec l’e-mail affiché, en conservant l’URL pour preuve de source.',
        businessImpact:
          'Pas de taux de trouvabilité inventé : seulement les e-mails déjà publics.',
      },
    },
  },

  'scraping-temu-extraction-des-produits-en-ligne': {
    description:
      'Extraction catalogue Temu : titre, prix affiché, disponibilité / variantes visibles. Pour veille prix et assortiment.',
    metaDescription:
      'Scraping Temu : titre, prix et disponibilité produits pour veille e-commerce.',
    dataExtracted: [
      'Titre produit',
      'Prix affiché',
      'Variantes (si listées)',
      'Disponibilité affichée',
      'URL produit',
    ],
    benefits: [
      'Veille prix',
      'Suivi d’assortiment',
      'Export catalogue ciblé',
      'Comparaison de références',
    ],
    examples: ['Temu'],
    personalized: {
      whyUseCase: {
        problemsSolved:
          'Les prix Temu bougent souvent. Un export sur une liste d’URL ou de mots-clés remplace le suivi manuel fiche par fiche.',
        concreteExamples:
          'Comparer le prix affiché d’un panier de références, ou détecter qu’une variante n’est plus listée.',
        businessImpact:
          'Données = ce que la fiche montre au scraping. Pas de marge ni de volume de ventes inventés.',
      },
    },
  },

  'scraping-leboncoin-automatisation-des-actions': {
    description:
      'Automatisation d’actions répétitives sur Leboncoin (surveillance d’annonces, collecte de champs publics, enchaînements validés). Périmètre défini avec vous ; respect des règles du site.',
    metaDescription:
      'Automatisation Leboncoin : surveillance et collecte des champs d’annonces publics.',
    dataExtracted: [
      'Titre d’annonce',
      'Prix',
      'Localisation',
      'URL',
      'Date / statut affiché (si présent)',
    ],
    benefits: [
      'Surveillance d’annonces',
      'Collecte structurée',
      'Moins de tâches répétitives',
      'Alertes possibles',
    ],
    examples: ['leboncoin.fr'],
    personalized: {
      whyUseCase: {
        problemsSolved:
          'Surveiller une recherche Leboncoin (prix, lieu, mot-clé) à la main rate des annonces et prend du temps. L’automatisation cible la collecte des champs publics et les alertes.',
        concreteExamples:
          'Alerte sur nouvelles annonces d’une requête, ou export quotidien titre / prix / lieu / URL pour un acheteur pro.',
        businessImpact:
          'Pas de volume d’annonces garanti. Le périmètre d’actions est cadré projet par projet.',
      },
    },
  },

  'scraping-gens-de-confiance-evaluations-services': {
    description:
      'Collecte des évaluations / avis visibles sur Gens de Confiance pour des services ou profils publics : note, commentaire, date si affichée.',
    metaDescription:
      'Extraction des avis Gens de Confiance visibles pour suivi qualité / veille.',
    dataExtracted: [
      'Profil / service',
      'Note',
      'Commentaire',
      'Date (si affichée)',
    ],
    benefits: [
      'Suivi de réputation',
      'Veille qualitative',
      'Export des avis publics',
      'Moins de relecture manuelle',
    ],
    examples: ['Gens de Confiance'],
    personalized: {
      whyUseCase: {
        problemsSolved:
          'Lire les avis un par un sur la plateforme ne permet pas de les classer ou de les archiver facilement. L’export sert à une revue hors site.',
        concreteExamples:
          'Compiler les avis visibles d’un prestataire suivi, ou comparer qualitativement plusieurs profils d’une même catégorie.',
        businessImpact:
          'Avis publics uniquement. Pas de score de satisfaction inventé.',
      },
    },
  },

  'scraping-legifrance-suivi-textes-lois': {
    description:
      'Suivi de textes sur Légifrance : titre, référence, date, URL, et détection de mises à jour sur une liste de textes ou de recherches.',
    metaDescription:
      'Veille Légifrance : textes, références et mises à jour, en fichier structuré.',
    dataExtracted: [
      'Titre du texte',
      'Référence / NOR (si affichée)',
      'Date',
      'URL Légifrance',
      'Nature du texte (si indiquée)',
    ],
    benefits: [
      'Veille juridique ciblée',
      'Historique des versions suivies',
      'Moins de contrôle manuel',
      'Export pour équipe juridique',
    ],
    examples: ['legifrance.gouv.fr'],
    personalized: {
      whyUseCase: {
        problemsSolved:
          'Légifrance est la source, mais surveiller plusieurs textes à la main laisse passer des mises à jour. Un suivi automatisé pointe les changements sur votre liste.',
        concreteExamples:
          'Alerter quand un décret suivi est modifié, ou constituer un tableau de références + URL pour un dossier interne.',
        businessImpact:
          'Pas d’interprétation juridique automatisée : on suit les métadonnées et les pages publiées.',
      },
    },
  },

  'scraping-video-telechargement-instantane-de-videos': {
    description:
      'Téléchargement de vidéos depuis une URL que vous fournissez, lorsque le contenu est accessible. Pour archivage ou retraitement, pas pour contourner un DRM.',
    metaDescription:
      'Téléchargement vidéo depuis URL accessible : archivage et retraitement.',
    dataExtracted: [
      'Fichier vidéo',
      'URL source',
      'Titre (si disponible)',
      'Durée / format (si détectable)',
    ],
    benefits: [
      'Archivage local',
      'Retraitement offline',
      'Moins de téléchargements manuels',
      'Métadonnées de base',
    ],
    examples: ['URL vidéo accessibles'],
    personalized: {
      whyUseCase: {
        problemsSolved:
          'Quand il faut archiver ou retraiter une vidéo déjà accessible, le faire à la main fiche par fiche ne scale pas.',
        concreteExamples:
          'Télécharger une liste d’URL pour transcription locale, ou constituer une archive datée de contenus publics.',
        businessImpact:
          'Uniquement les URL accessibles sans contournement. Pas de volume promis.',
      },
    },
  },

  'scraping-facebook-extraction-des-publications-publiques': {
    description:
      'Extraction de publications publiques Facebook (page ou profil public) : texte, date, réactions affichées, lien. Pour veille et archive.',
    metaDescription:
      'Publications Facebook publiques : texte, date, réactions affichées, URL.',
    dataExtracted: [
      'Texte de la publication',
      'Date',
      'Réactions / commentaires (compteurs affichés)',
      'URL du post',
      'Médias liés (si présents)',
    ],
    benefits: [
      'Veille de page',
      'Archive de posts publics',
      'Export pour analyse',
      'Moins de scroll manuel',
    ],
    examples: ['Pages Facebook publiques'],
    personalized: {
      whyUseCase: {
        problemsSolved:
          'Suivre le fil d’une page concurrente ou institutionnelle sans fichier structuré oblige à tout relire dans l’interface.',
        concreteExamples:
          'Archiver les posts d’une page sur une période, ou extraire les textes pour une analyse qualitative hors Facebook.',
        businessImpact:
          'Contenu public uniquement. Pas de portée publicitaire inventée.',
      },
    },
  },

  'scraping-facebook-extraction-emails': {
    description:
      'Extraction d’e-mails publiés sur des pages Facebook (section contact). Même logique que la variante marketing : sources publiques seulement.',
    metaDescription:
      'E-mails de contact publics sur pages Facebook, export pour enrichissement.',
    dataExtracted: [
      'Nom de la page',
      'E-mail public',
      'URL de la page',
    ],
    benefits: [
      'Enrichissement B2B / local',
      'Source tracée',
      'Export simple',
      'Filtrage des pages sans e-mail',
    ],
    examples: ['Pages Facebook publiques'],
    personalized: {
      whyUseCase: {
        problemsSolved:
          'Variante courte de l’extraction d’e-mails publics Facebook : partir d’une liste de pages et ne garder que celles qui affichent un contact mail.',
        concreteExamples:
          'Compléter un fichier d’entreprises locales avec l’e-mail de leur page Facebook quand il est affiché.',
        businessImpact:
          'Pas de taux de match inventé.',
      },
    },
  },

  'scraping-tiktok-extraction-rapide-de-profils-gratuits': {
    description:
      'Extraction de profils TikTok publics : username, bio, compteurs affichés (followers, likes), lien. Pour veille créateurs / sourcing.',
    metaDescription:
      'Profils TikTok publics : bio, followers affichés, lien — pour veille et sourcing.',
    dataExtracted: [
      'Username',
      'Bio',
      'Followers / likes affichés',
      'Lien externe (si présent)',
      'URL profil',
    ],
    benefits: [
      'Sourcing créateurs',
      'Veille d’audience affichée',
      'Export de profils',
      'Moins de collecte manuelle',
    ],
    examples: ['TikTok (profils publics)'],
    personalized: {
      whyUseCase: {
        problemsSolved:
          'Comparer des profils TikTok (bio, taille d’audience affichée) sans tableur est peu pratique pour un casting ou une veille.',
        concreteExamples:
          'Constituer une shortlist de créateurs sur un hashtag ou une niche, avec username + compteurs affichés + lien.',
        businessImpact:
          'Compteurs = ceux affichés sur le profil au moment du scrape. Pas de taux d’engagement inventé.',
      },
    },
  },

  'scraping-skyscanner-extraction-des-vols-et-prix': {
    description:
      'Extraction des résultats de vols Skyscanner affichés pour un trajet / une date : compagnies, prix, horaires. Pour veille tarifaire.',
    metaDescription:
      'Prix et horaires de vols Skyscanner affichés, pour veille tarifaire.',
    dataExtracted: [
      'Trajet',
      'Date',
      'Compagnie',
      'Prix affiché',
      'Horaires',
      'Escales (si indiquées)',
    ],
    benefits: [
      'Veille tarifaire',
      'Comparaison de dates',
      'Export pour reporting',
      'Moins de recherches manuelles',
    ],
    examples: ['skyscanner.fr'],
    personalized: {
      whyUseCase: {
        problemsSolved:
          'Les prix vols changent souvent. Relancer la même recherche à la main pour plusieurs dates ou aéroports produit des tableaux incomplets.',
        concreteExamples:
          'Suivre le prix d’un OD sur une fenêtre de dates, ou comparer des compagnies sur un trajet fixe à un instant T.',
        businessImpact:
          'Prix = affichage au moment de la collecte. Pas de « meilleur prix garanti ».',
      },
    },
  },

  'scraping-apec-suivi-profils-candidats': {
    description:
      'Suivi de profils / candidatures visibles côté Apec (selon accès compte) : intitulés, expériences affichées, localisation. Pour recruteurs autorisés.',
    metaDescription:
      'Suivi de profils Apec accessibles au compte : expériences et localisation affichées.',
    dataExtracted: [
      'Intitulé / titre de profil',
      'Expériences affichées',
      'Localisation',
      'Disponibilité (si indiquée)',
    ],
    benefits: [
      'Suivi de vivier',
      'Moins de relectures manuelles',
      'Export pour ATS / tableur',
      'Veille sur critères fixes',
    ],
    examples: ['Apec (compte avec droits)'],
    personalized: {
      whyUseCase: {
        problemsSolved:
          'Les recruteurs qui suivent un vivier Apec passent du temps à revérifier les mêmes filtres. Un export des profils accessibles cadre le suivi.',
        concreteExamples:
          'Extraire périodiquement les profils correspondant à un filtre (métier + région) pour un comité de recrutement.',
        businessImpact:
          'Réservé aux accès légitimes du compte. Pas de volume de candidats promis.',
      },
    },
  },

  'scraping-twitter-extraction-rapide-des-tweets-et-profils': {
    description:
      'Extraction de tweets et profils X/Twitter publics : texte, date, auteur, compteurs affichés. Pour veille et archive.',
    metaDescription:
      'Tweets et profils X publics : texte, date, compteurs affichés.',
    dataExtracted: [
      'Texte du tweet',
      'Auteur',
      'Date',
      'Likes / reposts affichés',
      'URL',
    ],
    benefits: [
      'Veille de mots-clés / comptes',
      'Archive de publications',
      'Export pour analyse',
      'Moins de capture d’écran',
    ],
    examples: ['X / Twitter (contenus publics)'],
    personalized: {
      whyUseCase: {
        problemsSolved:
          'La recherche X se lit mal hors interface dès qu’on veut classer ou garder un historique. L’export texte + métadonnées sert à la veille.',
        concreteExamples:
          'Archiver les tweets d’un compte ou d’une requête sur une période, pour une revue éditoriale ou une détection de signaux.',
        businessImpact:
          'Contenu public au moment du run. Pas de portée virale inventée.',
      },
    },
  },

  'scraping-facebook-extraction-des-transcriptions-de-videos': {
    description:
      'Récupération / génération de transcriptions à partir de vidéos Facebook accessibles (sous-titres existants ou traitement audio). Pour recherche dans le contenu parlé.',
    metaDescription:
      'Transcriptions de vidéos Facebook accessibles, pour recherche plein texte.',
    dataExtracted: [
      'Texte transcrit',
      'URL / identifiant vidéo',
      'Titre (si disponible)',
      'Horodatages (si produits)',
    ],
    benefits: [
      'Recherche dans le parlé',
      'Archive textuelle',
      'Moins d’écoute manuelle',
      'Préparation pour résumé humain',
    ],
    examples: ['Vidéos Facebook accessibles'],
    personalized: {
      whyUseCase: {
        problemsSolved:
          'Relire une vidéo Facebook pour retrouver une phrase coûte du temps. Une transcription permet la recherche texte.',
        concreteExamples:
          'Indexer le discours d’une vidéo publique, ou préparer une relecture écrite avant montage / citation.',
        businessImpact:
          'Qualité liée à l’audio et aux sous-titres disponibles. Pas de score de précision inventé.',
      },
    },
  },

  'scraping-selogerneuf-suivi-nouvelles-constructions': {
    description:
      'Suivi des programmes neufs sur SeLoger Neuf : nom du programme, ville, prix affichés, promoteur si indiqué. Pour veille promoteurs / investisseurs.',
    metaDescription:
      'Veille SeLoger Neuf : programmes, villes, prix affichés, promoteurs.',
    dataExtracted: [
      'Nom du programme',
      'Ville / quartier',
      'Prix affiché',
      'Promoteur (si indiqué)',
      'URL de la fiche',
    ],
    benefits: [
      'Veille programmes neufs',
      'Suivi de zones',
      'Export pour dealflow',
      'Alertes sur nouveautés',
    ],
    examples: ['SeLoger Neuf'],
    personalized: {
      whyUseCase: {
        problemsSolved:
          'Les nouveaux programmes apparaissent et disparaissent. Les suivre sur plusieurs villes sans fichier structuré laisse passer des opportunités.',
        concreteExamples:
          'Alerte sur nouveaux programmes d’une métropole, ou tableau promoteur / ville / prix affiché pour un investisseur.',
        businessImpact:
          'Prix et dispo = affichage site. Pas de rendement locatif inventé.',
      },
    },
  },

  'scraping-instagram-transcription-des-videos-reels': {
    description:
      'Transcription du parlé / sous-titres de Reels Instagram accessibles. Pour recherche dans le contenu et veille éditoriale.',
    metaDescription:
      'Transcription de Reels Instagram accessibles, pour veille et recherche texte.',
    dataExtracted: [
      'Texte transcrit',
      'URL / id du Reel',
      'Compte auteur',
      'Horodatages (si produits)',
    ],
    benefits: [
      'Veille contenu parlé',
      'Recherche plein texte',
      'Archive écrite',
      'Moins d’écoute manuelle',
    ],
    examples: ['Instagram Reels'],
    relatedInternal: {
      href: '/blog/capter-signal-marketing-instagram-logement-atypique',
      label:
        'Article journal : signal marketing et publicités Instagram (Logement Atypique)',
    },
    personalized: {
      whyUseCase: {
        problemsSolved:
          'Les Reels se consomment en play ; pour citer ou classer le discours, il faut du texte. La transcription sert à ça.',
        concreteExamples:
          'Indexer le script d’un Reel concurrent, ou préparer une revue éditoriale écrite. Pour un angle ads Instagram plus large, voir aussi l’article du journal sur le signal marketing Instagram.',
        businessImpact:
          'Pas de métrique d’engagement inventée. Lien journal utile si le sujet ads / signal Instagram vous concerne : /blog/capter-signal-marketing-instagram-logement-atypique.',
      },
    },
  },

  'scraping-linkedin-extraction-des-profils-de-personnes': {
    description:
      'Extraction de profils LinkedIn publics ou accessibles au compte : nom, titre, entreprise, localisation, URL. Pour sourcing et enrichissement CRM, dans le cadre des règles LinkedIn.',
    metaDescription:
      'Profils LinkedIn : nom, titre, entreprise, localisation — export pour sourcing.',
    dataExtracted: [
      'Nom',
      'Titre / poste',
      'Entreprise actuelle',
      'Localisation',
      'URL du profil',
    ],
    benefits: [
      'Sourcing structuré',
      'Enrichissement CRM',
      'Listes exportables',
      'Moins de copier-coller',
    ],
    examples: ['LinkedIn'],
    relatedInternal: {
      href: '/blog/scraping-linkedin-guide-2026',
      label: 'Guide journal : scraping LinkedIn (méthode et cadre)',
    },
    personalized: {
      whyUseCase: {
        problemsSolved:
          'Constituer une liste de profils LinkedIn (poste, entreprise, lien) sans export propre oblige à tout recopier. Cette fiche décrit la collecte structurée pour un sourcing cadré.',
        concreteExamples:
          'Extraire une shortlist sur un titre + localisation, ou enrichir un CRM avec l’URL profil. Pour la méthode et le cadre, voir le guide du journal sur le scraping LinkedIn.',
        businessImpact:
          'Volumes et accès dépendent du compte et des règles LinkedIn. Aucun volume promis sur cette page ; le guide journal détaille une méthode séparée.',
      },
    },
  },

  'scraping-linkedin-recherche-de-profils-en-masse': {
    description:
      'Recherche LinkedIn en volume à partir de filtres (titre, entreprise, lieu) puis export des profils visibles. Respecter les conditions d’usage LinkedIn.',
    metaDescription:
      'Recherche LinkedIn en masse : filtres puis export des profils visibles.',
    dataExtracted: [
      'Nom',
      'Titre',
      'Entreprise',
      'Localisation',
      'URL profil',
    ],
    benefits: [
      'Listes à partir de filtres',
      'Sourcing répétable',
      'Export tableur / CRM',
      'Moins de navigation manuelle',
    ],
    examples: ['LinkedIn Search'],
    relatedInternal: {
      href: '/blog/scraping-linkedin-guide-2026',
      label: 'Guide journal : scraping LinkedIn (méthode et cadre)',
    },
    personalized: {
      whyUseCase: {
        problemsSolved:
          'Une recherche LinkedIn filtrée produit des pages de résultats difficiles à archiver. L’export sert à travailler la liste hors interface.',
        concreteExamples:
          'Lancer une recherche titre + ville, exporter les profils visibles, puis qualifier dans un tableur. Méthode détaillée dans le guide journal LinkedIn.',
        businessImpact:
          'Pas de volume garanti sur cette fiche. Le guide journal reste la référence méthode.',
      },
    },
  },
}

export function getCaseStudyContentOverride(slug) {
  if (!slug) return null
  return CASE_STUDY_CONTENT_OVERRIDES[slug] || null
}

export function applyCaseStudyContentOverride(caseStudy, personalizedData = null) {
  if (!caseStudy?.slug) {
    return { caseStudy, personalizedData }
  }
  const override = getCaseStudyContentOverride(caseStudy.slug)
  if (!override) {
    return { caseStudy, personalizedData }
  }

  const next = {
    ...caseStudy,
    description: override.description || caseStudy.description,
    metaDescription: override.metaDescription || caseStudy.metaDescription,
    dataExtracted: override.dataExtracted || caseStudy.dataExtracted,
    benefits: override.benefits || caseStudy.benefits,
    examples: override.examples || caseStudy.examples,
  }

  let nextPersonalized = personalizedData || caseStudy.personalized || null
  if (override.personalized?.whyUseCase) {
    nextPersonalized = {
      ...(nextPersonalized || {}),
      whyUseCase: {
        ...(nextPersonalized?.whyUseCase || {}),
        ...override.personalized.whyUseCase,
      },
    }
  }

  if (override.relatedInternal) {
    nextPersonalized = {
      ...(nextPersonalized || {}),
      relatedInternal: override.relatedInternal,
    }
  }

  return { caseStudy: next, personalizedData: nextPersonalized }
}
