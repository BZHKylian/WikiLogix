/**
 * WikiLogix - Module de Stockage & Moteur Économique Wiki-Masters (v1.4.8)
 * - Filtrage strict des cartes : élimination totale des badges de rareté (C, PC, R, SR, UR, L) et termes d'interface
 * - Prix réels extraits directement depuis Wiki-Masters (si aucun prix ou aucune vente, valeur = 0 🪙)
 * - Calcul automatique de la revente conseillée (50% à 75% du prix moyen réel)
 * - Calcul automatique de la moyenne par booster
 * - File d'attente atomique (Mutex) pour sécuriser chrome.storage.local
 */

export const STORAGE_KEYS = {
  CARDS: 'wikilogix_cards_history',
  BOOSTERS: 'wikilogix_boosters_history',
  ACTIVE_SESSION: 'wikilogix_active_booster_session',
  MARKET_PRICES: 'wikilogix_market_prices_cache',
  CONFIG: 'wikilogix_settings',
  DISCORD_CONFIG: 'wikilogix_discord_config'
};

// Liste noire des correspondances exactes de termes d'interface et codes de rareté
const BOGUS_EXACT_NAMES = new Set([
  'c', 'pc', 'r', 'sr', 'ur', 'l', 'uc', 'cr',
  'c.', 'pc.', 'r.', 'sr.', 'ur.', 'l.',
  'ouvrir', 'ouvrir un paquet', 'paquet', 'booster', 'tirage', 'tirages',
  'étiquette', 'etiquette', 'étiquettes', 'etiquettes', 'tag', 'tags', 'ajouter une étiquette', 'ajouter une étiquette…',
  'marché', 'marche', 'market', 'cours', 'prix', 'prix moyen', 'conseil revente',
  'détail', 'details', 'détails', 'vue de la carte', 'vue',
  'évolution', 'evolution', 'évolution des prix', 'evolution des prix',
  'dernière vente', 'dernières ventes', 'dernieres ventes', '10 dernières ventes', 'ventes', 'sales',
  'enchère', 'enchères', 'encheres', 'mettre aux enchères', 'mettre aux encheres',
  'défausser', 'defausser',
  'q-score', 'qscore', 'exemplaire', 'exemplaires', 'vue (30j)', 'vues (30j)', 'vues',
  'voir l\'article sur wikipédia', 'wikipédia', 'wikipedia', 'wiki-masters', 'wikimasters',
  'connexion', 'inscription', 'compte', 'mot de passe', 'se connecter', 'profil', 'déconnexion', 'paramètre', 'paramètres',
  'statistique', 'statistiques', 'carte', 'cartes', 'favoris', 'ajouter aux favoris', 'fermer', 'close',
  'commun', 'commune', 'peu commune', 'rare', 'super rare', 'ultra rare', 'légendaire', 'legendaire',
  'atk', 'def', 'attaque', 'défense', 'defense',
  'moyenne', 'dernier', 'min', 'max', 'total',
  'cc by-sa 4.0', 'texte de l\'article', 'crédits sur la page wikipédia'
]);

/**
 * Valide qu'un nom correspond bien à une vraie carte et non à un tag/badge/bouton d'interface
 */
export function isValidCardName(name) {
  if (!name || typeof name !== 'string') return false;
  const clean = name.trim().toLowerCase().replace(/\s+/g, ' ');
  if (clean.length < 2 || clean.length > 90) return false;

  // 1. Rejet strict des codes et labels de rareté isolés
  const RARITY_CODES = new Set(['c', 'pc', 'r', 'sr', 'ur', 'l', 'uc', 'cr']);
  if (RARITY_CODES.has(clean)) return false;

  // 2. Rejet des termes d'interface exacts
  if (BOGUS_EXACT_NAMES.has(clean)) return false;

  // 3. Rejet des préfixes d'interface évidents
  if (
    clean.startsWith('ajouter une étiquette') ||
    clean.startsWith('voir l\'article') ||
    clean.startsWith('texte de l\'article') ||
    clean.startsWith('q-score :') ||
    clean.startsWith('exemplaires :') ||
    clean.startsWith('vues (30j) :') ||
    clean.startsWith('10 dernières ventes') ||
    clean.startsWith('évolution des prix') ||
    clean.startsWith('mettre aux enchères') ||
    (clean.startsWith('carte ') && /carte\s*\d+\s*\/\s*\d+/i.test(clean))
  ) {
    return false;
  }

  // 4. Rejet des simples chiffres, statistiques ou ratios
  if (/^[\d\s.,/–—+:-]+$/.test(clean)) return false;

  return true;
}

