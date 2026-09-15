/**
 * WikiMasters Web Dashboard - Contrôleur Principal Autonome & Moteur Graphique
 * Thème : Deep Cyber & Gemstones
 * 100% Fonctionnel - Zéro dépendance externe - Compatible file:// et http://
 * Architecture miroir avec l'extension WikiMasters (Système de Filtres Dynamiques & externally_connectable)
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. CONFIGURATION DES RARETÉS OFFICIELLES & DONNÉES DE DÉPART
  // ==========================================================================

  const OFFICIAL_RARITIES = {
    L: {
      id: 'L',
      key: 'LEGENDARY',
      label: 'Légendaire',
      shortCode: 'L',
      color: '#ffe144',
      textColor: '#0d1117',
      bgColor: 'rgba(255, 225, 68, 0.15)',
      borderColor: '#ffe144',
      glowColor: 'rgba(255, 225, 68, 0.45)',
      numericRarity: 6
    },
    UR: {
      id: 'UR',
      key: 'ULTRA_RARE',
      label: 'Ultra Rare',
      shortCode: 'UR',
      color: '#fa9931',
      textColor: '#ffffff',
      bgColor: 'rgba(250, 153, 49, 0.15)',
      borderColor: '#fa9931',
      glowColor: 'rgba(250, 153, 49, 0.45)',
      numericRarity: 5
    },
    SR: {
      id: 'SR',
      key: 'SUPER_RARE',
      label: 'Super Rare',
      shortCode: 'SR',
      color: '#ed6fa3',
      textColor: '#ffffff',
      bgColor: 'rgba(237, 111, 163, 0.15)',
      borderColor: '#ed6fa3',
      glowColor: 'rgba(237, 111, 163, 0.45)',
      numericRarity: 4
    },
    R: {
      id: 'R',
      key: 'RARE',
      label: 'Rare',
      shortCode: 'R',
      color: '#c6a7f2',
      textColor: '#0d1117',
      bgColor: 'rgba(198, 167, 242, 0.15)',
      borderColor: '#c6a7f2',
      glowColor: 'rgba(198, 167, 242, 0.45)',
      numericRarity: 3
    },
    PC: {
      id: 'PC',
      key: 'UNCOMMON',
      label: 'Peu Commune',
      shortCode: 'PC',
      color: '#b1cff2',
      textColor: '#0d1117',
      bgColor: 'rgba(177, 207, 242, 0.15)',
      borderColor: '#b1cff2',
      glowColor: 'rgba(177, 207, 242, 0.45)',
      numericRarity: 2
    },
    C: {
      id: 'C',
      key: 'COMMON',
      label: 'Commune',
      shortCode: 'C',
      color: '#b8f2d5',
      textColor: '#0d1117',
      bgColor: 'rgba(184, 242, 213, 0.15)',
      borderColor: '#b8f2d5',
      glowColor: 'rgba(184, 242, 213, 0.45)',
      numericRarity: 1
    }
  };

  const INITIAL_MOCK_CARDS = [
    {
      id: 'card_demo_01',
      boosterId: 'booster_demo_01',
      sessionId: 'session_demo_01',
      name: 'Adèle Castillon',
      rarity: 'L',
      rarityLabel: 'Légendaire',
      rarityShortCode: 'L',
      rarityColor: '#ffe144',
      cardIndex: 5,
      totalInBooster: 5,
      description: 'Chanteuse, actrice et vidéaste française. Membre emblématique du duo Vidéoclub, figure majeure de la pop synthwave.',
      attack: 94,
      defense: 88,
      avgPrice: 2850,
      minPrice: 2400,
      maxPrice: 3200,
      lastPrice: 2900,
      sellPriceMin: 1425,
      sellPriceMax: 2138,
      sellPriceMid: 1781,
      salesCount: 14,
      hasRealMarketPrice: true,
      timestamp: Date.now() - 1000 * 60 * 180
    },
    {
      id: 'card_demo_02',
      boosterId: 'booster_demo_01',
      sessionId: 'session_demo_01',
      name: 'Albert Einstein',
      rarity: 'UR',
      rarityLabel: 'Ultra Rare',
      rarityShortCode: 'UR',
      rarityColor: '#fa9931',
      cardIndex: 4,
      totalInBooster: 5,
      description: 'Physicien théoricien germano-américain, auteur de la théorie de la relativité restreinte et générale. Prix Nobel de physique 1921.',
      attack: 85,
      defense: 92,
      avgPrice: 1450,
      minPrice: 1200,
      maxPrice: 1700,
      lastPrice: 1500,
      sellPriceMin: 725,
      sellPriceMax: 1088,
      sellPriceMid: 906,
      salesCount: 22,
      hasRealMarketPrice: true,
      timestamp: Date.now() - 1000 * 60 * 179
    },
    {
      id: 'card_demo_03',
      boosterId: 'booster_demo_01',
      sessionId: 'session_demo_01',
      name: 'Marie Curie',
      rarity: 'UR',
      rarityLabel: 'Ultra Rare',
      rarityShortCode: 'UR',
      rarityColor: '#fa9931',
      cardIndex: 3,
      totalInBooster: 5,
      description: 'Physicienne et chimiste polonaise naturalisée française, double lauréate du prix Nobel (Physique 1903, Chimie 1911).',
      attack: 82,
      defense: 90,
      avgPrice: 1120,
      minPrice: 950,
      maxPrice: 1300,
      lastPrice: 1100,
      sellPriceMin: 560,
      sellPriceMax: 840,
      sellPriceMid: 700,
      salesCount: 19,
      hasRealMarketPrice: true,
      timestamp: Date.now() - 1000 * 60 * 178
    },
    {
      id: 'card_demo_04',
      boosterId: 'booster_demo_01',
      sessionId: 'session_demo_01',
      name: 'Tour Eiffel',
      rarity: 'SR',
      rarityLabel: 'Super Rare',
      rarityShortCode: 'SR',
      rarityColor: '#ed6fa3',
      cardIndex: 2,
      totalInBooster: 5,
      description: 'Monument emblématique de Paris érigé par Gustave Eiffel pour l\'Exposition universelle de 1889. Hauteur 330 mètres.',
      attack: 78,
      defense: 84,
      avgPrice: 420,
      minPrice: 380,
      maxPrice: 510,
      lastPrice: 430,
      sellPriceMin: 210,
      sellPriceMax: 315,
      sellPriceMid: 263,
      salesCount: 45,
      hasRealMarketPrice: true,
      timestamp: Date.now() - 1000 * 60 * 177
    },
    {
      id: 'card_demo_05',
      boosterId: 'booster_demo_01',
      sessionId: 'session_demo_01',
      name: 'Léonard de Vinci',
      rarity: 'L',
      rarityLabel: 'Légendaire',
      rarityShortCode: 'L',
      rarityColor: '#ffe144',
      cardIndex: 1,
      totalInBooster: 5,
      description: 'Polymathe italien de la Renaissance, peintre de la Joconde et génie universel précurseur des sciences et inventions modernes.',
      attack: 95,
      defense: 91,
      avgPrice: 3100,
      minPrice: 2800,
      maxPrice: 3600,
      lastPrice: 3200,
      sellPriceMin: 1550,
      sellPriceMax: 2325,
      sellPriceMid: 1938,
      salesCount: 8,
      hasRealMarketPrice: true,
      timestamp: Date.now() - 1000 * 60 * 176
    },
    {
      id: 'card_demo_06',
      boosterId: 'booster_demo_02',
      sessionId: 'session_demo_02',
      name: 'Système Solaire',
      rarity: 'SR',
      rarityLabel: 'Super Rare',
      rarityShortCode: 'SR',
      rarityColor: '#ed6fa3',
      cardIndex: 5,
      totalInBooster: 5,
      description: 'Système planétaire composé d\'une étoile centrale, le Soleil, et des huit planètes orbitant autour de son champ gravitationnel.',
      attack: 74,
      defense: 89,
      avgPrice: 380,
      minPrice: 320,
      maxPrice: 440,
      lastPrice: 375,
      sellPriceMin: 190,
      sellPriceMax: 285,
      sellPriceMid: 238,
      salesCount: 31,
      hasRealMarketPrice: true,
      timestamp: Date.now() - 1000 * 60 * 140
    },
    {
      id: 'card_demo_07',
      boosterId: 'booster_demo_02',
      sessionId: 'session_demo_02',
      name: 'Pyramide de Khéops',
      rarity: 'R',
      rarityLabel: 'Rare',
      rarityShortCode: 'R',
      rarityColor: '#c6a7f2',
      cardIndex: 4,
      totalInBooster: 5,
      description: 'Plus grande des pyramides de Gizeh, édifiée pour le pharaon Khéops. Unique merveille du monde antique encore debout.',
      attack: 62,
      defense: 88,
      avgPrice: 180,
      minPrice: 150,
      maxPrice: 220,
      lastPrice: 190,
      sellPriceMin: 90,
      sellPriceMax: 135,
      sellPriceMid: 113,
      salesCount: 58,
      hasRealMarketPrice: true,
      timestamp: Date.now() - 1000 * 60 * 139
    },
    {
      id: 'card_demo_08',
      boosterId: 'booster_demo_02',
      sessionId: 'session_demo_02',
      name: 'Alexandre le Grand',
      rarity: 'UR',
      rarityLabel: 'Ultra Rare',
      rarityShortCode: 'UR',
      rarityColor: '#fa9931',
      cardIndex: 3,
      totalInBooster: 5,
      description: 'Roi de Macédoine et conquérant légendaire de l\'Empire perse, ayant étendu ses territoires de la Grèce jusqu\'au fleuve Indus.',
      attack: 91,
      defense: 76,
      avgPrice: 890,
      minPrice: 750,
      maxPrice: 1050,
      lastPrice: 920,
      sellPriceMin: 445,
      sellPriceMax: 668,
      sellPriceMid: 556,
      salesCount: 27,
      hasRealMarketPrice: true,
      timestamp: Date.now() - 1000 * 60 * 138
    },
    {
      id: 'card_demo_09',
      boosterId: 'booster_demo_02',
      sessionId: 'session_demo_02',
      name: 'Grande Muraille de Chine',
      rarity: 'R',
      rarityLabel: 'Rare',
      rarityShortCode: 'R',
      rarityColor: '#c6a7f2',
      cardIndex: 2,
      totalInBooster: 5,
      description: 'Ensemble de fortifications militaires construites le long des frontières septentrionales historiques de la Chine.',
      attack: 55,
      defense: 95,
      avgPrice: 140,
      minPrice: 110,
      maxPrice: 175,
      lastPrice: 145,
      sellPriceMin: 70,
      sellPriceMax: 105,
      sellPriceMid: 88,
      salesCount: 72,
      hasRealMarketPrice: true,
      timestamp: Date.now() - 1000 * 60 * 137
    },
    {
      id: 'card_demo_10',
      boosterId: 'booster_demo_02',
      sessionId: 'session_demo_02',
      name: 'Océan Pacifique',
      rarity: 'PC',
      rarityLabel: 'Peu Commune',
      rarityShortCode: 'PC',
      rarityColor: '#b1cff2',
      cardIndex: 1,
      totalInBooster: 5,
      description: 'Plus vaste océan du monde s\'étendant sur une superficie de plus de 165 millions de kilomètres carrés.',
      attack: 48,
      defense: 72,
      avgPrice: 45,
      minPrice: 35,
      maxPrice: 60,
      lastPrice: 42,
      sellPriceMin: 23,
      sellPriceMax: 34,
      sellPriceMid: 28,
      salesCount: 110,
      hasRealMarketPrice: true,
      timestamp: Date.now() - 1000 * 60 * 136
    },
    {
      id: 'card_demo_11',
      boosterId: 'booster_demo_03',
      sessionId: 'session_demo_03',
      name: 'Trou Noir Gargantua',
      rarity: 'L',
      rarityLabel: 'Légendaire',
      rarityShortCode: 'L',
      rarityColor: '#ffe144',
      cardIndex: 5,
      totalInBooster: 5,
      description: 'Objet céleste supermassif dont le champ gravitationnel est si intense qu\'aucune matière ni rayonnement ne peut s\'en échapper.',
      attack: 99,
      defense: 99,
      avgPrice: 4800,
      minPrice: 4200,
      maxPrice: 5500,
      lastPrice: 4900,
      sellPriceMin: 2400,
      sellPriceMax: 3600,
      sellPriceMid: 3000,
      salesCount: 4,
      hasRealMarketPrice: true,
      timestamp: Date.now() - 1000 * 60 * 95
    },
    {
      id: 'card_demo_12',
      boosterId: 'booster_demo_03',
      sessionId: 'session_demo_03',
      name: 'Galilée',
      rarity: 'SR',
      rarityLabel: 'Super Rare',
      rarityShortCode: 'SR',
      rarityColor: '#ed6fa3',
      cardIndex: 4,
      totalInBooster: 5,
      description: 'Astronome, mathématicien et physicien florentin du XVIIe siècle, pionnier de la méthode scientifique expérimentale.',
      attack: 76,
      defense: 83,
      avgPrice: 350,
      minPrice: 290,
      maxPrice: 410,
      lastPrice: 360,
      sellPriceMin: 175,
      sellPriceMax: 263,
      sellPriceMid: 219,
      salesCount: 38,
      hasRealMarketPrice: true,
      timestamp: Date.now() - 1000 * 60 * 94
    },
    {
      id: 'card_demo_13',
      boosterId: 'booster_demo_03',
      sessionId: 'session_demo_03',
      name: 'Colisée de Rome',
      rarity: 'R',
      rarityLabel: 'Rare',
      rarityShortCode: 'R',
      rarityColor: '#c6a7f2',
      cardIndex: 3,
      totalInBooster: 5,
      description: 'Gigantesque amphithéâtre flavien situé au centre de la ville de Rome, pouvant accueillir jusqu\'à 50 000 spectateurs.',
      attack: 60,
      defense: 87,
      avgPrice: 160,
      minPrice: 130,
      maxPrice: 200,
      lastPrice: 165,
      sellPriceMin: 80,
      sellPriceMax: 120,
      sellPriceMid: 100,
      salesCount: 65,
      hasRealMarketPrice: true,
      timestamp: Date.now() - 1000 * 60 * 93
    },
    {
      id: 'card_demo_14',
      boosterId: 'booster_demo_03',
      sessionId: 'session_demo_03',
      name: 'Napoléon Bonaparte',
      rarity: 'L',
      rarityLabel: 'Légendaire',
      rarityShortCode: 'L',
      rarityColor: '#ffe144',
      cardIndex: 2,
      totalInBooster: 5,
      description: 'Militaire et homme d\'État français, premier empereur des Français, réformateur du code civil et stratège de génie.',
      attack: 96,
      defense: 85,
      avgPrice: 2600,
      minPrice: 2300,
      maxPrice: 3000,
      lastPrice: 2750,
      sellPriceMin: 1300,
      sellPriceMax: 1950,
      sellPriceMid: 1625,
      salesCount: 12,
      hasRealMarketPrice: true,
      timestamp: Date.now() - 1000 * 60 * 92
    },
    {
      id: 'card_demo_15',
      boosterId: 'booster_demo_03',
      sessionId: 'session_demo_03',
      name: 'Forêt Amazonienne',
      rarity: 'PC',
      rarityLabel: 'Peu Commune',
      rarityShortCode: 'PC',
      rarityColor: '#b1cff2',
      cardIndex: 1,
      totalInBooster: 5,
      description: 'Plus grande forêt tropicale humide du monde, sanctuaire d\'une biodiversité végétale et animale inégalée sur Terre.',
      attack: 42,
      defense: 68,
      avgPrice: 35,
      minPrice: 25,
      maxPrice: 48,
      lastPrice: 32,
      sellPriceMin: 18,
      sellPriceMax: 26,
      sellPriceMid: 22,
      salesCount: 140,
      hasRealMarketPrice: true,
      timestamp: Date.now() - 1000 * 60 * 91
    },
    {
      id: 'card_demo_16',
      boosterId: 'booster_demo_04',
      sessionId: 'session_demo_04',
      name: 'Aurore Polaire',
      rarity: 'SR',
      rarityLabel: 'Super Rare',
      rarityShortCode: 'SR',
      rarityColor: '#ed6fa3',
      cardIndex: 5,
      totalInBooster: 5,
      description: 'Phénomène lumineux atmosphérique céleste provoqué par l\'interaction des particules solaires chargées avec la magnétosphère terrestre.',
      attack: 68,
      defense: 87,
      avgPrice: 410,
      minPrice: 350,
      maxPrice: 480,
      lastPrice: 420,
      sellPriceMin: 205,
      sellPriceMax: 308,
      sellPriceMid: 256,
      salesCount: 34,
      hasRealMarketPrice: true,
      timestamp: Date.now() - 1000 * 60 * 50
    },
    {
      id: 'card_demo_17',
      boosterId: 'booster_demo_04',
      sessionId: 'session_demo_04',
      name: 'Machu Picchu',
      rarity: 'R',
      rarityLabel: 'Rare',
      rarityShortCode: 'R',
      rarityColor: '#c6a7f2',
      cardIndex: 4,
      totalInBooster: 5,
      description: 'Ancienne cité inca perchée dans la cordillère des Andes péruvienne, chef-d\'œuvre d\'harmonie architecturale et naturelle.',
      attack: 58,
      defense: 82,
      avgPrice: 195,
      minPrice: 160,
      maxPrice: 240,
      lastPrice: 200,
      sellPriceMin: 98,
      sellPriceMax: 146,
      sellPriceMid: 122,
      salesCount: 52,
      hasRealMarketPrice: true,
      timestamp: Date.now() - 1000 * 60 * 49
    },
    {
      id: 'card_demo_18',
      boosterId: 'booster_demo_04',
      sessionId: 'session_demo_04',
      name: 'Wolfgang Amadeus Mozart',
      rarity: 'UR',
      rarityLabel: 'Ultra Rare',
      rarityShortCode: 'UR',
      rarityColor: '#fa9931',
      cardIndex: 3,
      totalInBooster: 5,
      description: 'Compositeur autrichien virtuose de la période classique, auteur de chefs-d\'œuvre universels d\'opéra et de symphonie.',
      attack: 87,
      defense: 81,
      avgPrice: 940,
      minPrice: 800,
      maxPrice: 1100,
      lastPrice: 960,
      sellPriceMin: 470,
      sellPriceMax: 705,
      sellPriceMid: 588,
      salesCount: 25,
      hasRealMarketPrice: true,
      timestamp: Date.now() - 1000 * 60 * 48
    },
    {
      id: 'card_demo_19',
      boosterId: 'booster_demo_04',
      sessionId: 'session_demo_04',
      name: 'Vulcain (Dieu du Feu)',
      rarity: 'PC',
      rarityLabel: 'Peu Commune',
      rarityShortCode: 'PC',
      rarityColor: '#b1cff2',
      cardIndex: 2,
      totalInBooster: 5,
      description: 'Dieu romain du feu, des volcans, de la forge et du travail des métaux.',
      attack: 56,
      defense: 62,
      avgPrice: 38,
      minPrice: 28,
      maxPrice: 50,
      lastPrice: 35,
      sellPriceMin: 19,
      sellPriceMax: 29,
      sellPriceMid: 24,
      salesCount: 125,
      hasRealMarketPrice: true,
      timestamp: Date.now() - 1000 * 60 * 47
    },
    {
      id: 'card_demo_20',
      boosterId: 'booster_demo_04',
      sessionId: 'session_demo_04',
      name: 'Constellation de Cassiopée',
      rarity: 'C',
      rarityLabel: 'Commune',
      rarityShortCode: 'C',
      rarityColor: '#b8f2d5',
      cardIndex: 1,
      totalInBooster: 5,
      description: 'Constellation circumpolaire de l\'hémisphère nord, reconnaissable à sa forme caractéristique de W dans le ciel étoilé.',
      attack: 38,
      defense: 45,
      avgPrice: 18,
      minPrice: 12,
      maxPrice: 25,
      lastPrice: 19,
      sellPriceMin: 9,
      sellPriceMax: 14,
      sellPriceMid: 11,
      salesCount: 210,
      hasRealMarketPrice: true,
      timestamp: Date.now() - 1000 * 60 * 46
    },
    {
      id: 'card_demo_21',
      boosterId: 'booster_demo_05',
      sessionId: 'session_demo_05',
      name: 'Jeanne d\'Arc',
      rarity: 'L',
      rarityLabel: 'Légendaire',
      rarityShortCode: 'L',
      rarityColor: '#ffe144',
      cardIndex: 5,
      totalInBooster: 5,
      description: 'Héroïne nationale française et sainte de l\'Église catholique, figure majeure de la guerre de Cent Ans et du siège d\'Orléans.',
      attack: 97,
      defense: 94,
      avgPrice: 4200,
      minPrice: 3700,
      maxPrice: 4900,
      lastPrice: 4350,
      sellPriceMin: 2100,
      sellPriceMax: 3150,
      sellPriceMid: 2625,
      salesCount: 5,
      hasRealMarketPrice: true,
      timestamp: Date.now() - 1000 * 60 * 12
    },
    {
      id: 'card_demo_22',
      boosterId: 'booster_demo_05',
      sessionId: 'session_demo_05',
      name: 'Stonehenge',
      rarity: 'R',
      rarityLabel: 'Rare',
      rarityShortCode: 'R',
      rarityColor: '#c6a7f2',
      cardIndex: 4,
      totalInBooster: 5,
      description: 'Monolithe mégalithique circulaire du néolithique situé dans le Wiltshire en Angleterre, aligné sur les solstices solaires.',
      attack: 54,
      defense: 86,
      avgPrice: 175,
      minPrice: 145,
      maxPrice: 215,
      lastPrice: 180,
      sellPriceMin: 88,
      sellPriceMax: 131,
      sellPriceMid: 109,
      salesCount: 61,
      hasRealMarketPrice: true,
      timestamp: Date.now() - 1000 * 60 * 11
    },
    {
      id: 'card_demo_23',
      boosterId: 'booster_demo_05',
      sessionId: 'session_demo_05',
      name: 'Mont Everest',
      rarity: 'PC',
      rarityLabel: 'Peu Commune',
      rarityShortCode: 'PC',
      rarityColor: '#b1cff2',
      cardIndex: 3,
      totalInBooster: 5,
      description: 'Plus haut sommet du monde culminant à 8 848 mètres d\'altitude dans la chaîne de l\'Himalaya entre le Népal et la Chine.',
      attack: 49,
      defense: 80,
      avgPrice: 48,
      minPrice: 38,
      maxPrice: 62,
      lastPrice: 45,
      sellPriceMin: 24,
      sellPriceMax: 36,
      sellPriceMid: 30,
      salesCount: 115,
      hasRealMarketPrice: true,
      timestamp: Date.now() - 1000 * 60 * 10
    },
    {
      id: 'card_demo_24',
      boosterId: 'booster_demo_05',
      sessionId: 'session_demo_05',
      name: 'Fosse des Mariannes',
      rarity: 'C',
      rarityLabel: 'Commune',
      rarityShortCode: 'C',
      rarityColor: '#b8f2d5',
      cardIndex: 2,
      totalInBooster: 5,
      description: 'Fosse océanique la plus profonde du globe terrestre, atteignant environ 11 000 mètres sous le niveau de la mer.',
      attack: 40,
      defense: 58,
      avgPrice: 16,
      minPrice: 11,
      maxPrice: 22,
      lastPrice: 17,
      sellPriceMin: 8,
      sellPriceMax: 12,
      sellPriceMid: 10,
      salesCount: 240,
      hasRealMarketPrice: true,
      timestamp: Date.now() - 1000 * 60 * 9
    },
    {
      id: 'card_demo_25',
      boosterId: 'booster_demo_05',
      sessionId: 'session_demo_05',
      name: 'Nébuleuse d\'Orion',
      rarity: 'C',
      rarityLabel: 'Commune',
      rarityShortCode: 'C',
      rarityColor: '#b8f2d5',
      cardIndex: 1,
      totalInBooster: 5,
      description: 'Gigantesque nébuleuse diffuse en émission et réflexion au cœur de la constellation d\'Orion, berceau de pouponnières d\'étoiles.',
      attack: 46,
      defense: 52,
      avgPrice: 22,
      minPrice: 15,
      maxPrice: 30,
      lastPrice: 20,
      sellPriceMin: 11,
      sellPriceMax: 17,
      sellPriceMid: 14,
      salesCount: 190,
      hasRealMarketPrice: true,
      timestamp: Date.now() - 1000 * 60 * 8
    }
  ];

  const DEFAULT_DISCORD_CONFIG = {
    enabled: true,
    webhookUrl: '',
    discordUserId: '',
    pauseThreadId: '',
    rules: [
      {
        id: 'rule_default_1',
        name: 'Légendaires & Ultra Rares',
        enabled: true,
        threadId: '',
        customWebhookUrl: '',
        rarities: { L: true, UR: true, SR: false, R: false, PC: false, C: false },
        minPrice: 0,
        maxPrice: null,
        pingUserId: ''
      },
      {
        id: 'rule_default_2',
        name: 'Super Rares & Drops Spéciaux',
        enabled: true,
        threadId: '',
        customWebhookUrl: '',
        rarities: { L: false, UR: false, SR: true, R: false, PC: false, C: false },
        minPrice: 0,
        maxPrice: null,
        pingUserId: ''
      },
      {
        id: 'rule_default_3',
        name: 'Cartes Chères (+500 🪙)',
        enabled: true,
        threadId: '',
        customWebhookUrl: '',
        rarities: { L: true, UR: true, SR: true, R: true, PC: true, C: true },
        minPrice: 500,
        maxPrice: null,
        pingUserId: ''
      }
    ]
  };

  const SIMULATION_CARD_POOL = [
    { name: 'Nikola Tesla', rarity: 'UR', basePrice: 1350, atk: 88, def: 84, desc: 'Inventeur et ingénieur visionnaire d\'origine serbe, père du courant alternatif.' },
    { name: 'Hubble Deep Field', rarity: 'SR', basePrice: 470, atk: 65, def: 90, desc: 'Image emblématique de l\'espace profond révélant des milliers de galaxies lointaines.' },
    { name: 'Cléopâtre VII', rarity: 'UR', basePrice: 980, atk: 84, def: 78, desc: 'Dernière souveraine d\'Égypte de la dynastie ptolémaïque, reine légendaire.' },
    { name: 'Cité Interdite', rarity: 'SR', basePrice: 390, atk: 60, def: 92, desc: 'Palais impérial des dynasties Ming et Qing au cœur de Pékin.' },
    { name: 'Charles Darwin', rarity: 'R', basePrice: 170, atk: 66, def: 74, desc: 'Naturaliste anglais à l\'origine de la théorie moderne de l\'évolution des espèces.' },
    { name: 'Aurora Australis', rarity: 'R', basePrice: 155, atk: 55, def: 82, desc: 'Aurore australe brillante illuminant le ciel de l\'hémisphère sud.' },
    { name: 'Panthéon de Rome', rarity: 'PC', basePrice: 42, atk: 44, def: 70, desc: 'Temple antique romain surmonté d\'une gigantesque coupole en béton non armé.' },
    { name: 'Mont Fuji', rarity: 'PC', basePrice: 48, atk: 50, def: 68, desc: 'Stratovolcan sacré du Japon culminant à 3 776 mètres d\'altitude.' },
    { name: 'Canal de Panama', rarity: 'C', basePrice: 18, atk: 35, def: 55, desc: 'Voie navigable artificielle de 80 km reliant l\'océan Atlantique à l\'océan Pacifique.' },
    { name: 'Désert du Sahara', rarity: 'C', basePrice: 15, atk: 40, def: 45, desc: 'Plus vaste désert chaud de la planète couvrant le tiers nord de l\'Afrique.' },
    { name: 'Isaac Newton', rarity: 'L', basePrice: 3400, atk: 93, def: 95, desc: 'Mathématicien et physicien anglais ayant formulé les lois universelles de la gravitation.' }
  ];

  function generateRandomSimulationCard(boosterIndex = 1) {
    const item = SIMULATION_CARD_POOL[Math.floor(Math.random() * SIMULATION_CARD_POOL.length)];
    const rarityMeta = OFFICIAL_RARITIES[item.rarity] || OFFICIAL_RARITIES.C;
    const variance = (Math.random() * 0.3) - 0.15;
    const avgPrice = Math.round(item.basePrice * (1 + variance));
    const minPrice = Math.round(avgPrice * 0.85);
    const maxPrice = Math.round(avgPrice * 1.2);
    const lastPrice = Math.round(avgPrice * (1 + (Math.random() * 0.1 - 0.05)));

    return {
      id: 'card_sim_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      boosterId: 'booster_sim_' + Math.floor(Date.now() / 15000),
      sessionId: 'session_sim',
      name: item.name,
      rarity: item.rarity,
      rarityLabel: rarityMeta.label,
      rarityShortCode: rarityMeta.shortCode,
      rarityColor: rarityMeta.color,
      cardIndex: ((boosterIndex - 1) % 5) + 1,
      totalInBooster: 5,
      description: item.desc,
      attack: item.atk,
      defense: item.def,
      avgPrice: avgPrice,
      minPrice: minPrice,
      maxPrice: maxPrice,
      lastPrice: lastPrice,
      sellPriceMin: Math.round(avgPrice * 0.50),
      sellPriceMax: Math.round(avgPrice * 0.75),
      sellPriceMid: Math.round(avgPrice * 0.625),
      salesCount: Math.floor(Math.random() * 80) + 5,
      hasRealMarketPrice: true,
      timestamp: Date.now()
    };
  }

  // ==========================================================================
  // 2. UTILITAIRES GRAPHIQUES CANVAS RETINA
  // ==========================================================================

  function setupRetinaCanvas(canvas) {
    if (!canvas) return { ctx: null, width: 0, height: 0, dpr: 1 };
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width || canvas.parentElement?.clientWidth || 300;
    const height = rect.height || canvas.parentElement?.clientHeight || 200;

    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.resetTransform();
      ctx.scale(dpr, dpr);
    }
    return { ctx, width, height, dpr };
  }

  function drawRoundedRect(ctx, x, y, width, height, radius) {
    if (width <= 0 || height <= 0) return;
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.arcTo(x + width, y, x + width, y + r, r);
    ctx.lineTo(x + width, y + height - r);
    ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
    ctx.lineTo(x + r, y + height);
    ctx.arcTo(x, y + height, x, y + height - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  // ==========================================================================
  // 3. MOTEUR DE GRAPHIQUES CANVAS
  // ==========================================================================

  class CumulativeGainsChart {
    constructor(canvasId, tooltipId) {
      this.canvas = document.getElementById(canvasId);
      this.tooltip = document.getElementById(tooltipId);
      this.dataPoints = [];
      this.hoverIndex = -1;
      this.animationProgress = 1;

      if (this.canvas) {
        this.initEvents();
        window.addEventListener('resize', () => this.render(1));
      }
    }

    setData(cards) {
      if (!Array.isArray(cards) || cards.length === 0) {
        this.dataPoints = [];
        this.render(1);
        return;
      }

      const sorted = [...cards].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      let runningTotal = 0;
      this.dataPoints = sorted.map((card, idx) => {
        const price = Number(card.avgPrice || card.suggestedPrice || 0);
        runningTotal += price;
        return {
          index: idx + 1,
          cardName: card.name,
          rarity: card.rarity,
          rarityColor: OFFICIAL_RARITIES[card.rarity]?.color || '#38bdf8',
          cardPrice: price,
          cumulativeValue: runningTotal,
          timestamp: card.timestamp || Date.now()
        };
      });

      this.animate();
    }

    animate() {
      let start = null;
      const duration = 500;
      const step = (timestamp) => {
        if (!start) start = timestamp;
        const elapsed = timestamp - start;
        this.animationProgress = Math.min(1, elapsed / duration);
        const ease = 1 - Math.pow(1 - this.animationProgress, 3);
        this.render(ease);

        if (this.animationProgress < 1) {
          requestAnimationFrame(step);
        }
      };
      requestAnimationFrame(step);
    }

    initEvents() {
      this.canvas.addEventListener('mousemove', (e) => {
        if (this.dataPoints.length === 0) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.handleMouseMove(x, y, rect);
      });

      this.canvas.addEventListener('mouseleave', () => {
        this.hoverIndex = -1;
        if (this.tooltip) this.tooltip.style.opacity = '0';
        this.render(1);
      });
    }

    handleMouseMove(mouseX, mouseY, rect) {
      const padding = { top: 25, right: 30, bottom: 40, left: 65 };
      const chartWidth = rect.width - padding.left - padding.right;

      if (mouseX < padding.left || mouseX > rect.width - padding.right) {
        this.hoverIndex = -1;
        if (this.tooltip) this.tooltip.style.opacity = '0';
        this.render(1);
        return;
      }

      const stepX = chartWidth / Math.max(1, this.dataPoints.length - 1);
      const closestIndex = Math.min(
        this.dataPoints.length - 1,
        Math.max(0, Math.round((mouseX - padding.left) / stepX))
      );

      this.hoverIndex = closestIndex;
      this.render(1);
      this.updateTooltip(rect, padding, stepX);
    }

    updateTooltip(rect, padding, stepX) {
      if (!this.tooltip || this.hoverIndex === -1) return;
      const pt = this.dataPoints[this.hoverIndex];
      if (!pt) return;

      const posX = padding.left + this.hoverIndex * stepX;
      const dateStr = new Date(pt.timestamp).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      this.tooltip.innerHTML = `
        <div class="chart-tooltip-header">
          <span class="tooltip-badge" style="background: ${pt.rarityColor}22; color: ${pt.rarityColor}; border: 1px solid ${pt.rarityColor};">
            ${pt.rarity}
          </span>
          <span class="tooltip-title">${pt.cardName}</span>
        </div>
        <div class="chart-tooltip-body">
          <div class="tooltip-row">
            <span>Prix Carte :</span>
            <span class="tooltip-val" style="color: ${pt.rarityColor}">+${pt.cardPrice.toLocaleString('fr-FR')} 🪙</span>
          </div>
          <div class="tooltip-row">
            <span>Cumul Total :</span>
            <span class="tooltip-val" style="color: var(--cyber-cyan); font-weight: 700;">${pt.cumulativeValue.toLocaleString('fr-FR')} 🪙</span>
          </div>
          <div class="tooltip-row" style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">
            <span>Tirée à :</span>
            <span>${dateStr}</span>
          </div>
        </div>
      `;

      this.tooltip.style.left = `${posX}px`;
      this.tooltip.style.top = `30px`;
      this.tooltip.style.opacity = '1';
    }

    render(progress = 1) {
      if (!this.canvas) return;
      const { ctx, width, height } = setupRetinaCanvas(this.canvas);
      if (!ctx || width <= 0 || height <= 0) return;
      ctx.clearRect(0, 0, width, height);

      const padding = { top: 25, right: 30, bottom: 40, left: 65 };
      const chartWidth = width - padding.left - padding.right;
      const chartHeight = height - padding.top - padding.bottom;

      if (this.dataPoints.length === 0) {
        ctx.fillStyle = '#64748b';
        ctx.font = '13px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Aucune donnée de gains disponible', width / 2, height / 2);
        return;
      }

      const maxValue = Math.max(...this.dataPoints.map((d) => d.cumulativeValue), 100);
      const stepX = chartWidth / Math.max(1, this.dataPoints.length - 1);

      // Grille horizontale
      const gridLines = 5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.fillStyle = '#64748b';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';

      for (let i = 0; i <= gridLines; i++) {
        const yVal = (maxValue / gridLines) * i;
        const yPos = padding.top + chartHeight - (chartHeight * (i / gridLines));
        ctx.beginPath();
        ctx.moveTo(padding.left, yPos);
        ctx.lineTo(width - padding.right, yPos);
        ctx.stroke();
        ctx.fillText(Math.round(yVal).toLocaleString('fr-FR') + ' 🪙', padding.left - 10, yPos + 4);
      }

      const points = this.dataPoints.map((pt, i) => {
        const x = padding.left + i * stepX;
        const ratio = (pt.cumulativeValue / maxValue) * progress;
        const y = padding.top + chartHeight - (chartHeight * ratio);
        return { x, y, raw: pt };
      });

      if (points.length < 2) {
        const p = points[0];
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#06b6d4';
        ctx.fill();
        return;
      }

      // Dégradé néon sous la courbe
      const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
      gradient.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
      gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.15)');
      gradient.addColorStop(1, 'rgba(6, 182, 212, 0.0)');

      ctx.beginPath();
      ctx.moveTo(points[0].x, padding.top + chartHeight);
      ctx.lineTo(points[0].x, points[0].y);

      for (let i = 0; i < points.length - 1; i++) {
        const curr = points[i];
        const next = points[i + 1];
        const xc = (curr.x + next.x) / 2;
        const yc = (curr.y + next.y) / 2;
        ctx.quadraticCurveTo(curr.x, curr.y, xc, yc);
      }
      const last = points[points.length - 1];
      ctx.lineTo(last.x, last.y);
      ctx.lineTo(last.x, padding.top + chartHeight);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Courbe de Bézier
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 0; i < points.length - 1; i++) {
        const curr = points[i];
        const next = points[i + 1];
        const xc = (curr.x + next.x) / 2;
        const yc = (curr.y + next.y) / 2;
        ctx.quadraticCurveTo(curr.x, curr.y, xc, yc);
      }
      ctx.lineTo(last.x, last.y);
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(6, 182, 212, 0.8)';
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.restore();

      // Réticule hover
      if (this.hoverIndex >= 0 && this.hoverIndex < points.length) {
        const p = points[this.hoverIndex];
        ctx.save();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x, padding.top);
        ctx.lineTo(p.x, padding.top + chartHeight);
        ctx.stroke();
        ctx.restore();

        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = p.raw.rarityColor + '44';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = p.raw.rarityColor;
        ctx.lineWidth = 3;
        ctx.fill();
        ctx.stroke();
      }

      // Axe X
      ctx.fillStyle = '#64748b';
      ctx.font = '10px "Inter", sans-serif';
      ctx.textAlign = 'center';
      const maxLabels = Math.min(8, this.dataPoints.length);
      const labelStep = Math.max(1, Math.floor(this.dataPoints.length / maxLabels));

      for (let i = 0; i < this.dataPoints.length; i += labelStep) {
        const x = padding.left + i * stepX;
        ctx.fillText('Carte #' + (i + 1), x, height - 15);
      }
    }
  }

  class RarityDonutChart {
    constructor(canvasId, legendId, centerCountId, centerLabelId) {
      this.canvas = document.getElementById(canvasId);
      this.legendContainer = document.getElementById(legendId);
      this.centerCountEl = document.getElementById(centerCountId);
      this.centerLabelEl = document.getElementById(centerLabelId);
      this.slices = [];
      this.totalCards = 0;
      this.hoverSlice = -1;
      this.animationProgress = 1;

      if (this.canvas) {
        this.initEvents();
        window.addEventListener('resize', () => this.render(1));
      }
    }

    setData(rarityBreakdown, totalCards) {
      this.totalCards = totalCards || 0;
      const rarityOrder = ['L', 'UR', 'SR', 'R', 'PC', 'C'];
      this.slices = rarityOrder.map((key) => {
        const item = rarityBreakdown[key] || { count: 0, rate: 0, totalValue: 0 };
        const meta = OFFICIAL_RARITIES[key];
        return {
          key: key,
          label: meta.label,
          color: meta.color,
          glowColor: meta.glowColor,
          count: item.count || 0,
          rate: item.rate || (this.totalCards > 0 ? (item.count / this.totalCards) * 100 : 0),
          totalValue: item.totalValue || 0
        };
      });

      this.renderLegend();
      this.animate();
    }

    animate() {
      let start = null;
      const duration = 500;
      const step = (timestamp) => {
        if (!start) start = timestamp;
        const elapsed = timestamp - start;
        this.animationProgress = Math.min(1, elapsed / duration);
        const ease = 1 - Math.pow(1 - this.animationProgress, 3);
        this.render(ease);

        if (this.animationProgress < 1) {
          requestAnimationFrame(step);
        }
      };
      requestAnimationFrame(step);
    }

    initEvents() {
      this.canvas.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.handleMouseMove(x, y, rect);
      });

      this.canvas.addEventListener('mouseleave', () => {
        this.hoverSlice = -1;
        this.updateCenterDisplay(null);
        this.render(1);
      });
    }

    handleMouseMove(mouseX, mouseY, rect) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const dx = mouseX - centerX;
      const dy = mouseY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const outerRadius = Math.min(centerX, centerY) * 0.88;
      const innerRadius = outerRadius * 0.58;

      if (dist < innerRadius || dist > outerRadius + 8) {
        this.hoverSlice = -1;
        this.updateCenterDisplay(null);
        this.render(1);
        return;
      }

      let angle = Math.atan2(dy, dx);
      if (angle < -Math.PI / 2) {
        angle += Math.PI * 2;
      }
      const normalizedAngle = (angle + Math.PI / 2) % (Math.PI * 2);

      let runningAngle = 0;
      let found = -1;

      for (let i = 0; i < this.slices.length; i++) {
        const slice = this.slices[i];
        if (slice.count <= 0) continue;
        const sliceAngle = (slice.count / Math.max(1, this.totalCards)) * (Math.PI * 2);
        if (normalizedAngle >= runningAngle && normalizedAngle <= runningAngle + sliceAngle) {
          found = i;
          break;
        }
        runningAngle += sliceAngle;
      }

      this.hoverSlice = found;
      if (found !== -1) {
        this.updateCenterDisplay(this.slices[found]);
      } else {
        this.updateCenterDisplay(null);
      }
      this.render(1);
    }

    updateCenterDisplay(slice) {
      if (!this.centerCountEl || !this.centerLabelEl) return;
      if (slice) {
        this.centerCountEl.textContent = String(slice.count);
        this.centerCountEl.style.color = slice.color;
        this.centerLabelEl.textContent = slice.label + ' (' + slice.rate.toFixed(1) + '%)';
      } else {
        this.centerCountEl.textContent = String(this.totalCards);
        this.centerCountEl.style.color = '#ffffff';
        this.centerLabelEl.textContent = 'Cartes Totales';
      }
    }

    render(progress = 1) {
      if (!this.canvas) return;
      const { ctx, width, height } = setupRetinaCanvas(this.canvas);
      if (!ctx || width <= 0 || height <= 0) return;
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const outerRadius = Math.min(centerX, centerY) * 0.86;
      const innerRadius = outerRadius * 0.58;

      if (this.totalCards === 0) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
        ctx.arc(centerX, centerY, innerRadius, Math.PI * 2, 0, true);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.fill();

        ctx.fillStyle = '#64748b';
        ctx.font = '13px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Aucun tirage', centerX, centerY + 4);
        return;
      }

      let startAngle = -Math.PI / 2;
      const totalAngle = Math.PI * 2 * progress;

      for (let i = 0; i < this.slices.length; i++) {
        const slice = this.slices[i];
        if (slice.count <= 0) continue;

        const sliceAngle = (slice.count / this.totalCards) * totalAngle;
        const endAngle = startAngle + sliceAngle;
        const isHovered = this.hoverSlice === i;
        const currentOuter = isHovered ? outerRadius + 6 : outerRadius;
        const currentInner = isHovered ? innerRadius - 2 : innerRadius;

        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, currentOuter, startAngle, endAngle);
        ctx.arc(centerX, centerY, currentInner, endAngle, startAngle, true);
        ctx.closePath();

        ctx.fillStyle = slice.color;
        if (isHovered) {
          ctx.shadowColor = slice.glowColor;
          ctx.shadowBlur = 18;
        }
        ctx.fill();

        ctx.strokeStyle = '#0b0f19';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();

        startAngle = endAngle;
      }
    }

    renderLegend() {
      if (!this.legendContainer) return;
      this.legendContainer.innerHTML = '';

      this.slices.forEach((slice, idx) => {
        const el = document.createElement('div');
        el.className = 'rarity-legend-row';
        el.innerHTML = `
          <div class="legend-left">
            <span class="gem-dot" style="background: ${slice.color}; box-shadow: 0 0 8px ${slice.glowColor};"></span>
            <span class="legend-name">${slice.label}</span>
          </div>
          <div class="legend-right">
            <span class="legend-count">${slice.count}</span>
            <span class="legend-rate">${slice.rate.toFixed(1)}%</span>
          </div>
        `;

        el.addEventListener('mouseenter', () => {
          this.hoverSlice = idx;
          this.updateCenterDisplay(slice);
          this.render(1);
        });

        el.addEventListener('mouseleave', () => {
          this.hoverSlice = -1;
          this.updateCenterDisplay(null);
          this.render(1);
        });

        this.legendContainer.appendChild(el);
      });
    }
  }

  class PriceTierBarChart {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      this.tiers = [
        { id: 'tier1000', label: '+1000 🪙', min: 1000, max: Infinity, count: 0, totalValue: 0, color: '#ffe144' },
        { id: 'tier250',  label: '250 - 1000 🪙', min: 250, max: 999, count: 0, totalValue: 0, color: '#fa9931' },
        { id: 'tier100',  label: '100 - 250 🪙', min: 100, max: 249, count: 0, totalValue: 0, color: '#ed6fa3' },
        { id: 'tier50',   label: '50 - 100 🪙', min: 50, max: 99, count: 0, totalValue: 0, color: '#c6a7f2' },
        { id: 'tier0',    label: '0 - 50 🪙', min: 0, max: 49, count: 0, totalValue: 0, color: '#b1cff2' }
      ];
      this.hoverTier = -1;
      this.animationProgress = 1;

      if (this.canvas) {
        this.initEvents();
        window.addEventListener('resize', () => this.render(1));
      }
    }

    setData(cards) {
      this.tiers.forEach((t) => {
        t.count = 0;
        t.totalValue = 0;
      });

      if (Array.isArray(cards)) {
        cards.forEach((card) => {
          const price = Number(card.avgPrice || card.suggestedPrice || 0);
          for (const tier of this.tiers) {
            if (price >= tier.min && price <= tier.max) {
              tier.count++;
              tier.totalValue += price;
              break;
            }
          }
        });
      }

      this.animate();
    }

    animate() {
      let start = null;
      const duration = 500;
      const step = (timestamp) => {
        if (!start) start = timestamp;
        const elapsed = timestamp - start;
        this.animationProgress = Math.min(1, elapsed / duration);
        const ease = 1 - Math.pow(1 - this.animationProgress, 3);
        this.render(ease);

        if (this.animationProgress < 1) {
          requestAnimationFrame(step);
        }
      };
      requestAnimationFrame(step);
    }

    initEvents() {
      this.canvas.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const y = e.clientY - rect.top;
        this.handleMouseMove(y, rect.height);
      });

      this.canvas.addEventListener('mouseleave', () => {
        this.hoverTier = -1;
        this.render(1);
      });
    }

    handleMouseMove(mouseY, height) {
      const padding = { top: 20, bottom: 20 };
      const chartHeight = height - padding.top - padding.bottom;
      const slotHeight = chartHeight / this.tiers.length;

      if (mouseY < padding.top || mouseY > height - padding.bottom) {
        this.hoverTier = -1;
        this.render(1);
        return;
      }

      const idx = Math.floor((mouseY - padding.top) / slotHeight);
      this.hoverTier = (idx >= 0 && idx < this.tiers.length) ? idx : -1;
      this.render(1);
    }

    render(progress = 1) {
      if (!this.canvas) return;
      const { ctx, width, height } = setupRetinaCanvas(this.canvas);
      if (!ctx || width <= 0 || height <= 0) return;
      ctx.clearRect(0, 0, width, height);

      const padding = { top: 20, right: 120, bottom: 20, left: 110 };
      const chartWidth = width - padding.left - padding.right;
      const chartHeight = height - padding.top - padding.bottom;
      const slotHeight = chartHeight / this.tiers.length;
      const barHeight = Math.min(22, slotHeight * 0.55);

      const maxCount = Math.max(...this.tiers.map((t) => t.count), 1);
      const totalCards = this.tiers.reduce((sum, t) => sum + t.count, 0);

      this.tiers.forEach((tier, i) => {
        const yCenter = padding.top + i * slotHeight + slotHeight / 2;
        const yBar = yCenter - barHeight / 2;
        const barTargetWidth = (tier.count / maxCount) * chartWidth;
        const currentWidth = Math.max(6, barTargetWidth * progress);
        const isHovered = this.hoverTier === i;

        // Label de gauche
        ctx.fillStyle = isHovered ? '#ffffff' : '#94a3b8';
        ctx.font = (isHovered ? 'bold ' : '') + '12px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(tier.label, padding.left - 15, yCenter + 4);

        // Track fond
        drawRoundedRect(ctx, padding.left, yBar, chartWidth, barHeight, barHeight / 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.fill();

        // Barre remplie
        if (tier.count > 0) {
          ctx.save();
          const grad = ctx.createLinearGradient(padding.left, 0, padding.left + currentWidth, 0);
          grad.addColorStop(0, tier.color + '99');
          grad.addColorStop(1, tier.color);

          drawRoundedRect(ctx, padding.left, yBar, currentWidth, barHeight, barHeight / 2);
          ctx.fillStyle = grad;

          if (isHovered) {
            ctx.shadowColor = tier.color;
            ctx.shadowBlur = 12;
          }
          ctx.fill();
          ctx.restore();
        }

        // Label de droite
        const rate = totalCards > 0 ? ((tier.count / totalCards) * 100).toFixed(0) : 0;
        ctx.fillStyle = isHovered ? tier.color : '#cbd5e1';
        ctx.font = '12px "Inter", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(
          tier.count + ' carte' + (tier.count > 1 ? 's' : '') + ' (' + rate + '%)',
          padding.left + chartWidth + 15,
          yCenter + 4
        );
      });
    }
  }

  // ==========================================================================
  // 4. ÉTAT GLOBAL DU DASHBOARD
  // ==========================================================================

  const state = {
    extensionId: localStorage.getItem('wm_extension_id') || '',
    isAutoSyncActive: false,
    autoSyncInterval: null,
    syncFrequencySec: 5,
    connectionStatus: 'disconnected',

    cards: [],
    boosters: [],
    marketPrices: {},
    discordConfig: { ...DEFAULT_DISCORD_CONFIG },

    searchQuery: '',
    selectedRarity: 'ALL',
    selectedStatus: 'ALL',
    sortColumn: 'timestamp',
    sortDirection: 'desc',
    currentPage: 1,
    itemsPerPage: 10,

    charts: {
      gains: null,
      donut: null,
      priceTiers: null
    }
  };

  // ==========================================================================
  // 5. FONCTIONS DE PERSISTANCE & CALCUL
  // ==========================================================================

  function loadSavedState() {
    const savedCards = localStorage.getItem('wm_cached_cards');
    if (savedCards) {
      try {
        state.cards = JSON.parse(savedCards);
      } catch (_) {
        state.cards = [...INITIAL_MOCK_CARDS];
      }
    } else {
      state.cards = [...INITIAL_MOCK_CARDS];
    }

    const savedConfig = localStorage.getItem('wm_cached_discord_config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        state.discordConfig = { ...DEFAULT_DISCORD_CONFIG, ...parsed };
        if (!Array.isArray(state.discordConfig.rules) || state.discordConfig.rules.length === 0) {
          state.discordConfig.rules = [...DEFAULT_DISCORD_CONFIG.rules];
        }
      } catch (_) {
        state.discordConfig = { ...DEFAULT_DISCORD_CONFIG };
      }
    } else {
      state.discordConfig = { ...DEFAULT_DISCORD_CONFIG };
    }

    const savedExtId = localStorage.getItem('wm_extension_id');
    if (savedExtId) {
      state.extensionId = savedExtId;
      const input = document.getElementById('input-extension-id');
      if (input) input.value = savedExtId;
    }
  }

  function persistData() {
    try {
      localStorage.setItem('wm_cached_cards', JSON.stringify(state.cards));
      localStorage.setItem('wm_cached_discord_config', JSON.stringify(state.discordConfig));
      if (state.extensionId) {
        localStorage.setItem('wm_extension_id', state.extensionId);
      }
    } catch (err) {
      console.warn('[WikiMasters Dashboard] Erreur persistance :', err);
    }
  }

  function calculateStats() {
    const totalCards = state.cards.length;
    const totalBoosters = Math.max(
      state.boosters.length,
      totalCards > 0 ? Math.ceil(totalCards / 5) : 0
    );

    let totalEstimatedValue = 0;
    let totalSellMin = 0;
    let totalSellMax = 0;

    const rarityCounts = { L: 0, UR: 0, SR: 0, R: 0, PC: 0, C: 0 };
    const rarityValues = { L: 0, UR: 0, SR: 0, R: 0, PC: 0, C: 0 };

    state.cards.forEach((card) => {
      const r = card.rarity || 'C';
      rarityCounts[r] = (rarityCounts[r] || 0) + 1;

      const price = Number(card.avgPrice || card.suggestedPrice || 0);
      totalEstimatedValue += price;
      totalSellMin += Math.round(price * 0.50);
      totalSellMax += Math.round(price * 0.75);
      rarityValues[r] = (rarityValues[r] || 0) + price;
    });

    const rarityBreakdown = {};
    ['L', 'UR', 'SR', 'R', 'PC', 'C'].forEach((r) => {
      const meta = OFFICIAL_RARITIES[r];
      const count = rarityCounts[r] || 0;
      const rate = totalCards > 0 ? (count / totalCards) * 100 : 0;
      rarityBreakdown[r] = {
        id: r,
        label: meta.label,
        count: count,
        rate: Number(rate.toFixed(1)),
        totalValue: rarityValues[r] || 0
      };
    });

    const avgBoosterValue = totalBoosters > 0 ? Math.round(totalEstimatedValue / totalBoosters) : 0;

    return {
      totalCards,
      totalBoosters,
      totalEstimatedValue,
      totalSellMin,
      totalSellMax,
      avgBoosterValue,
      rarityCounts,
      rarityBreakdown
    };
  }

  function updateDashboardData() {
    const stats = calculateStats();

    const elBoosters = document.getElementById('kpi-val-boosters');
    const elCards = document.getElementById('kpi-val-cards');
    const elTotalValue = document.getElementById('kpi-val-total-value');
    const elAvgBooster = document.getElementById('kpi-val-avg-booster');
    const elResaleRange = document.getElementById('kpi-val-resale-range');

    if (elBoosters) elBoosters.textContent = stats.totalBoosters.toLocaleString('fr-FR');
    if (elCards) elCards.textContent = stats.totalCards.toLocaleString('fr-FR');
    if (elTotalValue) elTotalValue.textContent = stats.totalEstimatedValue.toLocaleString('fr-FR') + ' 🪙';
    if (elAvgBooster) elAvgBooster.textContent = '~' + stats.avgBoosterValue.toLocaleString('fr-FR') + ' 🪙';
    if (elResaleRange) {
      elResaleRange.textContent = stats.totalSellMin.toLocaleString('fr-FR') + ' - ' + stats.totalSellMax.toLocaleString('fr-FR') + ' 🪙';
    }

    ['L', 'UR', 'SR', 'R', 'PC', 'C'].forEach((r) => {
      const countEl = document.getElementById('pill-count-' + r.toLowerCase());
      const rateEl = document.getElementById('pill-rate-' + r.toLowerCase());
      const item = stats.rarityBreakdown[r];

      if (countEl) countEl.textContent = item.count;
      if (rateEl) rateEl.textContent = item.rate + '%';
    });

    if (state.charts.gains) {
      state.charts.gains.setData(state.cards);
    }
    if (state.charts.donut) {
      state.charts.donut.setData(stats.rarityBreakdown, stats.totalCards);
    }
    if (state.charts.priceTiers) {
      state.charts.priceTiers.setData(state.cards);
    }

    // Métriques avancées Onglet 2
    const sortedByPrice = [...state.cards].sort((a, b) => Number(b.avgPrice || 0) - Number(a.avgPrice || 0));
    const topCard = sortedByPrice[0];
    const elTopCard = document.getElementById('metrics-top-card');
    const elTopCardName = document.getElementById('metrics-top-card-name');
    const elAvgCard = document.getElementById('metrics-avg-card');
    const elResaleBooster = document.getElementById('metrics-resale-booster');
    const elHighTierRate = document.getElementById('metrics-high-tier-rate');

    if (elTopCard && topCard) {
      elTopCard.textContent = Number(topCard.avgPrice || 0).toLocaleString('fr-FR') + ' 🪙';
    }
    if (elTopCardName && topCard) {
      elTopCardName.textContent = '[' + topCard.rarity + '] ' + topCard.name;
    }
    if (elAvgCard) {
      const avgPerCard = stats.totalCards > 0 ? Math.round(stats.totalEstimatedValue / stats.totalCards) : 0;
      elAvgCard.textContent = avgPerCard.toLocaleString('fr-FR') + ' 🪙';
    }
    if (elResaleBooster) {
      const minResale = stats.totalBoosters > 0 ? Math.round(stats.totalSellMin / stats.totalBoosters) : 0;
      const maxResale = stats.totalBoosters > 0 ? Math.round(stats.totalSellMax / stats.totalBoosters) : 0;
      elResaleBooster.textContent = minResale.toLocaleString('fr-FR') + ' - ' + maxResale.toLocaleString('fr-FR') + ' 🪙';
    }
    if (elHighTierRate) {
      const highTierCount = (stats.rarityCounts.L || 0) + (stats.rarityCounts.UR || 0) + (stats.rarityCounts.SR || 0);
      const highTierRate = stats.totalCards > 0 ? ((highTierCount / stats.totalCards) * 100).toFixed(1) : '0.0';
      elHighTierRate.textContent = highTierRate + '%';
    }

    renderCardsTable();
    persistData();

    // Mettre à jour les KPIs de l'onglet Accueil
    const homeKpiCards = document.getElementById('home-kpi-cards');
    const homeKpiBoosters = document.getElementById('home-kpi-boosters');
    const homeKpiValue = document.getElementById('home-kpi-value');
    if (homeKpiCards) homeKpiCards.textContent = stats.totalCards.toLocaleString('fr-FR');
    if (homeKpiBoosters) homeKpiBoosters.textContent = stats.totalBoosters.toLocaleString('fr-FR');
    if (homeKpiValue) homeKpiValue.textContent = stats.totalEstimatedValue.toLocaleString('fr-FR') + ' 🪙';
  }

  // ==========================================================================
  // 6. GESTION DES ONGLETS
  // ==========================================================================

  function initNavigationTabs() {
    const navItems = document.querySelectorAll('.nav-item');
    const panes = document.querySelectorAll('.tab-pane');

    navItems.forEach((item) => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetTabId = item.getAttribute('data-tab');

        navItems.forEach((n) => n.classList.remove('active'));
        panes.forEach((p) => p.classList.remove('active'));

        item.classList.add('active');
        const targetPane = document.getElementById(targetTabId);
        if (targetPane) {
          targetPane.classList.add('active');
        }

        // Adapter le titre du header
        const titleEl = document.getElementById('main-page-title');
        const subEl = document.getElementById('main-page-subtitle');
        const TITLES = {
          'tab-home':     { t: 'Bienvenue sur WikiLogix', s: 'Votre assistant intelligent pour WikiMasters' },
          'tab-overview': { t: 'Centre de Contrôle WikiLogix', s: 'Supervision des tirages, analyse financière & configuration miroir' },
          'tab-charts':   { t: 'Analyses Graphiques', s: 'Visualisation avancée de vos données de farm' },
          'tab-cards':    { t: 'Historique des Cartes', s: 'Gérez et suivez l\'intégralité de votre collection' },
          'tab-config':   { t: 'Miroir Bot & Discord', s: 'Configuration des notifications et filtres de routage' },
          'tab-bridge':   { t: 'Liaison Extension', s: 'Connexion directe au Service Worker de l\'extension' },
          'tab-guide':    { t: 'Guide & Documentation', s: 'Tout ce qu\'il faut savoir pour utiliser WikiLogix' }
        };
        if (TITLES[targetTabId]) {
          if (titleEl) titleEl.textContent = TITLES[targetTabId].t;
          if (subEl) subEl.textContent = TITLES[targetTabId].s;
        }

        setTimeout(() => {
          if (state.charts.gains) state.charts.gains.render(1);
          if (state.charts.donut) state.charts.donut.render(1);
          if (state.charts.priceTiers) state.charts.priceTiers.render(1);
        }, 60);
      });
    });
  }

  // ==========================================================================
  // 7. TABLEAU DES CARTES, RECHERCHE, FILTRES & PAGINATION
  // ==========================================================================

  function initTableControls() {
    const searchInput = document.getElementById('table-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.trim().toLowerCase();
        state.currentPage = 1;
        renderCardsTable();
      });
    }

    // Filtres par rareté
    const rarityChips = document.querySelectorAll('.filter-chip-rarity, .filter-chip[data-rarity]');
    rarityChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        rarityChips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        state.selectedRarity = chip.getAttribute('data-rarity') || 'ALL';
        state.currentPage = 1;
        renderCardsTable();
      });
    });

    // Filtres par statut (Tous, Vendu, Échangé, Disponible)
    const statusChips = document.querySelectorAll('.filter-chip-status, .filter-chip[data-status]');
    statusChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        statusChips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        state.selectedStatus = chip.getAttribute('data-status') || 'ALL';
        state.currentPage = 1;
        renderCardsTable();
      });
    });

    const perPageSelect = document.getElementById('items-per-page-select');
    if (perPageSelect) {
      perPageSelect.addEventListener('change', (e) => {
        state.itemsPerPage = parseInt(e.target.value, 10) || 10;
        state.currentPage = 1;
        renderCardsTable();
      });
    }

    const sortHeaders = document.querySelectorAll('th.sortable');
    sortHeaders.forEach((th) => {
      th.addEventListener('click', () => {
        const col = th.getAttribute('data-sort');
        if (state.sortColumn === col) {
          state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          state.sortColumn = col;
          state.sortDirection = 'desc';
        }
        renderCardsTable();
      });
    });
  }

  function getFilteredAndSortedCards() {
    let list = [...state.cards];

    if (state.searchQuery) {
      list = list.filter((c) =>
        c.name.toLowerCase().includes(state.searchQuery) ||
        (c.description && c.description.toLowerCase().includes(state.searchQuery))
      );
    }

    if (state.selectedRarity !== 'ALL') {
      list = list.filter((c) => c.rarity === state.selectedRarity);
    }

    if (state.selectedStatus === 'sold') {
      list = list.filter((c) => c.status === 'sold');
    } else if (state.selectedStatus === 'traded') {
      list = list.filter((c) => c.status === 'traded');
    } else if (state.selectedStatus === 'available') {
      list = list.filter((c) => !c.status);
    }

    list.sort((a, b) => {
      let valA = a[state.sortColumn];
      let valB = b[state.sortColumn];

      if (state.sortColumn === 'price') {
        valA = Number(a.avgPrice || 0);
        valB = Number(b.avgPrice || 0);
      } else if (state.sortColumn === 'name') {
        valA = (a.name || '').toLowerCase();
        valB = (b.name || '').toLowerCase();
      } else if (state.sortColumn === 'timestamp') {
        valA = Number(a.timestamp || 0);
        valB = Number(b.timestamp || 0);
      }

      if (valA < valB) return state.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return state.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }

  function renderCardsTable() {
    const tbody = document.getElementById('cards-table-body');
    if (!tbody) return;

    const filtered = getFilteredAndSortedCards();
    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / state.itemsPerPage));

    if (state.currentPage > totalPages) {
      state.currentPage = totalPages;
    }

    const startIdx = (state.currentPage - 1) * state.itemsPerPage;
    const pageItems = filtered.slice(startIdx, startIdx + state.itemsPerPage);

    tbody.innerHTML = '';

    if (pageItems.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 36px; color: var(--text-muted);">
            Aucune carte ne correspond aux critères de recherche.
          </td>
        </tr>
      `;
      updatePaginationUI(0, 0, 0, 1);
      return;
    }

    pageItems.forEach((card) => {
      const meta = OFFICIAL_RARITIES[card.rarity] || OFFICIAL_RARITIES.C;
      const avgPrice = Number(card.avgPrice || card.suggestedPrice || 0);
      const minSell = card.sellPriceMin || Math.round(avgPrice * 0.50);
      const maxSell = card.sellPriceMax || Math.round(avgPrice * 0.75);
      const timeStr = card.timestamp
        ? new Date(card.timestamp).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
        : '--';

      const tr = document.createElement('tr');
      if (card.status === 'sold' || card.status === 'traded') {
        tr.style.opacity = '0.7';
      }

      const statusBadge = card.status === 'sold'
        ? '<span class="card-status-badge sold tag-sold">🏷️ Vendu</span>'
        : card.status === 'traded'
          ? '<span class="card-status-badge traded tag-traded">🔄 Échangé</span>'
          : '';

      const rawImgUrl = card.imageUrl || card.image || card.img || '';
      const isFakeThumb = !rawImgUrl || (
        rawImgUrl.includes('favicon') ||
        rawImgUrl.includes('/icon/') ||
        rawImgUrl.endsWith('/icon.png') ||
        (rawImgUrl.endsWith('.png') && (
          rawImgUrl.includes('commun') ||
          rawImgUrl.includes('rare') ||
          rawImgUrl.includes('legendaire') ||
          rawImgUrl.includes('avatar')
        ))
      );

      const thumbHtml = !isFakeThumb
        ? `<img src="${rawImgUrl}" alt="" class="table-card-thumb" onerror="this.style.display='none'">`
        : `<span class="gem-dot" style="background: ${meta.color}; box-shadow: 0 0 8px ${meta.glowColor};"></span>`;

      tr.innerHTML = `
        <td>
          <div class="table-card-title">
            ${thumbHtml}
            <div class="table-card-name-group">
              <strong>${card.name}</strong>${statusBadge}
            </div>
          </div>
        </td>
        <td>
          <span class="rarity-badge" style="background: ${meta.bgColor}; color: ${meta.color}; border: 1px solid ${meta.borderColor};">
            ${meta.shortCode} • ${meta.label}
          </span>
        </td>
        <td>
          <span class="coin-value">${avgPrice.toLocaleString('fr-FR')} 🪙</span>
        </td>
        <td>
          <span class="resale-range">${minSell.toLocaleString('fr-FR')} - ${maxSell.toLocaleString('fr-FR')} 🪙</span>
        </td>
        <td>
          <span style="font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--text-secondary);">
            Carte ${card.cardIndex || 1}/${card.totalInBooster || 5}
          </span>
        </td>
        <td style="font-size: 12px; color: var(--text-muted);">
          ${timeStr}
        </td>
        <td>
          <button class="btn btn-secondary btn-sm" title="Voir les détails complets">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
            Détails
          </button>
        </td>
      `;

      tr.addEventListener('click', () => openCardDetailModal(card));
      tbody.appendChild(tr);
    });

    updatePaginationUI(startIdx + 1, Math.min(startIdx + state.itemsPerPage, totalItems), totalItems, totalPages);
  }

  function updatePaginationUI(start, end, total, totalPages) {
    const infoEl = document.getElementById('pagination-info-text');
    const controlsEl = document.getElementById('pagination-buttons-container');

    if (infoEl) {
      infoEl.textContent = total > 0 ? 'Affichage ' + start + ' à ' + end + ' sur ' + total + ' cartes' : '0 cartes';
    }

    if (!controlsEl) return;
    controlsEl.innerHTML = '';

    if (totalPages <= 1) return;

    // Bouton Précédent
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.disabled = state.currentPage === 1;
    prevBtn.innerHTML = '&lsaquo;';
    prevBtn.title = 'Page précédente';
    prevBtn.addEventListener('click', () => {
      if (state.currentPage > 1) {
        state.currentPage--;
        renderCardsTable();
      }
    });
    controlsEl.appendChild(prevBtn);

    // Numéros de page
    const maxVisiblePages = 5;
    let startPage = Math.max(1, state.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      const p1 = createPageBtn(1);
      controlsEl.appendChild(p1);
      if (startPage > 2) {
        const dots = document.createElement('span');
        dots.style.color = 'var(--text-muted)';
        dots.textContent = '...';
        controlsEl.appendChild(dots);
      }
    }

    for (let p = startPage; p <= endPage; p++) {
      controlsEl.appendChild(createPageBtn(p));
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        const dots = document.createElement('span');
        dots.style.color = 'var(--text-muted)';
        dots.textContent = '...';
        controlsEl.appendChild(dots);
      }
      controlsEl.appendChild(createPageBtn(totalPages));
    }

    // Bouton Suivant
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.disabled = state.currentPage === totalPages;
    nextBtn.innerHTML = '&rsaquo;';
    nextBtn.title = 'Page suivante';
    nextBtn.addEventListener('click', () => {
      if (state.currentPage < totalPages) {
        state.currentPage++;
        renderCardsTable();
      }
    });
    controlsEl.appendChild(nextBtn);
  }

  function createPageBtn(pageNum) {
    const btn = document.createElement('button');
    btn.className = 'pagination-btn' + (pageNum === state.currentPage ? ' active' : '');
    btn.textContent = pageNum;
    btn.addEventListener('click', () => {
      state.currentPage = pageNum;
      renderCardsTable();
    });
    return btn;
  }

  // ==========================================================================
  // 8. MODALE DÉTAIL CARTE
  // ==========================================================================

  // Références globales pour la modale
  let _currentModalCard = null;

  function openCardDetailModal(card) {
    const modal = document.getElementById('card-detail-modal');
    if (!modal) return;

    _currentModalCard = card;

    const meta = OFFICIAL_RARITIES[card.rarity] || OFFICIAL_RARITIES.C;
    const avgPrice = Number(card.avgPrice || card.suggestedPrice || 0);
    const minPrice = Number(card.minPrice || Math.round(avgPrice * 0.85));
    const maxPrice = Number(card.maxPrice || Math.round(avgPrice * 1.2));
    const minSell = card.sellPriceMin || Math.round(avgPrice * 0.50);
    const maxSell = card.sellPriceMax || Math.round(avgPrice * 0.75);

    document.getElementById('modal-card-name').textContent = card.name;
    document.getElementById('modal-card-desc').textContent = card.description || 'Aucune description encyclopédique disponible pour cette carte.';

    const badgeEl = document.getElementById('modal-card-badge');
    badgeEl.textContent = meta.shortCode + ' • ' + meta.label;
    badgeEl.style.background = meta.bgColor;
    badgeEl.style.color = meta.color;
    badgeEl.style.borderColor = meta.borderColor;

    const holoBox = document.getElementById('modal-hologram-box');
    holoBox.style.background = 'radial-gradient(circle at center, ' + meta.color + '22 0%, #0b0f19 80%)';
    holoBox.style.borderColor = meta.borderColor;
    holoBox.style.boxShadow = '0 0 25px ' + meta.glowColor;

    // --- IMAGE DE LA CARTE ---
    const imgEl = document.getElementById('modal-card-img');
    const placeholderEl = document.getElementById('modal-card-placeholder');
    const imageUrl = card.imageUrl || card.image || card.img || null;
    const isWikimastersDefault = imageUrl && (
      imageUrl.includes('favicon') ||
      imageUrl.includes('/icon/') ||
      imageUrl.endsWith('/icon.png') ||
      (imageUrl.endsWith('.png') && (
        imageUrl.includes('commun') ||
        imageUrl.includes('rare') ||
        imageUrl.includes('legendaire') ||
        imageUrl.includes('avatar')
      ))
    );

    if (imgEl && placeholderEl) {
      if (imageUrl && !isWikimastersDefault) {
        imgEl.src = imageUrl;
        imgEl.alt = card.name;
        imgEl.style.display = 'block';
        placeholderEl.style.display = 'none';
        imgEl.onerror = function() {
          imgEl.style.display = 'none';
          placeholderEl.style.display = 'flex';
        };
      } else {
        imgEl.style.display = 'none';
        placeholderEl.style.display = 'flex';
      }
    }

    // --- LIEN WIKIPEDIA ---
    const wikiLinkEl = document.getElementById('modal-wiki-link');
    if (wikiLinkEl) {
      const wikiUrl = card.wikiUrl ||
        'https://fr.wikipedia.org/wiki/' + encodeURIComponent((card.name || '').replace(/ /g, '_'));
      wikiLinkEl.href = wikiUrl;
      wikiLinkEl.style.display = 'inline-flex';
    }

    document.getElementById('modal-val-avg').textContent = avgPrice.toLocaleString('fr-FR') + ' 🪙';
    document.getElementById('modal-val-resale').textContent = minSell.toLocaleString('fr-FR') + ' - ' + maxSell.toLocaleString('fr-FR') + ' 🪙';
    document.getElementById('modal-val-market-range').textContent = minPrice.toLocaleString('fr-FR') + ' - ' + maxPrice.toLocaleString('fr-FR') + ' 🪙';
    document.getElementById('modal-val-combat').textContent = (card.attack || card.defense) ? ('⚔️ ' + (card.attack || 0) + ' / 🛡️ ' + (card.defense || 0)) : 'Non spécifié';
    document.getElementById('modal-val-booster-idx').textContent = 'Carte #' + (card.cardIndex || 1) + ' sur ' + (card.totalInBooster || 5);
    document.getElementById('modal-val-timestamp').textContent = card.timestamp ? new Date(card.timestamp).toLocaleString('fr-FR') : '--';

    // --- BOUTONS D'ACTIONS : état selon le statut actuel ---
    const btnSold = document.getElementById('modal-btn-sold');
    const btnTraded = document.getElementById('modal-btn-traded');
    if (btnSold) {
      btnSold.classList.toggle('active', card.status === 'sold');
      btnSold.textContent = '';
      btnSold.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z"/></svg> ${card.status === 'sold' ? '✓ Vendu' : '🏷️ Vendu'}`;
    }
    if (btnTraded) {
      btnTraded.classList.toggle('active', card.status === 'traded');
      btnTraded.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7.99 4.7L4 8.5l3.99 3.8V9.5H15v-2H7.99V4.7zm8.02 9.1v2.8H9v2H16.01V21l3.99-3.8-3.99-3.8v2.7z"/></svg> ${card.status === 'traded' ? '✓ Échangé' : '🔄 Échangé'}`;
    }

    modal.classList.add('active');
  }

  function closeCardDetailModal() {
    const modal = document.getElementById('card-detail-modal');
    if (modal) modal.classList.remove('active');
    _currentModalCard = null;
  }

  function markCardStatus(cardId, status) {
    const card = state.cards.find((c) => c.id === cardId);
    if (!card) return;

    // Toggle : si le statut est déjà appliqué, on l'enlève
    if (card.status === status) {
      card.status = null;
      showToast('Tag retiré.', 'info');
    } else {
      card.status = status;
      const label = status === 'sold' ? 'Carte marquée comme Vendue' : 'Carte marquée comme Échangée';
      showToast(label + ' 🏷️', 'success');
    }

    persistData();
    renderCardsTable();
    // Ré-ouvrir la modale avec les nouvelles données
    openCardDetailModal(card);
  }

  function deleteCard(cardId) {
    const card = state.cards.find((c) => c.id === cardId);
    if (!card) return;

    if (!confirm('Supprimer définitivement la carte "' + card.name + '" du cache ?')) return;

    state.cards = state.cards.filter((c) => c.id !== cardId);
    persistData();
    updateDashboardData();
    closeCardDetailModal();
    showToast('Carte "' + card.name + '" supprimée.', 'info');
  }

  // ==========================================================================
  // 9. LIAISON DIRECTE EXTENSION CHROME (externally_connectable)
  // ==========================================================================

  let lastSyncedDataSignature = null;

  function computeDataSignature(cards, boosters, discordConfig, marketPrices) {
    const cardsLen = Array.isArray(cards) ? cards.length : 0;
    const totalPrice = Array.isArray(cards) ? cards.reduce((acc, c) => acc + (Number(c.avgPrice) || 0), 0) : 0;
    const lastCard = Array.isArray(cards) && cards.length > 0 ? cards[cards.length - 1] : null;
    const lastCardId = lastCard ? (lastCard.id || `${lastCard.name}_${lastCard.timestamp}`) : '';
    const boostersLen = Array.isArray(boosters) ? boosters.length : 0;
    const configStr = discordConfig ? JSON.stringify(discordConfig) : '';
    const marketLen = marketPrices ? Object.keys(marketPrices).length : 0;
    return `${cardsLen}_${totalPrice}_${lastCardId}_${boostersLen}_${marketLen}_${configStr}`;
  }

  function syncWithExtension(isManual = false) {
    const extId = state.extensionId.trim();

    if (!extId) {
      if (isManual) {
        showToast("Veuillez d'abord renseigner l'ID de l'extension Chrome.", 'danger');
      }
      setConnectionStatus('disconnected');
      return;
    }

    if (isManual) {
      setConnectionStatus('syncing');
      logBridgeMessage("Tentative de liaison avec l'extension (ID: " + extId + ")...", 'info');
    }

    if (typeof window.chrome === 'undefined' || !window.chrome.runtime || !window.chrome.runtime.sendMessage) {
      if (isManual) {
        logBridgeMessage("L'API 'chrome.runtime.sendMessage' n'est accessible que dans un environnement Chrome avec 'externally_connectable'.", 'warn');
        showToast("Note : Exécutez le dashboard via localhost pour la liaison directe Chrome.", 'danger');
      }
      setConnectionStatus('disconnected');
      return;
    }

    try {
      window.chrome.runtime.sendMessage(
        extId,
        { action: 'getWikiMastersData', type: 'FETCH_STATS' },
        (response) => {
          if (window.chrome.runtime.lastError) {
            const err = window.chrome.runtime.lastError.message;
            if (isManual) {
              logBridgeMessage('Échec de liaison : ' + err, 'error');
              showToast("Erreur d'extension : " + err, 'danger');
            }
            setConnectionStatus('disconnected');
            return;
          }

          if (response && response.success) {
            handleSuccessfulSync(response.data || response, isManual);
          } else {
            if (isManual) {
              logBridgeMessage('Réponse négative reçue de l\'extension : ' + (response?.error || 'Inconnue'), 'warn');
            }
            setConnectionStatus('disconnected');
          }
        }
      );
    } catch (err) {
      if (isManual) {
        logBridgeMessage('Exception : ' + err.message, 'error');
      }
      setConnectionStatus('disconnected');
    }
  }

  function handleSuccessfulSync(data, isManual = false) {
    setConnectionStatus('connected');

    const incomingCards = Array.isArray(data.cards) ? data.cards : state.cards;
    const incomingBoosters = Array.isArray(data.boosters) ? data.boosters : state.boosters;
    const incomingConfig = data.discordConfig || state.discordConfig || null;
    const incomingMarketPrices = data.marketPrices || state.marketPrices || null;
    const signature = computeDataSignature(incomingCards, incomingBoosters, incomingConfig, incomingMarketPrices);

    // Si aucune donnée n'a changé, ne recalcule rien et ne spamme pas !
    if (signature === lastSyncedDataSignature) {
      if (isManual) {
        showToast('Données déjà à jour (aucun nouveau tirage)', 'info');
        logBridgeMessage('Synchronisation manuelle : Données déjà à jour.', 'info');
      }
      return;
    }

    // Des changements ont été détectés
    const previousCardsCount = state.cards.length;
    lastSyncedDataSignature = signature;

    let hasCardsChanged = false;
    let hasConfigChanged = false;

    if (Array.isArray(data.cards)) {
      if (data.cards.length !== state.cards.length || JSON.stringify(data.cards) !== JSON.stringify(state.cards)) {
        state.cards = data.cards;
        hasCardsChanged = true;
      }
    }
    if (Array.isArray(data.boosters)) {
      state.boosters = data.boosters;
    }
    if (data.marketPrices) {
      state.marketPrices = data.marketPrices;
    }

    if (data.discordConfig) {
      const oldCfgStr = JSON.stringify(state.discordConfig);
      const newCfg = { ...state.discordConfig, ...data.discordConfig };
      if (Array.isArray(data.discordConfig.rules)) {
        newCfg.rules = data.discordConfig.rules;
      }
      const newCfgStr = JSON.stringify(newCfg);
      if (oldCfgStr !== newCfgStr) {
        state.discordConfig = newCfg;
        hasConfigChanged = true;
        const isUserTyping = document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA');
        if (!isUserTyping) {
          populateDiscordConfigForm();
        }
      }
    }

    // Mise à jour des calculs et graphiques uniquement lors d'un changement réel
    if (hasCardsChanged || isManual) {
      updateDashboardData();
      const newCount = state.cards.length - previousCardsCount;
      if (newCount > 0) {
        logBridgeMessage(`Synchronisation : +${newCount} nouvelle(s) carte(s) reçue(s).`, 'success');
        if (isManual) showToast(`Synchronisation : +${newCount} nouvelle(s) carte(s) !`, 'success');
      } else {
        if (isManual) showToast('Données synchronisées avec succès !', 'success');
        logBridgeMessage('Données synchronisées avec l\'extension.', 'success');
      }
    } else if (hasConfigChanged) {
      persistData();
      logBridgeMessage('Configuration Discord mise à jour depuis l\'extension.', 'info');
    }
  }

  function setConnectionStatus(status) {
    state.connectionStatus = status;
    const badgeDot = document.getElementById('header-status-dot');
    const badgeText = document.getElementById('header-status-text');
    const sidebarDot = document.getElementById('sidebar-status-dot');
    const sidebarText = document.getElementById('sidebar-status-text');

    const config = {
      connected: { class: 'connected', text: 'Extension Connectée' },
      simulation: { class: 'simulation', text: 'Mode Démo / Simulation' },
      syncing: { class: 'simulation', text: 'Synchronisation...' },
      disconnected: { class: 'disconnected', text: 'Extension Déconnectée' }
    };

    const current = config[status] || config.disconnected;

    [badgeDot, sidebarDot].forEach((dot) => {
      if (dot) dot.className = 'status-dot ' + current.class;
    });

    [badgeText, sidebarText].forEach((txt) => {
      if (txt) txt.textContent = current.text;
    });
  }

  function logBridgeMessage(msg, type = 'info') {
    const box = document.getElementById('bridge-log-console');
    if (!box) return;

    const time = new Date().toLocaleTimeString('fr-FR');
    const div = document.createElement('div');
    div.className = 'log-entry ' + type;
    div.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-msg">${msg}</span>`;

    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }

  // ==========================================================================
  // 10. CRÉATEUR DE FILTRES PERSONNALISÉS DYNAMIQUES & DISCORD ROUTING
  // ==========================================================================

  let discordSaveDebounceTimeout = null;

  function debouncedSaveAndSyncDiscordConfig(showNotification = false, delayMs = 500) {
    if (discordSaveDebounceTimeout) {
      clearTimeout(discordSaveDebounceTimeout);
    }
    discordSaveDebounceTimeout = setTimeout(() => {
      saveAndSyncDiscordConfig(showNotification);
    }, delayMs);
  }

  function saveAndSyncDiscordConfig(showNotification = true) {
    persistData();
    if (showNotification) {
      showToast('Configuration enregistrée !', 'success');
      logBridgeMessage('Paramètres Discord & Filtres sauvegardés en local.', 'success');
    }

    if (state.extensionId && window.chrome?.runtime?.sendMessage) {
      try {
        window.chrome.runtime.sendMessage(
          state.extensionId,
          { action: 'saveWikiMastersConfig', config: state.discordConfig },
          (resp) => {
            if (!window.chrome.runtime.lastError && resp?.success) {
              logBridgeMessage('Configuration synchronisée avec le Service Worker !', 'success');
            }
          }
        );
      } catch (err) {
        console.warn('[WikiMasters Dashboard] Erreur sync sendMessage :', err);
      }
    }
  }

  const RARITY_DEFINITIONS = [
    { code: 'L', label: '[L] Légendaire' },
    { code: 'UR', label: '[UR] Ultra Rare' },
    { code: 'SR', label: '[SR] Super Rare' },
    { code: 'R', label: '[R] Rare' },
    { code: 'PC', label: '[PC] Peu Commune' },
    { code: 'C', label: '[C] Commune' }
  ];

  function renderDiscordRules() {
    const container = document.getElementById('discord-rules-list');
    const countBadge = document.getElementById('discord-rules-count');
    if (!container) return;

    const rules = state.discordConfig.rules || [];
    if (countBadge) {
      countBadge.textContent = `${rules.length} règle${rules.length > 1 ? 's' : ''}`;
    }

    container.innerHTML = '';

    if (rules.length === 0) {
      container.innerHTML = `
        <div class="rule-empty-state">
          <span style="font-weight: 600; color: #ffffff;">Aucun filtre configuré.</span>
          <span>Cliquez sur <strong>+ Ajouter un Filtre</strong> pour créer une règle avec routage par fil Discord spécifique.</span>
        </div>
      `;
      return;
    }

    rules.forEach((rule, index) => {
      const card = document.createElement('div');
      card.className = `discord-rule-card ${rule.enabled === false ? 'rule-disabled' : ''}`;
      card.setAttribute('data-rule-id', rule.id);

      const raritiesHtml = RARITY_DEFINITIONS.map(r => {
        const isChecked = rule.rarities ? Boolean(rule.rarities[r.code]) : true;
        return `
          <label class="rarity-filter-chip chip-${r.code.toLowerCase()} ${isChecked ? 'active' : ''}" title="${r.label}">
            <input type="checkbox" class="rule-rarity-checkbox" data-rule-id="${rule.id}" data-rarity="${r.code}" ${isChecked ? 'checked' : ''}>
            <span class="chip-dot"></span>
            <span class="chip-label">${r.label}</span>
          </label>
        `;
      }).join('');

      card.innerHTML = `
        <div class="rule-header-actions">
          <input type="text" class="rule-name-input form-input" data-rule-id="${rule.id}" value="${rule.name || `Filtre #${index + 1}`}" placeholder="Nom du filtre / fil">
          <div class="rule-actions-group">
            <label class="switch" title="Activer ou désactiver ce filtre" style="transform: scale(0.85); margin-right: 2px;">
              <input type="checkbox" class="rule-enable-toggle" data-rule-id="${rule.id}" ${rule.enabled !== false ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
            <button type="button" class="btn-test-rule" data-rule-id="${rule.id}" title="Tester ce fil">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              <span>Tester</span>
            </button>
            <button type="button" class="btn-delete-rule" data-rule-id="${rule.id}" title="Supprimer ce filtre">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>

        <div class="rule-thread-row">
          <label>ID du Fil Discord (Thread ID)</label>
          <input type="text" class="form-input rule-thread-input" data-rule-id="${rule.id}" value="${rule.threadId || ''}" placeholder="Ex: 119482938491823901 (Optionnel si salon principal)">
        </div>

        <div class="filter-section">
          <div class="filter-section-header">
            <span class="filter-section-title">Raretés ciblées</span>
          </div>
          <div class="rarity-filter-grid">
            ${raritiesHtml}
          </div>
        </div>

        <div class="filter-section">
          <div class="filter-section-header">
            <span class="filter-section-title">Fourchette de Prix Réel (🪙)</span>
            <span class="filter-section-sub">Laissez Max vide pour l'infini (∞)</span>
          </div>
          <div class="price-range-inputs">
            <div class="input-with-currency">
              <input type="number" class="form-input rule-min-price-input" data-rule-id="${rule.id}" min="0" step="10" value="${rule.minPrice > 0 ? rule.minPrice : ''}" placeholder="Min (0)">
              <span class="currency-addon">🪙</span>
            </div>
            <span class="price-range-separator">à</span>
            <div class="input-with-currency">
              <input type="number" class="form-input rule-max-price-input" data-rule-id="${rule.id}" min="0" step="10" value="${(rule.maxPrice !== null && rule.maxPrice !== undefined && rule.maxPrice !== '') ? rule.maxPrice : ''}" placeholder="Max (∞)">
              <span class="currency-addon">🪙</span>
            </div>
          </div>
        </div>
      `;

      container.appendChild(card);
    });
  }

  function initDiscordRulesHandlers() {
    const btnAddRule = document.getElementById('btn-add-discord-rule');
    const container = document.getElementById('discord-rules-list');

    if (btnAddRule) {
      btnAddRule.addEventListener('click', () => {
        const nextIndex = (state.discordConfig.rules || []).length + 1;
        const newRule = {
          id: `rule_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: `Filtre #${nextIndex}`,
          enabled: true,
          threadId: '',
          customWebhookUrl: '',
          rarities: { L: true, UR: true, SR: false, R: false, PC: false, C: false },
          minPrice: 0,
          maxPrice: null,
          pingUserId: ''
        };
        if (!Array.isArray(state.discordConfig.rules)) state.discordConfig.rules = [];
        state.discordConfig.rules.push(newRule);
        renderDiscordRules();
        debouncedSaveAndSyncDiscordConfig(false, 200);
        showToast(`Filtre #${nextIndex} ajouté !`, 'success');
      });
    }

    if (container) {
      // Saisie texte sans recréer le DOM
      container.addEventListener('input', (e) => {
        const target = e.target;
        const ruleId = target.getAttribute('data-rule-id');
        if (!ruleId) return;

        const rule = (state.discordConfig.rules || []).find((r) => r.id === ruleId);
        if (!rule) return;

        if (target.classList.contains('rule-name-input')) {
          rule.name = target.value;
        } else if (target.classList.contains('rule-thread-input')) {
          rule.threadId = target.value.trim();
        } else if (target.classList.contains('rule-min-price-input')) {
          rule.minPrice = target.value ? Math.max(0, Number(target.value)) : 0;
        } else if (target.classList.contains('rule-max-price-input')) {
          rule.maxPrice = (target.value && target.value.trim() !== '') ? Math.max(0, Number(target.value)) : null;
        }

        debouncedSaveAndSyncDiscordConfig(false);
      });

      // Cases à cocher et switches
      container.addEventListener('change', (e) => {
        const target = e.target;
        const ruleId = target.getAttribute('data-rule-id');
        if (!ruleId) return;

        const rule = (state.discordConfig.rules || []).find((r) => r.id === ruleId);
        if (!rule) return;

        if (target.classList.contains('rule-enable-toggle')) {
          rule.enabled = target.checked;
          const card = container.querySelector(`.discord-rule-card[data-rule-id="${ruleId}"]`);
          if (card) {
            card.classList.toggle('rule-disabled', !rule.enabled);
          }
        } else if (target.classList.contains('rule-rarity-checkbox')) {
          const rarity = target.getAttribute('data-rarity');
          if (!rule.rarities) rule.rarities = {};
          rule.rarities[rarity] = target.checked;
          const chipLabel = target.closest('.rarity-filter-chip');
          if (chipLabel) {
            chipLabel.classList.toggle('active', target.checked);
          }
        }

        debouncedSaveAndSyncDiscordConfig(false, 300);
      });

      // Boutons Tester et Supprimer
      container.addEventListener('click', async (e) => {
        const btnDelete = e.target.closest('.btn-delete-rule');
        const btnTest = e.target.closest('.btn-test-rule');

        if (btnDelete) {
          const ruleId = btnDelete.getAttribute('data-rule-id');
          const rule = (state.discordConfig.rules || []).find((r) => r.id === ruleId);
          const confirmDelete = window.confirm(`Supprimer le filtre "${rule?.name || 'ce filtre'}" ?`);
          if (confirmDelete) {
            state.discordConfig.rules = state.discordConfig.rules.filter((r) => r.id !== ruleId);
            renderDiscordRules();
            saveAndSyncDiscordConfig(false);
            showToast('Filtre supprimé.', 'info');
          }
          return;
        }

        if (btnTest) {
          const ruleId = btnTest.getAttribute('data-rule-id');
          const rule = (state.discordConfig.rules || []).find((r) => r.id === ruleId);
          if (!rule) return;

          const webhookUrl = (rule.customWebhookUrl || state.discordConfig.webhookUrl || getInputValue('cfg-webhook-url') || '').trim();
          const pingUser = (rule.pingUserId || state.discordConfig.discordUserId || getInputValue('cfg-discord-user-id') || '').trim();

          if (!webhookUrl) {
            showToast('Veuillez renseigner une URL de Webhook Discord valide', 'danger');
            const mainInput = document.getElementById('cfg-webhook-url');
            if (mainInput) mainInput.focus();
            return;
          }

          const origHtml = btnTest.innerHTML;
          btnTest.disabled = true;
          btnTest.style.opacity = '0.7';
          btnTest.innerHTML = `<span>...</span>`;

          try {
            saveAndSyncDiscordConfig(false);

            let urlWithThread = webhookUrl;
            if (rule.threadId) {
              const delim = webhookUrl.includes('?') ? '&' : '?';
              urlWithThread = `${webhookUrl}${delim}thread_id=${rule.threadId.trim()}`;
            }

            const activeRarities = Object.keys(rule.rarities || {}).filter(k => rule.rarities[k]).join(', ') || 'Toutes';
            const priceDesc = rule.maxPrice ? `${rule.minPrice || 0} à ${rule.maxPrice} 🪙` : `≥ ${rule.minPrice || 0} 🪙`;

            const payload = {
              username: 'WikiMasters Alert Hub',
              avatar_url: 'https://i.imgur.com/MUpcyUn.jpeg',
              content: pingUser ? `<@${pingUser}>` : undefined,
              embeds: [
                {
                  title: `🎯 Test de Filtre : ${rule.name || 'Filtre Sur-Mesure'}`,
                  description: `Ce message confirme le bon routage vers ce fil Discord dédié avec vos critères de drop personnalisés.`,
                  color: 0x06b6d4,
                  fields: [
                    { name: 'Fil / Thread ID', value: rule.threadId ? `\`${rule.threadId}\`` : '*Salon Principal*', inline: true },
                    { name: 'Raretés Ciblées', value: activeRarities, inline: true },
                    { name: 'Fourchette Prix', value: priceDesc, inline: true },
                    { name: 'Statut Règle', value: rule.enabled !== false ? '✅ Active' : '⏸️ Désactivée', inline: true }
                  ],
                  footer: { 
                    text: 'WikiLogix Dynamic Rule Engine • Dashboard Pro',
                    icon_url: 'https://i.imgur.com/MUpcyUn.jpeg'
                  },
                  timestamp: new Date().toISOString()
                }
              ]
            };

            const response = await fetch(urlWithThread, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            if (response.ok) {
              showToast(`Test envoyé avec succès pour "${rule.name}" !`, 'success');
              logBridgeMessage(`Test Filtre "${rule.name}" : Succès (HTTP ${response.status})`, 'success');
            } else {
              showToast(`Échec du test (${rule.name}) : HTTP ${response.status}`, 'danger');
              logBridgeMessage(`Test Filtre "${rule.name}" : Échec HTTP ${response.status}`, 'error');
            }
          } catch (err) {
            showToast(`Erreur réseau : ${err.message}`, 'danger');
            logBridgeMessage(`Test Filtre Exception : ${err.message}`, 'error');
          } finally {
            btnTest.disabled = false;
            btnTest.style.opacity = '1';
            btnTest.innerHTML = origHtml;
          }
        }
      });
    }
  }

  function findMatchingRules(card, rules) {
    if (!Array.isArray(rules)) return [];
    const price = Number(card.avgPrice || card.suggestedPrice || 0);

    return rules.filter((rule) => {
      if (rule.enabled === false) return false;

      // Filtrage par rareté
      if (rule.rarities && typeof rule.rarities === 'object') {
        const isAllowed = Boolean(rule.rarities[card.rarity]);
        if (!isAllowed) return false;
      }

      // Filtrage par prix minimum
      if (typeof rule.minPrice === 'number' && rule.minPrice > 0) {
        if (price < rule.minPrice) return false;
      }

      // Filtrage par prix maximum
      if (typeof rule.maxPrice === 'number' && rule.maxPrice > 0) {
        if (price > rule.maxPrice) return false;
      }

      return true;
    });
  }

  // ==========================================================================
  // 11. FORMULAIRE CONFIGURATION DISCORD & MIROIR BOT
  // ==========================================================================

  function initDiscordConfigForm() {
    populateDiscordConfigForm();
    initDiscordRulesHandlers();
  }

  function populateDiscordConfigForm() {
    const cfg = state.discordConfig;

    setInputValue('cfg-discord-enabled', cfg.enabled, true);
    setInputValue('cfg-webhook-url', cfg.webhookUrl);
    setInputValue('cfg-discord-user-id', cfg.discordUserId);
    setInputValue('cfg-pause-thread-id', cfg.pauseThreadId);

    renderDiscordRules();
  }

  function readDiscordConfigForm() {
    return {
      enabled: getCheckboxValue('cfg-discord-enabled'),
      webhookUrl: getInputValue('cfg-webhook-url'),
      discordUserId: getInputValue('cfg-discord-user-id'),
      pauseThreadId: getInputValue('cfg-pause-thread-id'),
      rules: Array.isArray(state.discordConfig.rules) ? state.discordConfig.rules : [...DEFAULT_DISCORD_CONFIG.rules]
    };
  }

  function setInputValue(id, val, isCheckbox = false) {
    const el = document.getElementById(id);
    if (!el) return;
    if (isCheckbox) {
      el.checked = Boolean(val);
    } else {
      el.value = val !== undefined && val !== null ? val : '';
    }
  }

  function getInputValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function getCheckboxValue(id) {
    const el = document.getElementById(id);
    return el ? el.checked : false;
  }

  // ==========================================================================
  // 12. ÉCOUTEURS D'ÉVÉNEMENTS GLOBAUX
  // ==========================================================================

  function initEventListeners() {
    const btnSyncManual = document.getElementById('btn-sync-now');
    if (btnSyncManual) {
      btnSyncManual.addEventListener('click', () => syncWithExtension(true));
    }

    const autoSyncToggle = document.getElementById('toggle-auto-sync');
    if (autoSyncToggle) {
      autoSyncToggle.addEventListener('change', (e) => {
        state.isAutoSyncActive = e.target.checked;
        if (state.isAutoSyncActive) {
          logBridgeMessage('Synchronisation automatique activée (intervalle: 5s).', 'info');
          showToast('Synchronisation automatique activée', 'info');
          syncWithExtension(false);
          state.autoSyncInterval = setInterval(() => syncWithExtension(false), state.syncFrequencySec * 1000);
        } else {
          if (state.autoSyncInterval) clearInterval(state.autoSyncInterval);
          state.autoSyncInterval = null;
          logBridgeMessage('Synchronisation automatique désactivée.', 'warn');
          showToast('Synchronisation automatique désactivée', 'info');
        }
      });
    }

    const btnSaveExtId = document.getElementById('btn-save-extension-id');
    if (btnSaveExtId) {
      btnSaveExtId.addEventListener('click', () => {
        const input = document.getElementById('input-extension-id');
        if (input) {
          state.extensionId = input.value.trim();
          persistData();
          logBridgeMessage("ID de l'extension enregistré : " + state.extensionId, 'success');
          showToast('ID Extension sauvegardé !', 'success');
          syncWithExtension(true);
        }
      });
    }

    const btnSaveConfig = document.getElementById('btn-save-discord-config');
    if (btnSaveConfig) {
      btnSaveConfig.addEventListener('click', () => {
        state.discordConfig = readDiscordConfigForm();
        saveAndSyncDiscordConfig(true);
      });
    }

    const btnTestWebhook = document.getElementById('btn-test-discord-webhook');
    if (btnTestWebhook) {
      btnTestWebhook.addEventListener('click', async () => {
        const webhookUrl = getInputValue('cfg-webhook-url');
        if (!webhookUrl) {
          showToast('Veuillez renseigner une URL de Webhook Discord valide.', 'danger');
          return;
        }

        showToast('Envoi du message de test Discord...', 'info');

        const payload = {
          username: 'WikiMasters Alert',
          avatar_url: 'https://i.imgur.com/MUpcyUn.jpeg',
          embeds: [
            {
              title: '🔔 Test de Connexion WikiMasters Réussi !',
              description: 'Ce message confirme que votre Webhook Discord principal est parfaitement configuré avec le **Dashboard Web WikiMasters**.',
              color: 0x06b6d4,
              fields: [
                { name: 'Statut', value: '✅ Opérationnel', inline: true },
                { name: 'Filtres Personnalisés', value: `${(state.discordConfig.rules || []).length} règle(s) active(s)`, inline: true },
                { name: 'Conseils Revente', value: 'Calculés automatiquement à 50% - 75%', inline: false }
              ],
              footer: { 
                text: 'WikiLogix Dashboard Tracker',
                icon_url: 'https://i.imgur.com/MUpcyUn.jpeg'
              },
              timestamp: new Date().toISOString()
            }
          ]
        };

        try {
          const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            showToast('Embed de test envoyé sur Discord !', 'success');
            logBridgeMessage('Test Webhook Discord : Succès (HTTP ' + res.status + ')', 'success');
          } else {
            showToast('Erreur Discord : HTTP ' + res.status, 'danger');
            logBridgeMessage('Test Webhook Discord : Échec HTTP ' + res.status, 'error');
          }
        } catch (err) {
          showToast('Erreur réseau / CORS : ' + err.message, 'danger');
          logBridgeMessage('Test Webhook Discord : Exception (' + err.message + ')', 'error');
        }
      });
    }

    const btnExport = document.getElementById('btn-export-data');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        const dataStr = JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            app: 'WikiMasters Dashboard',
            cards: state.cards,
            discordConfig: state.discordConfig
          },
          null,
          2
        );

        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'wikimasters_export_' + Date.now() + '.json';
        a.click();
        URL.revokeObjectURL(url);
        showToast('Export JSON téléchargé avec succès !', 'success');
      });
    }

    const btnReset = document.getElementById('btn-reset-data');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (confirm('Êtes-vous sûr de vouloir réinitialiser toutes les statistiques et cartes du dashboard ?')) {
          state.cards = [];
          state.boosters = [];
          updateDashboardData();
          showToast('Historique des cartes réinitialisé.', 'info');
          logBridgeMessage('Toutes les cartes locales ont été purgées.', 'warn');
        }
      });
    }

    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalBackdrop = document.getElementById('card-detail-modal');
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeCardDetailModal);
    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) closeCardDetailModal();
      });
    }

    // Boutons d'actions de la modale
    const btnSold = document.getElementById('modal-btn-sold');
    if (btnSold) {
      btnSold.addEventListener('click', () => {
        if (_currentModalCard) markCardStatus(_currentModalCard.id, 'sold');
      });
    }

    const btnTraded = document.getElementById('modal-btn-traded');
    if (btnTraded) {
      btnTraded.addEventListener('click', () => {
        if (_currentModalCard) markCardStatus(_currentModalCard.id, 'traded');
      });
    }

    const btnDelete = document.getElementById('modal-btn-delete');
    if (btnDelete) {
      btnDelete.addEventListener('click', () => {
        if (_currentModalCard) deleteCard(_currentModalCard.id);
      });
    }
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // ==========================================================================
  // 13. DÉMARRAGE AUTOMATIQUE AU CHARGEMENT DU DOM
  // ==========================================================================

  function initApp() {
    loadSavedState();
    initNavigationTabs();

    state.charts.gains = new CumulativeGainsChart('canvas-gains-evolution', 'tooltip-gains-chart');
    state.charts.donut = new RarityDonutChart(
      'canvas-rarity-donut',
      'donut-rarity-legend',
      'donut-center-count',
      'donut-center-label'
    );
    state.charts.priceTiers = new PriceTierBarChart('canvas-price-tiers');

    initEventListeners();
    initTableControls();
    initDiscordConfigForm();

    updateDashboardData();
    logBridgeMessage('Dashboard WikiMasters initialisé avec succès.', 'info');

    if (state.extensionId) {
      syncWithExtension(false);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
