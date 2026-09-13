/**
 * WikiMasters Web Dashboard - Contrôleur Principal Autonome & Moteur Graphique
 * Thème : Deep Cyber & Gemstones
 * 100% Fonctionnel - Zéro dépendance externe - Compatible file:// et http://
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
      glowColor: 'rgba(255, 225, 68, 0.45)'
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
      glowColor: 'rgba(250, 153, 49, 0.45)'
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
      glowColor: 'rgba(237, 111, 163, 0.45)'
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
      glowColor: 'rgba(198, 167, 242, 0.45)'
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
      glowColor: 'rgba(177, 207, 242, 0.45)'
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
      glowColor: 'rgba(184, 242, 213, 0.45)'
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
      lastPrice: 135,
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
      name: 'Colisée',
      rarity: 'PC',
      rarityLabel: 'Peu Commune',
      rarityShortCode: 'PC',
      rarityColor: '#b1cff2',
      cardIndex: 1,
      totalInBooster: 5,
      description: 'Amphithéâtre flavien situé au centre de Rome, chef-d\'œuvre monumental de l\'ingénierie impériale romaine.',
      attack: 48,
      defense: 72,
      avgPrice: 45,
      minPrice: 35,
      maxPrice: 60,
      lastPrice: 40,
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
      name: 'Jeanne d\'Arc',
      rarity: 'SR',
      rarityLabel: 'Super Rare',
      rarityShortCode: 'SR',
      rarityColor: '#ed6fa3',
      cardIndex: 5,
      totalInBooster: 5,
      description: 'Héroïne de l\'histoire de France, cheffe de guerre et sainte patronne ayant mené les troupes royales durant la guerre de Cent Ans.',
      attack: 86,
      defense: 80,
      avgPrice: 560,
      minPrice: 490,
      maxPrice: 680,
      lastPrice: 570,
      sellPriceMin: 280,
      sellPriceMax: 420,
      sellPriceMid: 350,
      salesCount: 38,
      hasRealMarketPrice: true,
      timestamp: Date.now() - 1000 * 60 * 95
    },
    {
      id: 'card_demo_12',
      boosterId: 'booster_demo_03',
      sessionId: 'session_demo_03',
      name: 'Mona Lisa',
      rarity: 'UR',
      rarityLabel: 'Ultra Rare',
      rarityShortCode: 'UR',
      rarityColor: '#fa9931',
      cardIndex: 4,
      totalInBooster: 5,
      description: 'Portrait de Lisa Gherardini peint par Léonard de Vinci, œuvre d\'art la plus célèbre, la plus visitée et la plus parodiée au monde.',
      attack: 60,
      defense: 94,
      avgPrice: 1250,
      minPrice: 1050,
      maxPrice: 1500,
      lastPrice: 1300,
      sellPriceMin: 625,
      sellPriceMax: 938,
      sellPriceMid: 781,
      salesCount: 16,
      hasRealMarketPrice: true,
      timestamp: Date.now() - 1000 * 60 * 94
    },
    {
      id: 'card_demo_13',
      boosterId: 'booster_demo_03',
      sessionId: 'session_demo_03',
      name: 'Victor Hugo',
      rarity: 'R',
      rarityLabel: 'Rare',
      rarityShortCode: 'R',
      rarityColor: '#c6a7f2',
      cardIndex: 3,
      totalInBooster: 5,
      description: 'Poète, dramaturge, écrivain et romancier du romantisme français, auteur des Misérables et de Notre-Dame de Paris.',
      attack: 70,
      defense: 75,
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
      name: 'Galilée',
      rarity: 'PC',
      rarityLabel: 'Peu Commune',
      rarityShortCode: 'PC',
      rarityColor: '#b1cff2',
      cardIndex: 3,
      totalInBooster: 5,
      description: 'Astronome et physicien toscan, pionnier de la méthode scientifique moderne et défenseur de l\'héliocentrisme.',
      attack: 52,
      defense: 65,
      avgPrice: 50,
      minPrice: 40,
      maxPrice: 65,
      lastPrice: 48,
      sellPriceMin: 25,
      sellPriceMax: 38,
      sellPriceMid: 31,
      salesCount: 95,
      hasRealMarketPrice: true,
      timestamp: Date.now() - 1000 * 60 * 48
    },
    {
      id: 'card_demo_19',
      boosterId: 'booster_demo_04',
      sessionId: 'session_demo_04',
      name: 'Château de Versailles',
      rarity: 'C',
      rarityLabel: 'Commune',
      rarityShortCode: 'C',
      rarityColor: '#b8f2d5',
      cardIndex: 2,
      totalInBooster: 5,
      description: 'Monument historique somptueux, résidence officielle des rois de France Louis XIV, Louis XV et Louis XVI.',
      attack: 38,
      defense: 60,
      avgPrice: 18,
      minPrice: 12,
      maxPrice: 25,
      lastPrice: 16,
      sellPriceMin: 9,
      sellPriceMax: 14,
      sellPriceMid: 11,
      salesCount: 220,
      hasRealMarketPrice: true,
      timestamp: Date.now() - 1000 * 60 * 47
    },
    {
      id: 'card_demo_20',
      boosterId: 'booster_demo_04',
      sessionId: 'session_demo_04',
      name: 'Volcan Vésuve',
      rarity: 'C',
      rarityLabel: 'Commune',
      rarityShortCode: 'C',
      rarityColor: '#b8f2d5',
      cardIndex: 1,
      totalInBooster: 5,
      description: 'Sommet volcanique bordant la baie de Naples, tristement célèbre pour son éruption dévastatrice ayant enseveli Pompéi en 79.',
      attack: 45,
      defense: 40,
      avgPrice: 14,
      minPrice: 10,
      maxPrice: 20,
      lastPrice: 15,
      sellPriceMin: 7,
      sellPriceMax: 11,
      sellPriceMid: 9,
      salesCount: 260,
      hasRealMarketPrice: true,
      timestamp: Date.now() - 1000 * 60 * 46
    },
    {
      id: 'card_demo_21',
      boosterId: 'booster_demo_05',
      sessionId: 'session_demo_05',
      name: 'Trou Noir Gargantua',
      rarity: 'L',
      rarityLabel: 'Légendaire',
      rarityShortCode: 'L',
      rarityColor: '#ffe144',
      cardIndex: 5,
      totalInBooster: 5,
      description: 'Objet céleste d\'une densité infinie dont le champ de gravitation empêche toute matière ou rayonnement électromagnétique de s\'échapper.',
      attack: 99,
      defense: 98,
      avgPrice: 4200,
      minPrice: 3900,
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
    targetCardsList: ['Adèle Castillon', 'Trou Noir Gargantua', 'Léonard de Vinci'],
    rarityRoutingEnabled: true,
    priceRoutingEnabled: true,
    rarityThreads: {
      L: '',
      UR: '',
      SR: '',
      R: '',
      PC: '',
      C: ''
    },
    priceThreads: {
      tier1000: '',
      tier250: '',
      tier100: '',
      tier50: '',
      tier0: ''
    },
    minClickDelay: 1500,
    maxClickDelay: 2200,
    minBoosterWaitSec: 2.0,
    maxBoosterWaitSec: 4.0,
    humanCyclesEnabled: true,
    minActiveMin: 35,
    maxActiveMin: 50,
    minBreakMin: 10,
    maxBreakMin: 25
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
            <span>Valeur Carte :</span>
            <strong>+${pt.cardPrice.toLocaleString('fr-FR')} 🪙</strong>
          </div>
          <div class="tooltip-row highlight">
            <span>Cumul Total :</span>
            <strong>${pt.cumulativeValue.toLocaleString('fr-FR')} 🪙</strong>
          </div>
          <div class="tooltip-row footer">
            <span>Tirage #${pt.index}</span>
            <span class="time">${dateStr}</span>
          </div>
        </div>
      `;

      this.tooltip.style.opacity = '1';
      const tooltipWidth = this.tooltip.offsetWidth || 190;
      let leftPos = posX;
      if (leftPos + tooltipWidth > rect.width - 20) {
        leftPos = posX - tooltipWidth - 10;
      } else {
        leftPos = posX + 15;
      }
      this.tooltip.style.left = leftPos + 'px';
      this.tooltip.style.top = '30px';
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
        ctx.font = '14px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Aucune donnée de tirage disponible', width / 2, height / 2);
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
    isSimulationMode: false,
    simulationInterval: null,
    connectionStatus: 'disconnected',

    cards: [],
    boosters: [],
    marketPrices: {},
    discordConfig: { ...DEFAULT_DISCORD_CONFIG },

    searchQuery: '',
    selectedRarity: 'ALL',
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
        state.discordConfig = { ...DEFAULT_DISCORD_CONFIG, ...JSON.parse(savedConfig) };
      } catch (_) {
        state.discordConfig = { ...DEFAULT_DISCORD_CONFIG };
      }
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

    const chips = document.querySelectorAll('.filter-chip');
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        chips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        state.selectedRarity = chip.getAttribute('data-rarity') || 'ALL';
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
      tr.innerHTML = `
        <td>
          <div class="table-card-title">
            <span class="gem-dot" style="background: ${meta.color}; box-shadow: 0 0 8px ${meta.glowColor};"></span>
            <strong>${card.name}</strong>
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

    if (controlsEl) {
      controlsEl.innerHTML = '';

      const prevBtn = document.createElement('button');
      prevBtn.className = 'page-btn';
      prevBtn.innerHTML = '‹';
      prevBtn.disabled = state.currentPage <= 1;
      prevBtn.addEventListener('click', () => {
        if (state.currentPage > 1) {
          state.currentPage--;
          renderCardsTable();
        }
      });
      controlsEl.appendChild(prevBtn);

      for (let p = 1; p <= totalPages; p++) {
        if (p === 1 || p === totalPages || (p >= state.currentPage - 1 && p <= state.currentPage + 1)) {
          const pageBtn = document.createElement('button');
          pageBtn.className = 'page-btn' + (p === state.currentPage ? ' active' : '');
          pageBtn.textContent = String(p);
          pageBtn.addEventListener('click', () => {
            state.currentPage = p;
            renderCardsTable();
          });
          controlsEl.appendChild(pageBtn);
        } else if (p === state.currentPage - 2 || p === state.currentPage + 2) {
          const dots = document.createElement('span');
          dots.style.padding = '0 4px';
          dots.style.color = '#64748b';
          dots.textContent = '...';
          controlsEl.appendChild(dots);
        }
      }

      const nextBtn = document.createElement('button');
      nextBtn.className = 'page-btn';
      nextBtn.innerHTML = '›';
      nextBtn.disabled = state.currentPage >= totalPages;
      nextBtn.addEventListener('click', () => {
        if (state.currentPage < totalPages) {
          state.currentPage++;
          renderCardsTable();
        }
      });
      controlsEl.appendChild(nextBtn);
    }
  }

  // ==========================================================================
  // 8. MODALE DÉTAIL CARTE
  // ==========================================================================

  function openCardDetailModal(card) {
    const modal = document.getElementById('card-detail-modal');
    if (!modal) return;

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

    document.getElementById('modal-val-avg').textContent = avgPrice.toLocaleString('fr-FR') + ' 🪙';
    document.getElementById('modal-val-resale').textContent = minSell.toLocaleString('fr-FR') + ' - ' + maxSell.toLocaleString('fr-FR') + ' 🪙';
    document.getElementById('modal-val-market-range').textContent = minPrice.toLocaleString('fr-FR') + ' - ' + maxPrice.toLocaleString('fr-FR') + ' 🪙';
    document.getElementById('modal-val-combat').textContent = (card.attack || card.defense) ? ('⚔️ ' + (card.attack || 0) + ' / 🛡️ ' + (card.defense || 0)) : 'Non spécifié';
    document.getElementById('modal-val-booster-idx').textContent = 'Carte #' + (card.cardIndex || 1) + ' sur ' + (card.totalInBooster || 5);
    document.getElementById('modal-val-timestamp').textContent = card.timestamp ? new Date(card.timestamp).toLocaleString('fr-FR') : '--';

    modal.classList.add('active');
  }

  function closeCardDetailModal() {
    const modal = document.getElementById('card-detail-modal');
    if (modal) modal.classList.remove('active');
  }

  // ==========================================================================
  // 9. LIAISON DIRECTE EXTENSION CHROME (externally_connectable)
  // ==========================================================================

  function syncWithExtension() {
    const extId = state.extensionId.trim();

    if (!extId) {
      showToast("Veuillez d'abord renseigner l'ID de l'extension Chrome.", 'danger');
      setConnectionStatus('disconnected');
      return;
    }

    setConnectionStatus('syncing');
    logBridgeMessage("Tentative de liaison avec l'extension (ID: " + extId + ")...", 'info');

    if (typeof window.chrome === 'undefined' || !window.chrome.runtime || !window.chrome.runtime.sendMessage) {
      logBridgeMessage("L'API 'chrome.runtime.sendMessage' n'est accessible que dans un environnement Chrome avec 'externally_connectable'.", 'warn');
      setConnectionStatus('disconnected');
      showToast("Note : Exécutez le dashboard via localhost pour la liaison directe Chrome.", 'danger');
      return;
    }

    try {
      window.chrome.runtime.sendMessage(
        extId,
        { action: 'getWikiMastersData', type: 'FETCH_STATS' },
        (response) => {
          if (window.chrome.runtime.lastError) {
            const err = window.chrome.runtime.lastError.message;
            logBridgeMessage('Échec de liaison : ' + err, 'error');
            setConnectionStatus('disconnected');
            showToast("Erreur d'extension : " + err, 'danger');
            return;
          }

          if (response && response.success) {
            handleSuccessfulSync(response.data || response);
          } else {
            logBridgeMessage('Réponse négative reçue de l\'extension : ' + (response?.error || 'Inconnue'), 'warn');
            setConnectionStatus('disconnected');
          }
        }
      );
    } catch (err) {
      logBridgeMessage('Exception : ' + err.message, 'error');
      setConnectionStatus('disconnected');
    }
  }

  function handleSuccessfulSync(data) {
    setConnectionStatus('connected');
    logBridgeMessage('Synchronisation réussie ! Données en direct reçues.', 'success');
    showToast('Données synchronisées avec l\'extension !', 'success');

    if (Array.isArray(data.cards) && data.cards.length > 0) {
      state.cards = data.cards;
    }
    if (Array.isArray(data.boosters)) {
      state.boosters = data.boosters;
    }
    if (data.marketPrices) {
      state.marketPrices = data.marketPrices;
    }
    if (data.discordConfig) {
      state.discordConfig = { ...state.discordConfig, ...data.discordConfig };
      populateDiscordConfigForm();
    }

    updateDashboardData();
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
  // 10. SIMULATION EN DIRECT (FONCTIONNEMENT AUTONOME IMMÉDIAT)
  // ==========================================================================

  function toggleSimulationMode(enable) {
    state.isSimulationMode = enable;

    if (enable) {
      setConnectionStatus('simulation');
      logBridgeMessage('Démarrage du flux de simulation en temps réel...', 'info');
      showToast('Simulation en direct activée : tirages générés en temps réel.', 'info');

      let simCardCounter = state.cards.length + 1;
      state.simulationInterval = setInterval(() => {
        const newCard = generateRandomSimulationCard(simCardCounter++);
        state.cards.push(newCard);
        updateDashboardData();
        logBridgeMessage(`Tirage simulé : [${newCard.rarity}] ${newCard.name} (+${newCard.avgPrice} 🪙)`, 'success');

        if (newCard.rarity === 'L' || newCard.rarity === 'UR') {
          showToast(`🌟 Drop Majeur ! [${newCard.rarity}] ${newCard.name} (${newCard.avgPrice} 🪙)`, 'success');
        }
      }, 3500);
    } else {
      if (state.simulationInterval) clearInterval(state.simulationInterval);
      state.simulationInterval = null;
      setConnectionStatus('disconnected');
      logBridgeMessage('Flux de simulation arrêté.', 'warn');
      showToast('Simulation en direct désactivée.', 'info');
    }
  }

  // ==========================================================================
  // 11. CONFIGURATION DISCORD & MIROIR BOT
  // ==========================================================================

  function initDiscordConfigForm() {
    populateDiscordConfigForm();

    const rarityRoutingToggle = document.getElementById('cfg-rarity-routing-toggle');
    const rarityThreadsGroup = document.getElementById('cfg-rarity-threads-group');
    if (rarityRoutingToggle && rarityThreadsGroup) {
      rarityRoutingToggle.addEventListener('change', (e) => {
        rarityThreadsGroup.style.display = e.target.checked ? 'flex' : 'none';
      });
    }

    const priceRoutingToggle = document.getElementById('cfg-price-routing-toggle');
    const priceThreadsGroup = document.getElementById('cfg-price-threads-group');
    if (priceRoutingToggle && priceThreadsGroup) {
      priceRoutingToggle.addEventListener('change', (e) => {
        priceThreadsGroup.style.display = e.target.checked ? 'flex' : 'none';
      });
    }

    const humanCyclesToggle = document.getElementById('cfg-human-cycles-toggle');
    const humanCyclesSettings = document.getElementById('cfg-human-cycles-settings');
    if (humanCyclesToggle && humanCyclesSettings) {
      humanCyclesToggle.addEventListener('change', (e) => {
        humanCyclesSettings.style.opacity = e.target.checked ? '1' : '0.4';
        humanCyclesSettings.style.pointerEvents = e.target.checked ? 'auto' : 'none';
      });
    }
  }

  function populateDiscordConfigForm() {
    const cfg = state.discordConfig;

    setInputValue('cfg-discord-enabled', cfg.enabled, true);
    setInputValue('cfg-webhook-url', cfg.webhookUrl);
    setInputValue('cfg-discord-user-id', cfg.discordUserId);
    setInputValue('cfg-pause-thread-id', cfg.pauseThreadId);
    setInputValue('cfg-target-cards', Array.isArray(cfg.targetCardsList) ? cfg.targetCardsList.join(', ') : '');

    setInputValue('cfg-rarity-routing-toggle', cfg.rarityRoutingEnabled, true);
    if (cfg.rarityThreads) {
      setInputValue('cfg-thread-l', cfg.rarityThreads.L);
      setInputValue('cfg-thread-ur', cfg.rarityThreads.UR);
      setInputValue('cfg-thread-sr', cfg.rarityThreads.SR);
      setInputValue('cfg-thread-r', cfg.rarityThreads.R);
      setInputValue('cfg-thread-pc', cfg.rarityThreads.PC);
      setInputValue('cfg-thread-c', cfg.rarityThreads.C);
    }

    setInputValue('cfg-price-routing-toggle', cfg.priceRoutingEnabled, true);
    if (cfg.priceThreads) {
      setInputValue('cfg-thread-tier1000', cfg.priceThreads.tier1000);
      setInputValue('cfg-thread-tier250', cfg.priceThreads.tier250);
      setInputValue('cfg-thread-tier100', cfg.priceThreads.tier100);
      setInputValue('cfg-thread-tier50', cfg.priceThreads.tier50);
      setInputValue('cfg-thread-tier0', cfg.priceThreads.tier0);
    }

    setInputValue('cfg-min-click-delay', cfg.minClickDelay || 1500);
    setInputValue('cfg-max-click-delay', cfg.maxClickDelay || 2200);
    setInputValue('cfg-min-booster-wait', cfg.minBoosterWaitSec || 2.0);
    setInputValue('cfg-max-booster-wait', cfg.maxBoosterWaitSec || 4.0);

    setInputValue('cfg-human-cycles-toggle', cfg.humanCyclesEnabled, true);
    setInputValue('cfg-min-active-min', cfg.minActiveMin || 35);
    setInputValue('cfg-max-active-min', cfg.maxActiveMin || 50);
    setInputValue('cfg-min-break-min', cfg.minBreakMin || 10);
    setInputValue('cfg-max-break-min', cfg.maxBreakMin || 25);
  }

  function readDiscordConfigForm() {
    const targetCardsRaw = getInputValue('cfg-target-cards') || '';
    const targetCardsList = targetCardsRaw.split(',').map((s) => s.trim()).filter(Boolean);

    return {
      enabled: getCheckboxValue('cfg-discord-enabled'),
      webhookUrl: getInputValue('cfg-webhook-url'),
      discordUserId: getInputValue('cfg-discord-user-id'),
      pauseThreadId: getInputValue('cfg-pause-thread-id'),
      targetCardsList: targetCardsList,
      rarityRoutingEnabled: getCheckboxValue('cfg-rarity-routing-toggle'),
      priceRoutingEnabled: getCheckboxValue('cfg-price-routing-toggle'),
      rarityThreads: {
        L: getInputValue('cfg-thread-l'),
        UR: getInputValue('cfg-thread-ur'),
        SR: getInputValue('cfg-thread-sr'),
        R: getInputValue('cfg-thread-r'),
        PC: getInputValue('cfg-thread-pc'),
        C: getInputValue('cfg-thread-c')
      },
      priceThreads: {
        tier1000: getInputValue('cfg-thread-tier1000'),
        tier250: getInputValue('cfg-thread-tier250'),
        tier100: getInputValue('cfg-thread-tier100'),
        tier50: getInputValue('cfg-thread-tier50'),
        tier0: getInputValue('cfg-thread-tier0')
      },
      minClickDelay: parseInt(getInputValue('cfg-min-click-delay'), 10) || 1500,
      maxClickDelay: parseInt(getInputValue('cfg-max-click-delay'), 10) || 2200,
      minBoosterWaitSec: parseFloat(getInputValue('cfg-min-booster-wait')) || 2.0,
      maxBoosterWaitSec: parseFloat(getInputValue('cfg-max-booster-wait')) || 4.0,
      humanCyclesEnabled: getCheckboxValue('cfg-human-cycles-toggle'),
      minActiveMin: parseInt(getInputValue('cfg-min-active-min'), 10) || 35,
      maxActiveMin: parseInt(getInputValue('cfg-max-active-min'), 10) || 50,
      minBreakMin: parseInt(getInputValue('cfg-min-break-min'), 10) || 10,
      maxBreakMin: parseInt(getInputValue('cfg-max-break-min'), 10) || 25
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
      btnSyncManual.addEventListener('click', () => syncWithExtension());
    }

    const autoSyncToggle = document.getElementById('toggle-auto-sync');
    if (autoSyncToggle) {
      autoSyncToggle.addEventListener('change', (e) => {
        state.isAutoSyncActive = e.target.checked;
        if (state.isAutoSyncActive) {
          logBridgeMessage('Synchronisation automatique activée (intervalle: 5s).', 'info');
          showToast('Synchronisation automatique activée', 'info');
          syncWithExtension();
          state.autoSyncInterval = setInterval(syncWithExtension, state.syncFrequencySec * 1000);
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
          syncWithExtension();
        }
      });
    }

    const btnToggleSim = document.getElementById('btn-toggle-simulation');
    if (btnToggleSim) {
      btnToggleSim.addEventListener('click', () => {
        toggleSimulationMode(!state.isSimulationMode);
        btnToggleSim.textContent = state.isSimulationMode ? 'Arrêter la Simulation' : 'Lancer Simulation Directe';
        btnToggleSim.className = state.isSimulationMode ? 'btn btn-danger btn-sm' : 'btn btn-secondary btn-sm';
      });
    }

    const btnSaveConfig = document.getElementById('btn-save-discord-config');
    if (btnSaveConfig) {
      btnSaveConfig.addEventListener('click', () => {
        state.discordConfig = readDiscordConfigForm();
        persistData();
        showToast('Configuration enregistrée avec succès !', 'success');
        logBridgeMessage('Paramètres Discord & Bot sauvegardés en local.', 'success');

        if (state.extensionId && window.chrome?.runtime?.sendMessage) {
          window.chrome.runtime.sendMessage(
            state.extensionId,
            { action: 'saveWikiMastersConfig', config: state.discordConfig },
            (resp) => {
              if (!window.chrome.runtime.lastError && resp?.success) {
                logBridgeMessage('Configuration synchronisée avec le Service Worker !', 'success');
              }
            }
          );
        }
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
              description: 'Ce message confirme que votre Webhook Discord est parfaitement configuré avec le **Dashboard Web WikiMasters**.',
              color: 0x06b6d4,
              fields: [
                { name: 'Statut', value: '✅ Opérationnel', inline: true },
                { name: 'Mode', value: '🌐 Dashboard Web', inline: true },
                { name: 'Conseils Revente', value: 'Calculés automatiquement à 50% - 75%', inline: false }
              ],
              footer: { text: 'WikiMasters Dashboard Tracker' },
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
      syncWithExtension();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