// Couleurs officielles Wiki-Masters
const RARITY_BASE = {
  L: {
    id: 'L',
    key: 'LEGENDARY',
    label: 'Légendaire',
    shortCode: 'L',
    color: '#ffe144',
    textColor: '#0d1117',
    bgColor: 'rgba(255, 225, 68, 0.18)',
    borderColor: '#ffe144'
  },
  UR: {
    id: 'UR',
    key: 'ULTRA_RARE',
    label: 'Ultra Rare',
    shortCode: 'UR',
    color: '#fa9931',
    textColor: '#ffffff',
    bgColor: 'rgba(250, 153, 49, 0.18)',
    borderColor: '#fa9931'
  },
  SR: {
    id: 'SR',
    key: 'SUPER_RARE',
    label: 'Super Rare',
    shortCode: 'SR',
    color: '#ed6fa3',
    textColor: '#ffffff',
    bgColor: 'rgba(237, 111, 163, 0.18)',
    borderColor: '#ed6fa3'
  },
  R: {
    id: 'R',
    key: 'RARE',
    label: 'Rare',
    shortCode: 'R',
    color: '#c6a7f2',
    textColor: '#0d1117',
    bgColor: 'rgba(198, 167, 242, 0.18)',
    borderColor: '#c6a7f2'
  },
  PC: {
    id: 'PC',
    key: 'UNCOMMON',
    label: 'Peu Commune',
    shortCode: 'PC',
    color: '#b1cff2',
    textColor: '#0d1117',
    bgColor: 'rgba(177, 207, 242, 0.18)',
    borderColor: '#b1cff2'
  },
  C: {
    id: 'C',
    key: 'COMMON',
    label: 'Commune',
    shortCode: 'C',
    color: '#b8f2d5',
    textColor: '#0d1117',
    bgColor: 'rgba(184, 242, 213, 0.18)',
    borderColor: '#b8f2d5'
  }
};

export const RARITY_CONFIG = {
  ...RARITY_BASE,
  LEGENDARY: RARITY_BASE.L,
  ULTRA_RARE: RARITY_BASE.UR,
  SUPER_RARE: RARITY_BASE.SR,
  RARE: RARITY_BASE.R,
  UNCOMMON: RARITY_BASE.PC,
  UC: RARITY_BASE.PC,
  COMMON: RARITY_BASE.C
};

// File d'attente d'écriture atomique (Mutex)
let storageQueue = Promise.resolve();

function enqueueStorageTask(taskFn) {
  const result = storageQueue.then(() => taskFn());
  storageQueue = result.catch(() => {});
  return result;
}

/**
 * Normalise toute chaîne en code de rareté canonique ('L', 'UR', 'SR', 'R', 'PC', 'C')
 */
export function normalizeRarity(rawRarity) {
  if (!rawRarity || typeof rawRarity !== 'string') return 'C';
  const s = rawRarity.trim().toLowerCase();

  if (s === 'l' || s === 'legendary' || s.includes('leg') || s.includes('lég')) return 'L';
  if (s === 'ur' || s === 'ultra_rare' || s === 'ultrarare' || s.includes('ultra')) return 'UR';
  if (s === 'sr' || s === 'super_rare' || s === 'superrare' || s.includes('super')) return 'SR';
  if (s === 'r' || s === 'rare') return 'R';
  if (s === 'pc' || s === 'uc' || s === 'uncommon' || s.includes('peu')) return 'PC';
  if (s === 'c' || s === 'common' || s.includes('com')) return 'C';

  return 'C';
}

/**
 * Calcule le prix réel et la fourchette de revente (50% à 75%).
 * Si aucun prix réel de marché n'est disponible, retourne 0.
 */
export function calculateCardPricing(rarityCode, attack = null, defense = null, customMarketPrice = null) {
  const norm = normalizeRarity(rarityCode);

  const avgPrice = (customMarketPrice !== null && customMarketPrice !== undefined && Number(customMarketPrice) > 0)
    ? Number(customMarketPrice)
    : 0;

  const sellPriceMin = Math.round(avgPrice * 0.50);
  const sellPriceMax = Math.round(avgPrice * 0.75);
  const sellPriceMid = Math.round(avgPrice * 0.625);

  return {
    rarity: norm,
    avgPrice,
    sellPriceMin,
    sellPriceMax,
    sellPriceMid,
    hasRealMarketPrice: avgPrice > 0
  };
}

/**
 * Récupère des données depuis chrome.storage.local
 */
export async function getStorageData(keys) {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(keys, (result) => {
        resolve(result || {});
      });
    } else {
      const result = {};
      const keyList = Array.isArray(keys) ? keys : [keys];
      keyList.forEach((k) => {
        try {
          const val = localStorage.getItem(k);
          if (val) result[k] = JSON.parse(val);
        } catch {
          // Ignorer
        }
      });
      resolve(result);
    }
  });
}

/**
 * Écrit des données dans chrome.storage.local
 */
export async function setStorageData(data) {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set(data, () => {
        resolve();
      });
    } else {
      Object.entries(data).forEach(([key, value]) => {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch {
          // Ignorer
        }
      });
      resolve();
    }
  });
}

/**
 * Met à jour le prix réel du marché Wiki-Masters pour toutes les cartes correspondantes
 */
export async function updateCardMarketPrice(cardName, rarity, marketData) {
  if (!isValidCardName(cardName)) return { updatedCount: 0 };

  return enqueueStorageTask(async () => {
    const rawPrice = typeof marketData === 'object' ? (marketData.avgPrice || marketData.price || marketData.marketPrice || marketData.lastPrice) : Number(marketData);
    const priceVal = (typeof rawPrice === 'number' && !isNaN(rawPrice) && rawPrice > 0) ? rawPrice : 0;

    const cleanName = cardName.trim();
    const normRarity = normalizeRarity(rarity);
    const data = await getStorageData([STORAGE_KEYS.CARDS, STORAGE_KEYS.BOOSTERS, STORAGE_KEYS.MARKET_PRICES]);

    let cards = (data[STORAGE_KEYS.CARDS] || []).filter((c) => isValidCardName(c.name));
    let boosters = data[STORAGE_KEYS.BOOSTERS] || [];
    const marketCache = data[STORAGE_KEYS.MARKET_PRICES] || {};

    const pricing = calculateCardPricing(normRarity, null, null, priceVal);

    const marketInfo = {
      cardName: cleanName,
      rarity: normRarity,
      price: priceVal,
      avgPrice: priceVal,
      marketPrice: priceVal,
      minPrice: (typeof marketData === 'object' && marketData.minPrice !== undefined) ? marketData.minPrice : (priceVal > 0 ? priceVal : 0),
      maxPrice: (typeof marketData === 'object' && marketData.maxPrice !== undefined) ? marketData.maxPrice : (priceVal > 0 ? priceVal : 0),
      lastPrice: (typeof marketData === 'object' && marketData.lastPrice !== undefined) ? marketData.lastPrice : (priceVal > 0 ? priceVal : 0),
      salesCount: (typeof marketData === 'object' && marketData.salesCount !== undefined) ? marketData.salesCount : (priceVal > 0 ? 1 : 0),
      sellMin: pricing.sellPriceMin,
      sellMax: pricing.sellPriceMax,
      hasRealMarketPrice: priceVal > 0,
      updatedAt: Date.now()
    };

    marketCache[cleanName.toLowerCase()] = marketInfo;
    marketCache[`${cleanName.toLowerCase()}__${normRarity}`] = marketInfo;

    let updatedCount = 0;

    // Mise à jour rétroactive de toutes les cartes existantes
    cards.forEach((c) => {
      if (c.name && c.name.trim().toLowerCase() === cleanName.toLowerCase()) {
        c.avgPrice = priceVal;
        c.sellPriceMin = pricing.sellPriceMin;
        c.sellPriceMax = pricing.sellPriceMax;
        c.sellPriceMid = pricing.sellPriceMid;
        c.minPrice = marketInfo.minPrice;
        c.maxPrice = marketInfo.maxPrice;
        c.lastPrice = marketInfo.lastPrice;
        c.salesCount = marketInfo.salesCount;
        c.hasRealMarketPrice = priceVal > 0;
        updatedCount++;
      }
    });

    // Mise à jour des cartes dans les boosters
    boosters.forEach((b) => {
      if (Array.isArray(b.cards)) {
        b.cards = b.cards.filter((c) => isValidCardName(c.name));
        b.cards.forEach((c) => {
          if (c.name && c.name.trim().toLowerCase() === cleanName.toLowerCase()) {
            c.avgPrice = priceVal;
            c.sellPriceMin = pricing.sellPriceMin;
            c.sellPriceMax = pricing.sellPriceMax;
            c.sellPriceMid = pricing.sellPriceMid;
            c.minPrice = marketInfo.minPrice;
            c.maxPrice = marketInfo.maxPrice;
            c.lastPrice = marketInfo.lastPrice;
            c.salesCount = marketInfo.salesCount;
            c.hasRealMarketPrice = priceVal > 0;
          }
        });
      }
    });

    await setStorageData({
      [STORAGE_KEYS.CARDS]: cards,
      [STORAGE_KEYS.BOOSTERS]: boosters,
      [STORAGE_KEYS.MARKET_PRICES]: marketCache
    });

    console.log(`[WikiLogix Storage] ⚡ Prix Marché Wiki-Masters synchronisé : ${cleanName} = ${priceVal} 🪙 (${updatedCount} cartes mises à jour)`);

    return {
      updatedCount,
      ...marketInfo
    };
  });
}

/**
 * Enregistre une carte collectée avec gestion de session de booster
 */
export async function recordCardInSession(cardData, metadata = {}) {
  if (!cardData || !isValidCardName(cardData.name)) {
    return { saved: false, isNewCard: false };
  }

  return enqueueStorageTask(async () => {
    const now = Date.now();
    const cleanName = cardData.name.trim();
    const normRarity = normalizeRarity(cardData.rarity);

    const data = await getStorageData([
      STORAGE_KEYS.BOOSTERS,
      STORAGE_KEYS.CARDS,
      STORAGE_KEYS.ACTIVE_SESSION,
      STORAGE_KEYS.MARKET_PRICES
    ]);

    let boosters = data[STORAGE_KEYS.BOOSTERS] || [];
    let cards = (data[STORAGE_KEYS.CARDS] || []).filter((c) => isValidCardName(c.name));
    const marketCache = data[STORAGE_KEYS.MARKET_PRICES] || {};
    let activeSession = data[STORAGE_KEYS.ACTIVE_SESSION] || null;

    // Récupération prix réel du marché
    const cachedMarket = marketCache[cleanName.toLowerCase()] || marketCache[`${cleanName.toLowerCase()}__${normRarity}`];
    let knownMarketPrice = 0;
    if (cachedMarket) {
      knownMarketPrice = cachedMarket.avgPrice || cachedMarket.price || cachedMarket.marketPrice || 0;
    }
    if (!knownMarketPrice && Number(cardData.avgPrice) > 0) {
      knownMarketPrice = Number(cardData.avgPrice);
    }

    const hasRealMarketPrice = Number(knownMarketPrice) > 0;
    const pricing = calculateCardPricing(normRarity, cardData.attack, cardData.defense, knownMarketPrice);

    const cardIndex = parseInt(cardData.cardIndex, 10) || 1;
    const totalInBooster = parseInt(cardData.totalInBooster, 10) || 5;
    const sessionId = cardData.sessionId || `session_${now}`;

    // Gestion de session
    let shouldCreateNewBooster = false;
    if (!activeSession) {
      shouldCreateNewBooster = true;
    } else if (sessionId && activeSession.sessionId && sessionId !== activeSession.sessionId) {
      shouldCreateNewBooster = true;
    } else if (activeSession.cards && activeSession.cards.length >= totalInBooster && cardIndex === 1) {
      shouldCreateNewBooster = true;
    }

    let isNewBooster = false;
    if (shouldCreateNewBooster) {
      isNewBooster = true;
      const newBoosterId = `booster_${now}_${Math.random().toString(36).substr(2, 6)}`;
      activeSession = {
        id: newBoosterId,
        sessionId: sessionId,
        timestamp: now,
        totalExpected: totalInBooster,
        cards: [],
        sourceUrl: metadata.url || 'https://www.wiki-masters.com/pulls'
      };
      boosters.push(activeSession);
    }

    // Assainir les cartes de la session active
    if (activeSession.cards) {
      activeSession.cards = activeSession.cards.filter((c) => isValidCardName(c.name));
    }

    // Anti-doublon dans le booster actif
    const alreadyInBooster = activeSession.cards.some((c) => {
      return (
        c.cardIndex === cardIndex &&
        c.name.trim().toLowerCase() === cleanName.toLowerCase() &&
        c.rarity === normRarity
      );
    });

    if (alreadyInBooster) {
      return {
        saved: true,
        isNewCard: false,
        isNewBooster: false,
        booster: activeSession,
        totalBoosters: Math.max(boosters.length, Math.ceil(cards.length / 5)),
        totalCards: cards.length
      };
    }

    const rarityMeta = RARITY_CONFIG[normRarity] || RARITY_CONFIG.C;

    const cardRecord = {
      id: `card_${now}_${cardIndex}_${Math.random().toString(36).substr(2, 5)}`,
      boosterId: activeSession.id,
      sessionId: activeSession.sessionId,
      name: cleanName,
      rawRarity: cardData.rarity || 'C',
      rarity: normRarity,
      rarityLabel: rarityMeta.label,
      rarityShortCode: rarityMeta.shortCode,
      rarityColor: rarityMeta.color,
      cardIndex: cardIndex,
      totalInBooster: totalInBooster,
      description: cardData.description || '',
      attack: cardData.attack || null,
      defense: cardData.defense || null,
      image: cardData.image || null,
      avgPrice: pricing.avgPrice,
      sellPriceMin: pricing.sellPriceMin,
      sellPriceMax: pricing.sellPriceMax,
      sellPriceMid: Math.round(pricing.avgPrice * 0.625),
      minPrice: cardData.minPrice || cachedMarket?.minPrice || (pricing.avgPrice > 0 ? pricing.avgPrice : 0),
      maxPrice: cardData.maxPrice || cachedMarket?.maxPrice || (pricing.avgPrice > 0 ? pricing.avgPrice : 0),
      lastPrice: cardData.lastPrice || cachedMarket?.lastPrice || (pricing.avgPrice > 0 ? pricing.avgPrice : 0),
      salesCount: cardData.salesCount || cachedMarket?.salesCount || (pricing.avgPrice > 0 ? 1 : 0),
      hasRealMarketPrice: hasRealMarketPrice,
      timestamp: now
    };

    activeSession.cards.push(cardRecord);
    cards.push(cardRecord);

    const bIndex = boosters.findIndex((b) => b.id === activeSession.id);
    if (bIndex !== -1) {
      boosters[bIndex] = activeSession;
    }

    await setStorageData({
      [STORAGE_KEYS.BOOSTERS]: boosters,
      [STORAGE_KEYS.CARDS]: cards,
      [STORAGE_KEYS.ACTIVE_SESSION]: activeSession
    });

    return {
      saved: true,
      isNewCard: true,
      isNewBooster: isNewBooster,
      card: cardRecord,
      booster: activeSession,
      totalBoosters: Math.max(boosters.length, Math.ceil(cards.length / 5)),
      totalCards: cards.length
    };
  });
}

/**
 * Calcule l'intégralité des statistiques globales, taux et valeurs financières
 */
export async function getStats() {
  const data = await getStorageData([
    STORAGE_KEYS.BOOSTERS,
    STORAGE_KEYS.CARDS,
    STORAGE_KEYS.MARKET_PRICES,
    'pulledCardsHistory',
    'totalCardsCount',
    'totalPacksCount',
    'rarityCounts',
    'totalSessionStats'
  ]);

  let boosters = data[STORAGE_KEYS.BOOSTERS] || [];
  let rawCards = data[STORAGE_KEYS.CARDS] || [];
  let cards = rawCards.filter((c) => isValidCardName(c.name));
  const marketCache = data[STORAGE_KEYS.MARKET_PRICES] || {};
  const pulledHistory = Array.isArray(data.pulledCardsHistory) ? data.pulledCardsHistory : [];

  // Rétrocompatibilité : si wikilogix_cards_history est vide mais pulledCardsHistory contient des données
  if (cards.length === 0 && pulledHistory.length > 0) {
    cards = pulledHistory
      .filter((item) => item && isValidCardName(item.name))
      .map((item, idx) => {
        const normR = normalizeRarity(item.rarity);
        const pAvg = Number(item.avgPrice) || Number(item.suggestedPrice) || Number(item.minPrice) || Number(item.lastPrice) || 0;
        return {
          id: `legacy_card_${idx}_${Date.now()}`,
          name: item.name.trim(),
          rarity: normR,
          rawRarity: item.rarity,
          avgPrice: pAvg,
          suggestedPrice: Number(item.suggestedPrice) || Math.round(pAvg * 0.50),
          sellPriceMin: Math.round(pAvg * 0.50),
          sellPriceMax: Math.round(pAvg * 0.75),
          sellPriceMid: Math.round(pAvg * 0.625),
          minPrice: Number(item.minPrice) || pAvg,
          maxPrice: Number(item.maxPrice) || pAvg,
          lastPrice: Number(item.lastPrice) || pAvg,
          imageUrl: item.imageUrl || null,
          timestamp: Date.now() - (pulledHistory.length - idx) * 60000
        };
      });
  }

  // Purge immédiate et automatique des faux tags enregistrés précédemment
  if (cards.length !== rawCards.length && rawCards.length > 0) {
    boosters.forEach((b) => {
      if (Array.isArray(b.cards)) {
        b.cards = b.cards.filter((c) => isValidCardName(c.name));
      }
    });
    boosters = boosters.filter((b) => Array.isArray(b.cards) && b.cards.length > 0);
    setStorageData({
      [STORAGE_KEYS.CARDS]: cards,
      [STORAGE_KEYS.BOOSTERS]: boosters
    }).catch(() => {});
  }

  const totalCards = Math.max(cards.length, Number(data.totalCardsCount) || 0, pulledHistory.length);
  const totalBoosters = Math.max(boosters.length, Number(data.totalPacksCount) || 0, totalCards > 0 ? Math.ceil(totalCards / 5) : 0);

  let totalAverageValue = 0;
  let totalSellValueMin = 0;
  let totalSellValueMax = 0;
  let realMarketCardsCount = 0;

  const rarityOrder = ['L', 'UR', 'SR', 'R', 'PC', 'C'];
  const rarityCounts = { L: 0, UR: 0, SR: 0, R: 0, PC: 0, C: 0 };
  const rarityValues = { L: 0, UR: 0, SR: 0, R: 0, PC: 0, C: 0 };

  cards.forEach((card) => {
    const r = normalizeRarity(card.rarity);
    rarityCounts[r] = (rarityCounts[r] || 0) + 1;

    // Prix réel du marché Wiki-Masters
    const cleanName = (card.name || '').trim().toLowerCase();
    const cachedMarket = marketCache[cleanName] || marketCache[`${cleanName}__${r}`];
    
    let realPrice = 0;
    if (cachedMarket) {
      realPrice = Number(cachedMarket.avgPrice || cachedMarket.price || cachedMarket.marketPrice || 0);
    }
    if (!realPrice && Number(card.avgPrice) > 0) {
      realPrice = Number(card.avgPrice);
    }
    if (!realPrice && Number(card.suggestedPrice) > 0) {
      realPrice = Math.round(Number(card.suggestedPrice) / 0.625);
    }
    if (!realPrice && Number(card.minPrice) > 0) {
      realPrice = Number(card.minPrice);
    }
    if (!realPrice && Number(card.lastPrice) > 0) {
      realPrice = Number(card.lastPrice);
    }

    if (realPrice > 0) {
      realMarketCardsCount++;
    }

    const avgP = realPrice;
    const minP = Math.round(avgP * 0.50);
    const maxP = Math.round(avgP * 0.75);

    totalAverageValue += avgP;
    totalSellValueMin += minP;
    totalSellValueMax += maxP;
    rarityValues[r] = (rarityValues[r] || 0) + avgP;
  });

  // Si des compteurs de rareté globaux existent dans storage
  if (data.rarityCounts && typeof data.rarityCounts === 'object') {
    Object.entries(data.rarityCounts).forEach(([rName, cnt]) => {
      const code = normalizeRarity(rName);
      if (rarityCounts[code] !== undefined && cnt > rarityCounts[code]) {
        rarityCounts[code] = cnt;
      }
    });
  }

  const rarityBreakdown = {};
  rarityOrder.forEach((rCode) => {
    const config = RARITY_CONFIG[rCode];
    const count = rarityCounts[rCode] || 0;
    const rate = totalCards > 0 ? (count / totalCards) * 100 : 0;
    const value = rarityValues[rCode] || 0;

    rarityBreakdown[rCode] = {
      id: rCode,
      key: config.key,
      label: config.label,
      shortCode: config.shortCode,
      count: count,
      rate: Number(rate.toFixed(2)),
      totalValue: value,
      color: config.color,
      textColor: config.textColor,
      bgColor: config.bgColor,
      borderColor: config.borderColor
    };
  });

  const avgBoosterValue = totalBoosters > 0 ? Math.round(totalAverageValue / totalBoosters) : 0;
  const avgBoosterResaleMin = totalBoosters > 0 ? Math.round(totalSellValueMin / totalBoosters) : 0;
  const avgBoosterResaleMax = totalBoosters > 0 ? Math.round(totalSellValueMax / totalBoosters) : 0;

  const recentBoosters = [...boosters]
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, 10);

  const recentCards = [...cards]
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, 25)
    .map((card) => {
      const cleanName = (card.name || '').trim().toLowerCase();
      const r = normalizeRarity(card.rarity);
      const cached = marketCache[cleanName] || marketCache[`${cleanName}__${r}`];
      
      let p = (cached && Number(cached.avgPrice) > 0) ? Number(cached.avgPrice) : (Number(card.avgPrice) || 0);
      if (!p && Number(card.suggestedPrice) > 0) {
        p = Math.round(Number(card.suggestedPrice) / 0.625);
      }
      if (!p && Number(card.minPrice) > 0) {
        p = Number(card.minPrice);
      }
      if (!p && Number(card.lastPrice) > 0) {
        p = Number(card.lastPrice);
      }

      return {
        ...card,
        avgPrice: p,
        suggestedPrice: Number(card.suggestedPrice) || (p > 0 ? Math.round(p * 0.50) : 0),
        sellPriceMin: p > 0 ? (Number(card.sellPriceMin) || Math.round(p * 0.50)) : 0,
        sellPriceMax: p > 0 ? (Number(card.sellPriceMax) || Math.round(p * 0.75)) : 0,
        sellPriceMid: p > 0 ? (Number(card.sellPriceMid) || Math.round(p * 0.625)) : 0,
        minPrice: (cached && Number(cached.minPrice) > 0) ? Number(cached.minPrice) : (card.minPrice || p),
        maxPrice: (cached && Number(cached.maxPrice) > 0) ? Number(cached.maxPrice) : (card.maxPrice || p),
        lastPrice: (cached && Number(cached.lastPrice) > 0) ? Number(cached.lastPrice) : (card.lastPrice || p),
        hasRealMarketPrice: p > 0
      };
    });

  return {
    totalBoosters,
    totalCards,
    realMarketCardsCount,
    totalAverageValue,
    totalSellValueMin,
    totalSellValueMax,
    avgBoosterValue,
    avgBoosterResaleMin,
    avgBoosterResaleMax,
    legendaryCount: rarityCounts.L,
    legendaryRate: totalCards > 0 ? Number(((rarityCounts.L / totalCards) * 100).toFixed(2)) : 0,
    urCount: rarityCounts.UR,
    urRate: totalCards > 0 ? Number(((rarityCounts.UR / totalCards) * 100).toFixed(2)) : 0,
    superRareCount: rarityCounts.SR,
    superRareRate: totalCards > 0 ? Number(((rarityCounts.SR / totalCards) * 100).toFixed(2)) : 0,
    rareCount: rarityCounts.R,
    rareRate: totalCards > 0 ? Number(((rarityCounts.R / totalCards) * 100).toFixed(2)) : 0,
    uncommonCount: rarityCounts.PC,
    uncommonRate: totalCards > 0 ? Number(((rarityCounts.PC / totalCards) * 100).toFixed(2)) : 0,
    commonCount: rarityCounts.C,
    commonRate: totalCards > 0 ? Number(((rarityCounts.C / totalCards) * 100).toFixed(2)) : 0,
    rarityBreakdown,
    recentBoosters,
    recentCards,
    lastPullTimestamp: boosters.length > 0 ? boosters[boosters.length - 1].timestamp : (cards.length > 0 ? cards[cards.length - 1].timestamp : null)
  };
}

/**
 * Réinitialise l'historique complet et purge toutes les clés de stockage
 */
export async function clearHistory() {
  return enqueueStorageTask(async () => {
    const keysToReset = {
      [STORAGE_KEYS.BOOSTERS]: [],
      [STORAGE_KEYS.CARDS]: [],
      [STORAGE_KEYS.ACTIVE_SESSION]: null,
      [STORAGE_KEYS.MARKET_PRICES]: {},
      pulledCardsHistory: [],
      totalCardsCount: 0,
      totalPacksCount: 0,
      rarityCounts: {
        'Commune': 0,
        'Peu commune': 0,
        'Rare': 0,
        'Super rare': 0,
        'Ultra rare': 0,
        'Légendaire': 0
      },
      totalSessionStats: { packsOpened: 0, cardsPulled: 0, cards: [] },
      botLiveStatus: null
    };

    await setStorageData(keysToReset);

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await new Promise((res) => {
        chrome.storage.local.set(keysToReset, res);
      });
    }

    if (typeof chrome !== 'undefined' && chrome.action && chrome.action.setBadgeText) {
      try {
        chrome.action.setBadgeText({ text: '' });
      } catch (_) {}
    }
  });
}

/**
 * Exporte l'intégralité des données en JSON
 */
export async function exportDataAsJSON() {
  const data = await getStorageData([STORAGE_KEYS.BOOSTERS, STORAGE_KEYS.CARDS, STORAGE_KEYS.MARKET_PRICES]);
  const validCards = (data[STORAGE_KEYS.CARDS] || []).filter((c) => isValidCardName(c.name));
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      extension: 'WikiLogix',
      version: '1.6.0',
      boosters: data[STORAGE_KEYS.BOOSTERS] || [],
      cards: validCards,
      marketPrices: data[STORAGE_KEYS.MARKET_PRICES] || {}
    },
    null,
    2
  );
}

/**
 * Configuration par défaut pour les alertes et filtres Discord (Multi-règles & Fils)
 */
export const DEFAULT_DISCORD_CONFIG = {
  enabled: false,
  webhookUrl: '',
  discordUserId: '',
  rules: [
    {
      id: 'rule_default_1',
      name: 'Légendaires & Ultra Rares',
      enabled: true,
      threadId: '',
      customWebhookUrl: '',
      rarities: {
        L: true,
        UR: true,
        SR: false,
        R: false,
        PC: false,
        C: false
      },
      minPrice: 0,
      maxPrice: null, // null = Infini (pas de limite maximale)
      pingUserId: ''
    }
  ],
  notifyMajorDrops: true
};

/**
 * Récupère la configuration Discord avec migration transparente multi-règles
 */
export async function getDiscordConfig() {
  const data = await getStorageData([STORAGE_KEYS.DISCORD_CONFIG]);
  const stored = data[STORAGE_KEYS.DISCORD_CONFIG] || {};

  let rules = stored.rules;
  if (!Array.isArray(rules) || rules.length === 0) {
    if (stored.filterRarities || stored.filterMinPrice !== undefined) {
      rules = [
        {
          id: 'rule_migrated_1',
          name: 'Filtre Principal',
          enabled: true,
          threadId: '',
          customWebhookUrl: '',
          rarities: stored.filterRarities || { L: true, UR: true, SR: true, R: false, PC: false, C: false },
          minPrice: Number(stored.filterMinPrice) || 0,
          maxPrice: null,
          pingUserId: stored.discordUserId || ''
        }
      ];
    } else {
      rules = DEFAULT_DISCORD_CONFIG.rules;
    }
  }

  return {
    ...DEFAULT_DISCORD_CONFIG,
    ...stored,
    rules: rules
  };
}

/**
 * Enregistre la configuration Discord
 */
export async function saveDiscordConfig(config) {
  const current = await getDiscordConfig();
  const updated = {
    ...current,
    ...config
  };
  await setStorageData({
    [STORAGE_KEYS.DISCORD_CONFIG]: updated
  });
  return updated;
}

/**
 * Évalue si une carte correspond aux critères d'une règle spécifique
 * - Raretés cochées
 * - Plage de prix [min, max] (si max est vide/null => infini)
 */
export function evaluateRuleMatch(cardData, rule) {
  if (!rule || rule.enabled === false) return false;
  if (!cardData || !isValidCardName(cardData.name)) return false;

  const rarity = normalizeRarity(cardData.rarity);

  // 1. Filtrage par Rareté
  if (rule.rarities) {
    const isRaritySelected = Boolean(rule.rarities[rarity]);
    if (!isRaritySelected) return false;
  }

  // 2. Filtrage par Plage de Prix Réel
  const priceVal = Number(cardData.avgPrice || cardData.suggestedPrice || cardData.lastPrice || 0);
  const minPrice = Number(rule.minPrice) || 0;

  if (minPrice > 0 && priceVal < minPrice) {
    return false;
  }

  const hasMax = rule.maxPrice !== null && rule.maxPrice !== undefined && rule.maxPrice !== '' && !isNaN(Number(rule.maxPrice));
  if (hasMax) {
    const maxPrice = Number(rule.maxPrice);
    if (priceVal > maxPrice) {
      return false;
    }
  }

  return true;
}

/**
 * Renvoie la liste de toutes les règles Discord actives qui correspondent à une carte
 */
export function getMatchingDiscordRules(cardData, config) {
  if (!config || !config.enabled) return [];
  if (!Array.isArray(config.rules)) return [];

  return config.rules.filter((rule) => {
    const effectiveWebhookUrl = (rule.customWebhookUrl || config.webhookUrl || '').trim();
    if (!effectiveWebhookUrl) return false;
    return evaluateRuleMatch(cardData, rule);
  });
}

/**
 * Compatibilité : indique si la carte correspond à au moins une règle active
 */
export function matchesDiscordFilters(cardData, config) {
  return getMatchingDiscordRules(cardData, config).length > 0;
}

