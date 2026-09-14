// ============================================================================
// WikiLogix Tracker & Prix Réels — Content Script v3.7 (Moteur Haute Précision)
// Intégration perfectionnée du moteur d'inspection et de calcul du prix moyen
// ============================================================================

(function () {
  'use strict';

  if (window.__WIKILOGIX_CONTENT_LOADED__) return;
  window.__WIKILOGIX_CONTENT_LOADED__ = true;

  console.log(
    '%c[WikiLogix v3.8] ⚡ Moteur de Récupération des Prix Réels & Notifications Actif',
    'background: #6366f1; color: #ffffff; padding: 6px 14px; border-radius: 6px; font-weight: bold; font-size: 13px;'
  );

  // --- ÉTAT DU CONTENT SCRIPT & VERROUS DE CONTRÔLE ---
  let isProcessingCardInspection = false;
  let isObserverFramePending = false;
  let inspectionWatchdog = null;

  // --- SYSTÈME FINGERPRINT & ANTI-DOUBLON (HAUTE PRÉCISION) ---
  let lastProcessedCardElement = null;
  let lastProcessedCardText = '';
  let lastCardProcessedTimestamp = 0;
  const recentCardFingerprints = new Map(); // Map: cardName -> timestamp
  let seenCardsInCurrentPack = [];          // Array: signatures des cartes dans le pack en cours

  // File FIFO de 15 cartes récemment traitées (anti-doublon scroll)
  const FIFO_MAX_SIZE = 15;
  const recentCardFifo = [];  // [cardName, ...] — le plus récent en tête
  const localMarketCache = {};
  const activeToastTimers = new Map();
  let cachedAudioCtx = null;

  let currentSessionId = `booster_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  // File d'attente atomique pour le stockage
  let contentStorageQueue = Promise.resolve();
  function enqueueContentStorage(fn) {
    const res = contentStorageQueue.then(() => fn());
    contentStorageQueue = res.catch((err) => console.warn('[WikiLogix Storage Queue] Error:', err));
    return res;
  }

  // Préchargement du cache de marché depuis chrome.storage.local
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['wikilogix_market_prices_cache'], (res) => {
      if (res && res.wikilogix_market_prices_cache) {
        Object.assign(localMarketCache, res.wikilogix_market_prices_cache);
      }
    });

    if (chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes.wikilogix_market_prices_cache?.newValue) {
          Object.assign(localMarketCache, changes.wikilogix_market_prices_cache.newValue);
        }
      });
    }
  }

  // ==========================================================================
  // 1. CONSTANTES & FILTRAGE STRICT DES ÉLÉMENTS D'INTERFACE
  // ==========================================================================

  const RARITY_MAP = {
    'c': 'Commune',
    'pc': 'Peu commune',
    'r': 'Rare',
    'sr': 'Super rare',
    'ur': 'Ultra rare',
    'l': 'Légendaire',
    'commun': 'Commune',
    'commune': 'Commune',
    'peu commune': 'Peu commune',
    'peu commun': 'Peu commune',
    'rare': 'Rare',
    'super rare': 'Super rare',
    'ultra rare': 'Ultra rare',
    'légendaire': 'Légendaire',
    'legendaire': 'Légendaire'
  };

  const RARITY_META_MAP = {
    L: { label: 'Légendaire', shortCode: 'L', color: '#ffe144', textColor: '#0d1117', border: '#ffe144' },
    UR: { label: 'Ultra Rare', shortCode: 'UR', color: '#fa9931', textColor: '#ffffff', border: '#fa9931' },
    SR: { label: 'Super Rare', shortCode: 'SR', color: '#ed6fa3', textColor: '#ffffff', border: '#ed6fa3' },
    R: { label: 'Rare', shortCode: 'R', color: '#c6a7f2', textColor: '#0d1117', border: '#c6a7f2' },
    PC: { label: 'Peu Commune', shortCode: 'PC', color: '#b1cff2', textColor: '#0d1117', border: '#b1cff2' },
    C: { label: 'Commune', shortCode: 'C', color: '#b8f2d5', textColor: '#0d1117', border: '#b8f2d5' }
  };

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
    'cc by-sa 4.0', 'texte de l\'article', 'crédits sur la page wikipédia', 'zevent'
  ]);

  const IGNORED_TEXTS = new Set([
    'ouvrir', 'booster', 'pack', 'continuer', 'terminer', 'valider', 'fermer', 
    'stats', 'inventaire', 'collection', 'suivant', 'precedent', 'retour',
    'points', 'prix', 'edition', 'wiki', 'masters', 'carte', 'boutique', 'acheter', 'shop', 'wikibidous', 'zevent',
    'c', 'pc', 'r', 'sr', 'ur', 'l', 'uc', 'cr', 'détail', 'vue de la carte', 'marché', 'cours'
  ]);

  function isValidCardName(name) {
    if (!name || typeof name !== 'string') return false;
    const clean = name.trim().toLowerCase().replace(/\s+/g, ' ');
    if (clean.length < 2 || clean.length > 90) return false;

    const RARITY_CODES = new Set(['c', 'pc', 'r', 'sr', 'ur', 'l', 'uc', 'cr']);
    if (RARITY_CODES.has(clean)) return false;

    if (BOGUS_EXACT_NAMES.has(clean)) return false;

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

    if (/^[\d\s.,/–—+:-]+$/.test(clean)) return false;

    return true;
  }

  function normalizeRarity(raw) {
    if (!raw || typeof raw !== 'string') return 'C';
    const s = raw.trim().toLowerCase();

    if (s === 'l' || s === 'legendary' || s.includes('leg') || s.includes('lég')) return 'L';
    if (s === 'ur' || s === 'ultra_rare' || s === 'ultrarare' || s.includes('ultra')) return 'UR';
    if (s === 'sr' || s === 'super_rare' || s === 'superrare' || s.includes('super')) return 'SR';
    if (s === 'r' || s === 'rare') return 'R';
    if (s === 'pc' || s === 'uc' || s === 'uncommon' || s.includes('peu')) return 'PC';
    if (s === 'c' || s === 'common' || s.includes('com')) return 'C';

    return 'C';
  }

  function getRarityMeta(rarityCode, customMarketPrice = null) {
    const code = normalizeRarity(rarityCode);
    const meta = RARITY_META_MAP[code] || RARITY_META_MAP.C;
    const isReal = customMarketPrice !== null && customMarketPrice !== undefined && Number(customMarketPrice) > 0;
    const avgPrice = isReal ? Number(customMarketPrice) : 0;

    const sellMin = Math.round(avgPrice * 0.50);
    const sellMax = Math.round(avgPrice * 0.75);

    return {
      ...meta,
      code,
      avgPrice,
      sellMin,
      sellMax,
      isRealMarketPrice: isReal
    };
  }

  // ==========================================================================
  // 2. REGEX & PARSEUR DE PRIX HAUTE PRÉCISION (Multi-lignes & Unités)
  // ==========================================================================

  function parsePriceString(str) {
    if (!str || typeof str !== 'string') return 0;
    try {
      // 1. Nettoyage des espaces insécables et normalisation
      let clean = str.replace(/[\u00a0\u202f\u200b]/g, ' ').trim();
      if (!clean) return 0;

      // 2. Rejeter formellement les dates et durées relatives (ex: "il y a 2 jours", "12/09", "10/09/2026", "2h", "15 min")
      if (
        /\b(?:il\s+y\s+a|jours?|heures?|minutes?|secondes?|hier|today|ago|date)\b/i.test(clean) ||
        /\d{1,2}\s*[\/.-]\s*\d{1,2}(?:\s*[\/.-]\s*\d{2,4})?/.test(clean) ||
        /^\d+\s*(?:j|h|min|s|sec)\b/i.test(clean)
      ) {
        return 0;
      }

      // 3. Si le texte contient des retours à la ligne, cibler la première ligne avec un chiffre non-date
      const lines = clean.split(/[\r\n]+/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (
          /\d/.test(trimmed) &&
          !/\b(?:il\s+y\s+a|jours?|heures?|minutes?|date)\b/i.test(trimmed) &&
          !/\d{1,2}\s*[\/.-]\s*\d{1,2}/.test(trimmed)
        ) {
          clean = trimmed;
          break;
        }
      }

      // 4. Ignorer les compteurs / intitulés parasites connus au début
      clean = clean.replace(/^(?:10\s*derni[eè]res\s*ventes?|\d+\s*ventes?|q-score\s*:\s*\d+|vues?\s*:\s*\d+|exemplaires?\s*:\s*\d+)/i, '').trim();

      // 5. Format notation "1.5k" ou "1,5 k" ou "15k"
      const kMatch = clean.match(/([\d.,]+)\s*k\b/i);
      if (kMatch) {
        const base = parseFloat(kMatch[1].replace(',', '.'));
        if (!isNaN(base) && base > 0) return Math.round(base * 1000);
      }

      // 6. Si format avec 🪙 : extraire le nombre rattaché au symbole
      const coinMatch = clean.match(/(?:([\d\s\u00a0\u202f.,]+k?)\s*🪙|🪙\s*([\d\s\u00a0\u202f.,]+k?))/i);
      if (coinMatch) {
        const pStr = coinMatch[1] || coinMatch[2];
        const cleaned2 = pStr.replace(/[\s\u00a0\u202f.]/g, '').replace(',', '.');
        const val = Math.round(parseFloat(cleaned2));
        if (!isNaN(val) && val > 0 && val < 50000000) return val;
      }

      // 7. Format avec séparateurs de milliers (ex: "1 250", "12 500", "100 000")
      const thousandMatch = clean.match(/\b([1-9]\d{0,2}(?:[\s\u00a0]\d{3})+)\b/);
      if (thousandMatch) {
        const numStr = thousandMatch[1].replace(/[\s\u00a0]/g, '');
        const val = parseInt(numStr, 10);
        if (!isNaN(val) && val > 0 && val < 50000000) return val;
      }

      // 8. Nombre entier simple isolé (ex: "13", "10", "12", "50", "300")
      const singleMatch = clean.match(/\b(\d+)\b/);
      if (singleMatch) {
        const val = parseInt(singleMatch[1], 10);
        if (!isNaN(val) && val > 0 && val < 50000000) return val;
      }

      return 0;
    } catch (_) {
      return 0;
    }
  }

  // Regex prix (moteur original — permissives et éprouvées)
  const RE_LAST = /(?:derni[eè]re?\s+(?:vente|prix)|dernier)[^\d\n\r]*([\d\s\u00a0\u202f.,]+k?)/i;
  const RE_MIN  = /(?:prix\s+min(?:imum)?|min(?:imum)?\s*:|plus\s+bas|plancher|floor)[^\d\n\r]*([\d\s\u00a0\u202f.,]+k?)/i;
  const RE_AVG  = /(?:prix\s+moyen(?:ne)?|moyen(?:ne)?\s*:|m[eé]dian(?:ne)?)[^\d\n\r]*([\d\s\u00a0\u202f.,]+k?)/i;
  const RE_MAX  = /(?:prix\s+max(?:imum)?|max(?:imum)?\s*:|plus\s+haut)[^\d\n\r]*([\d\s\u00a0\u202f.,]+k?)/i;
  const RE_COIN_PRICE = /(?:([\d\s\u00a0\u202f.,]+k?)\s*🪙|🪙\s*([\d\s\u00a0\u202f.,]+k?))/i;

  function isPullsPage() {
    try {
      const path = window.location.pathname.toLowerCase();
      return path.startsWith('/pulls') || path === '/pulls';
    } catch (_) {
      return false;
    }
  }

  function isIgnoredTitle(txt) {
    if (!txt || txt.length < 2 || txt.length > 55) return true;
    const lower = txt.toLowerCase();
    if (
      lower.includes('wikimasters') ||
      lower.includes('wiki masters') ||
      lower.includes('ouvrir') ||
      lower.includes('pack') ||
      lower.includes('booster') ||
      lower.includes('continuer') ||
      lower.includes('terminer') ||
      lower.includes('valider') ||
      lower.includes('fermer') ||
      lower.includes('boutique') ||
      lower.includes('acheter') ||
      lower.includes('shop') ||
      lower.includes('wikibidous') ||
      lower.includes('zevent') ||
      IGNORED_TEXTS.has(lower)
    ) {
      return true;
    }
    return false;
  }

  // --- FILTRES DE SÉCURITÉ DOM (ZEVENT & NAVIGATION) ---
  function isZeventElement(el) {
    if (!el || !(el instanceof Element)) return false;
    try {
      if (el.classList && el.classList.contains('zv-pulse')) return true;
      const className = (typeof el.className === 'string' ? el.className : (el.getAttribute('class') || '')).toLowerCase();
      if (className.includes('zv-pulse') || className.includes('zevent')) return true;

      const aria = (el.getAttribute('aria-label') || '').toUpperCase();
      if (aria.includes('ZEVENT') || aria.startsWith('ÉVÉNEMENT ZEVENT') || aria.startsWith('EVENEMENT ZEVENT')) return true;

      const title = (el.getAttribute('title') || el.title || '').toUpperCase();
      if (title.includes('ZEVENT')) return true;

      const text = (el.innerText || el.textContent || '').toUpperCase();
      if (text.includes('ZEVENT')) return true;

      const id = (el.id || '').toUpperCase();
      if (id.includes('ZEVENT')) return true;

      if (el.closest && el.closest('.zv-pulse, [class*="zv-pulse"], [aria-label*="ZEVENT" i], [title*="ZEVENT" i], [id*="zevent" i]')) {
        return true;
      }

      return false;
    } catch (_) {
      return false;
    }
  }

  function neutralizeZeventElements() {
    try {
      const zeventElements = document.querySelectorAll('.zv-pulse, [class*="zv-pulse"], [aria-label*="ZEVENT" i], [title*="ZEVENT" i]');
      zeventElements.forEach(el => {
        if (!el.dataset.wmZeventNeutralized) {
          el.dataset.wmZeventNeutralized = "true";
          el.setAttribute('data-wm-blocked', 'zevent');
        }
      });
    } catch (_) {}
  }

  function isHeaderOrWalletElement(el) {
    if (!el || !(el instanceof Element)) return false;
    try {
      return Boolean(el.closest('header, nav, .navbar, [class*="navbar"], [class*="header"], [class*="wallet"], [id*="header"], [id*="nav"], .wallet-container'));
    } catch (_) {
      return false;
    }
  }

  function isCurrencyOrShopElement(el) {
    if (!el || !(el instanceof Element)) return false;
    try {
      const title = (el.getAttribute('title') || el.title || '').toLowerCase();
      const aria = (el.getAttribute('aria-label') || '').toLowerCase();
      const text = (el.innerText || el.textContent || '').toLowerCase();
      const id = (el.id || '').toLowerCase();
      const className = (el.className && typeof el.className === 'string') ? el.className.toLowerCase() : '';

      const isShopOrCurrency = title.includes('boutique') || title.includes('shop') ||
                               aria.includes('boutique') || aria.includes('shop') ||
                               text.includes('boutique') || text.includes('shop') ||
                               title.includes('wikibidou') || aria.includes('wikibidou') ||
                               text.includes('wikibidou') || text.includes('wikibidous') ||
                               text.includes('🪙') || title.includes('🪙') ||
                               text.includes('solde') || title.includes('solde') || aria.includes('solde') ||
                               text.includes('balance') || title.includes('balance') || aria.includes('balance') ||
                               text.includes('portefeuille') || text.includes('wallet') ||
                               id.includes('wallet') || id.includes('balance') || id.includes('shop') ||
                               className.includes('wallet') || className.includes('balance') || className.includes('shop');

      const hasCoinOrShopIcon = Boolean(
        el.querySelector('img[alt*="coin" i], img[src*="coin" i], img[src*="piece" i], svg[class*="coin" i], svg[class*="wallet" i], svg[class*="shop" i], [class*="wikibidou"]')
      );

      return isShopOrCurrency || hasCoinOrShopIcon;
    } catch (_) {
      return false;
    }
  }

  // ==========================================================================
  // 3. SYNTHÈSE AUDIO WEB AUDIO API
  // ==========================================================================

  function playDynamicSound(soundType) {
    try {
      if (!cachedAudioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) cachedAudioCtx = new AudioCtx();
      }
      if (!cachedAudioCtx) return;
      if (cachedAudioCtx.state === 'suspended') {
        cachedAudioCtx.resume();
      }
      const t0 = cachedAudioCtx.currentTime;

      if (soundType === 'legendary' || soundType === 'L') {
        const notes = [523.25, 659.25, 783.99]; // C5 -> E5 -> G5
        notes.forEach((freq, idx) => {
          const osc = cachedAudioCtx.createOscillator();
          const gain = cachedAudioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t0 + idx * 0.12);
          
          gain.gain.setValueAtTime(0, t0 + idx * 0.12);
          gain.gain.linearRampToValueAtTime(0.35, t0 + idx * 0.12 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.01, t0 + idx * 0.12 + 0.22);
          
          osc.connect(gain);
          gain.connect(cachedAudioCtx.destination);
          osc.start(t0 + idx * 0.12);
          osc.stop(t0 + idx * 0.12 + 0.25);
        });
      } else if (soundType === 'ultra' || soundType === 'UR') {
        const notes = [587.33, 880]; // D5 -> A5
        notes.forEach((freq, idx) => {
          const osc = cachedAudioCtx.createOscillator();
          const gain = cachedAudioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t0 + idx * 0.14);
          
          gain.gain.setValueAtTime(0, t0 + idx * 0.14);
          gain.gain.linearRampToValueAtTime(0.3, t0 + idx * 0.14 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.01, t0 + idx * 0.14 + 0.18);
          
          osc.connect(gain);
          gain.connect(cachedAudioCtx.destination);
          osc.start(t0 + idx * 0.14);
          osc.stop(t0 + idx * 0.14 + 0.2);
        });
      } else if (soundType === 'super_rare' || soundType === 'SR') {
        const osc = cachedAudioCtx.createOscillator();
        const gain = cachedAudioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, t0); // E5
        
        gain.gain.setValueAtTime(0.25, t0);
        gain.gain.exponentialRampToValueAtTime(0.01, t0 + 0.15);
        
        osc.connect(gain);
        gain.connect(cachedAudioCtx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.16);
      }
    } catch (_) {}
  }

  // ==========================================================================
  // 4. CLIC DE POINTEUR FORCÉ & SÉCURISÉ (100% Ancien Moteur)
  // ==========================================================================

  function forceClickElement(el) {
    if (!el || !(el instanceof Element)) return false;
    if (isZeventElement(el)) return false;

    try {
      const rect = el.getBoundingClientRect();
      const offsetX = (rect.width > 0 ? rect.width : 20) * 0.5;
      const offsetY = (rect.height > 0 ? rect.height : 20) * 0.5;

      const clientX = rect.left + offsetX;
      const clientY = rect.top + offsetY;
      const screenX = (window.screenX || 0) + clientX;
      const screenY = (window.screenY || 0) + clientY;

      const eventInit = {
        bubbles: true,
        cancelable: true,
        view: window,
        detail: 1,
        screenX: Math.round(screenX),
        screenY: Math.round(screenY),
        clientX: Math.round(clientX),
        clientY: Math.round(clientY),
        button: 0,
        buttons: 1
      };

      el.dispatchEvent(new PointerEvent('pointerdown', eventInit));
      el.dispatchEvent(new MouseEvent('mousedown', eventInit));
      el.dispatchEvent(new PointerEvent('pointerup', eventInit));
      el.dispatchEvent(new MouseEvent('mouseup', eventInit));
      el.dispatchEvent(new MouseEvent('click', eventInit));

      if (typeof el.click === 'function') {
        el.click();
      }
      return true;
    } catch (e) {
      try {
        if (typeof el.click === 'function') {
          el.click();
          return true;
        }
      } catch (_) {}
      return false;
    }
  }

  function forceCloseModal(modal) {
    if (!modal) return;
    try {
      const closeBtn = modal.querySelector('button[aria-label*="fermer" i], button[aria-label*="close" i], button:has(svg), svg[class*="lucide-x"]');
      if (closeBtn) {
        forceClickElement(closeBtn.closest('button') || closeBtn);
      } else {
        forceClickElement(modal);
      }
      setTimeout(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true }));
      }, 20);
    } catch (_) {}
  }

  // ==========================================================================
  // 5. STYLE FURTIF & INSPECTION DES PRIX HAUTE PRÉCISION
  // ==========================================================================

  function isElementVisible(el) {
    if (!el || !(el instanceof Element)) return false;
    try {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    } catch (_) {
      return el.offsetParent !== null;
    }
  }

  function ensureStealthStyle() {
    if (document.getElementById('wm-stealth-modal-style')) return;
    try {
      const stealthStyle = document.createElement('style');
      stealthStyle.id = 'wm-stealth-modal-style';
      stealthStyle.textContent = `
        div.fixed.inset-0.z-50.wm-inspecting,
        div.fixed.inset-0.z-50.wm-stealth-hidden,
        [data-radix-portal] .wm-inspecting,
        div[role="dialog"].wm-inspecting,
        div[data-state="open"].wm-inspecting {
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
          transform: scale(0.001) !important;
          transition: none !important;
          animation: none !important;
        }
      `;
      (document.head || document.documentElement).appendChild(stealthStyle);
    } catch (_) {}
  }
  ensureStealthStyle();

  function inspectCardPricesStealth(cardElement, cardData, callback) {
    let isFinished = false;
    let activeModalRef = null;
    let pollModal = null;
    let pollMarketData = null;

    const finishInspection = () => {
      if (isFinished) return;
      isFinished = true;

      if (inspectionWatchdog) {
        clearTimeout(inspectionWatchdog);
        inspectionWatchdog = null;
      }
      if (pollModal) { clearInterval(pollModal); pollModal = null; }
      if (pollMarketData) { clearInterval(pollMarketData); pollMarketData = null; }

      try {
        if (activeModalRef) {
          activeModalRef.classList.remove('wm-inspecting');
          forceCloseModal(activeModalRef);
        } else {
          const openModal = document.querySelector('div.fixed.inset-0.z-50');
          if (openModal) {
            openModal.classList.remove('wm-inspecting');
            forceCloseModal(openModal);
          }
        }
      } catch (e) {
        console.warn("Notice: Fermeture modale :", e);
      }

      setTimeout(() => {
        try {
          callback();
        } catch (err) {
          console.error("Erreur callback inspection :", err);
          isProcessingCardInspection = false;
        }
      }, 30);
    };

    // Watchdog strict d'inspection (1.8s max)
    inspectionWatchdog = setTimeout(() => {
      console.warn("⚠️ [Watchdog Inspection] Timeout 1.8s atteint, reprise immédiate.");
      finishInspection();
    }, 1800);

    try {
      forceClickElement(cardElement);
    } catch (err) {
      finishInspection();
      return;
    }

    let openAttempts = 0;
    pollModal = setInterval(() => {
      openAttempts++;
      const modal = document.querySelector('div.fixed.inset-0.z-50');

      if (modal) {
        clearInterval(pollModal);
        pollModal = null;
        activeModalRef = modal;
        modal.classList.add('wm-inspecting');

        // Cliquer sur l'onglet Marché / Historique
        const tabs = Array.from(modal.querySelectorAll('button[role="tab"], button, div[role="button"]'));
        const marketTab = tabs.find(t => {
          const txt = (t.innerText || t.textContent || '').toLowerCase();
          return txt.includes('march') || txt.includes('vente') || txt.includes('historique');
        });
        if (marketTab) forceClickElement(marketTab);

        let waitDataAttempts = 0;
        pollMarketData = setInterval(() => {
          waitDataAttempts++;

          try {
            const marketContainer = modal.querySelector('[role="tabpanel"], div[class*="tab-content"], div[class*="market"], div[class*="table"], div[class*="history"], div[class*="ventes"]') || modal;
            const marketText = (marketContainer.innerText || marketContainer.textContent || '');

            // Extraction 1 : Regex sur le texte global (méthode éprouvée)
            const extractFromRegex = (regex) => {
              const m = marketText.match(regex);
              return m ? parsePriceString(m[1]) : 0;
            };

            const lastVal = extractFromRegex(RE_LAST);
            const minVal  = extractFromRegex(RE_MIN);
            const avgVal  = extractFromRegex(RE_AVG);
            const maxVal  = extractFromRegex(RE_MAX);

            // Extraction 2 : RE_COIN_PRICE sur les éléments feuilles avec 🪙
            let listingPrices = [];
            const coinPriceElements = marketContainer.querySelectorAll('span, div, td, p');
            for (let i = 0; i < coinPriceElements.length; i++) {
              const el = coinPriceElements[i];
              if (el.children.length === 0) {
                const rawText = (el.innerText || el.textContent || '').trim();
                const coinMatch = rawText.match(RE_COIN_PRICE);
                if (coinMatch) {
                  const pStr = coinMatch[1] || coinMatch[2];
                  const pVal = parsePriceString(pStr);
                  if (pVal > 0 && pVal < 10000000) {
                    listingPrices.push(pVal);
                  }
                }
              }
            }

            // Extraction 3 : Blocs stat par label texte (Moyenne, Dernier, Min, Max)
            let statAvg = 0, statLast = 0, statMin = 0, statMax = 0;
            const allLabels = marketContainer.querySelectorAll('p, span');
            for (let i = 0; i < allLabels.length; i++) {
              const el = allLabels[i];
              if (el.children.length > 0) continue;
              const txt = (el.innerText || el.textContent || '').trim().toLowerCase();
              const nextEl = el.nextElementSibling || el.parentElement?.querySelector('p:nth-of-type(2), span:nth-of-type(2)');
              if (!nextEl) continue;
              const nextVal = parsePriceString(nextEl.innerText || nextEl.textContent || '');

              if (nextVal > 0) {
                if ((txt === 'moyenne' || txt.includes('moyen') || txt.includes('médian')) && !statAvg) statAvg = nextVal;
                if ((txt === 'dernier' || txt.includes('dernièr')) && !statLast) statLast = nextVal;
                if ((txt === 'min' || txt === 'minimum') && !statMin) statMin = nextVal;
                if ((txt === 'max' || txt === 'maximum') && !statMax) statMax = nextVal;
              }
            }

            // Fusion : priorité aux blocs stat, fallback regex, fallback listing
            const finalAvg  = statAvg  || avgVal;
            const finalLast = statLast || lastVal;
            const finalMin  = statMin  || minVal;
            const finalMax  = statMax  || maxVal;

            const hasFoundPrice = finalAvg > 0 || finalLast > 0 || finalMin > 0 || finalMax > 0 || listingPrices.length > 0;

            if (hasFoundPrice || waitDataAttempts >= 10) {
              if (pollMarketData) { clearInterval(pollMarketData); pollMarketData = null; }

              if (finalLast > 0) cardData.lastPrice = String(finalLast);
              if (finalMin > 0)  cardData.minPrice  = String(finalMin);
              if (finalAvg > 0)  cardData.avgPrice  = String(finalAvg);
              if (finalMax > 0)  cardData.maxPrice  = String(finalMax);

              if (listingPrices.length > 0) {
                const sortedPrices = [...listingPrices].sort((a, b) => a - b);
                if (!cardData.minPrice || cardData.minPrice === '0') {
                  cardData.minPrice = String(sortedPrices[0]);
                }
                if (!cardData.maxPrice || cardData.maxPrice === '0') {
                  cardData.maxPrice = String(sortedPrices[sortedPrices.length - 1]);
                }
                if (!cardData.avgPrice || cardData.avgPrice === '0') {
                  const sum = sortedPrices.reduce((a, b) => a + b, 0);
                  cardData.avgPrice = String(Math.round(sum / sortedPrices.length));
                }
                if (!cardData.lastPrice || cardData.lastPrice === '0') {
                  cardData.lastPrice = String(listingPrices[0]);
                }
              }

              const parsedMin  = parseFloat(cardData.minPrice)  || 0;
              const parsedAvg  = parseFloat(cardData.avgPrice)   || 0;
              const parsedLast = parseFloat(cardData.lastPrice)  || 0;

              if (parsedMin > 0 && parsedAvg > 0) {
                if (parsedAvg > parsedMin * 2.5) {
                  cardData.suggestedPrice = Math.round(parsedMin * 1.15) || (parsedMin + 1);
                } else {
                  cardData.suggestedPrice = Math.round((parsedMin + parsedAvg) / 2);
                }
              } else {
                cardData.suggestedPrice = Math.round(parsedMin || parsedAvg || parsedLast || 0);
              }

              console.log(`💰 [WikiLogix Prix] "${cardData.name}" → Avg:${cardData.avgPrice} Min:${cardData.minPrice} Max:${cardData.maxPrice} Last:${cardData.lastPrice} (${listingPrices.length} prix listing)`);
              finishInspection();
            }
          } catch (e) {
            console.warn("Notice: Parsing marché error", e);
            finishInspection();
          }
        }, 70);
        return;
      }

      if (openAttempts > 7) {
        if (pollModal) { clearInterval(pollModal); pollModal = null; }
        finishInspection();
      }
    }, 50);
  }

  // ==========================================================================
  // 6. CIBLAGE DOM & DÉTECTION DES CARTES (100% Fidèle et Robuste)
  // ==========================================================================

  function getVisibleCardTitleElement() {
    try {
      const titleCandidates = document.querySelectorAll('h3.text-base, div[class*="top-[45%]"] h3, .card h3, div[class*="glow-"] h3, div[class*="w-72"] h3, h3');
      for (let i = 0; i < titleCandidates.length; i++) {
        const candidate = titleCandidates[i];
        if (candidate && isElementVisible(candidate) && !isHeaderOrWalletElement(candidate) && !isCurrencyOrShopElement(candidate) && !isZeventElement(candidate)) {
          // Exclure uniquement si le titre est à l'intérieur de nos toasts ou de la modale en cours d'inspection
          if (candidate.closest('#wikilogix-toast-container, .wm-inspecting')) {
            continue;
          }
          const txt = (candidate.innerText || candidate.textContent || '').trim();
          if (txt && !isIgnoredTitle(txt) && isValidCardName(txt)) {
            return { element: candidate, text: txt };
          }
        }
      }
    } catch (e) {
      console.warn("Notice: getVisibleCardTitleElement error", e);
    }
    return null;
  }

  function getRarityFromBadge() {
    try {
      const badges = document.querySelectorAll(
        'div[style*="--color-rarity-"], .absolute.top-2.left-2, [class*="rounded-md"][class*="font-bold"], [class*="glow-"]'
      );

      for (let i = 0; i < badges.length; i++) {
        const b = badges[i];
        const rawText = (b.innerText || b.textContent || '').trim().toLowerCase();
        if (RARITY_MAP[rawText]) {
          return RARITY_MAP[rawText];
        }

        const styleAttr = (b.getAttribute('style') || '').toLowerCase();
        if (styleAttr.includes('--color-rarity-l')) return 'Légendaire';
        if (styleAttr.includes('--color-rarity-ur')) return 'Ultra rare';
        if (styleAttr.includes('--color-rarity-sr')) return 'Super rare';
        if (styleAttr.includes('--color-rarity-r')) return 'Rare';
        if (styleAttr.includes('--color-rarity-pc')) return 'Peu commune';
        if (styleAttr.includes('--color-rarity-c')) return 'Commune';
      }

      const fallbackBadges = document.querySelectorAll(
        'span.font-bold, div.font-bold, [class*="badge"], [class*="tag"], .absolute'
      );
      for (let i = 0; i < fallbackBadges.length; i++) {
        const el = fallbackBadges[i];
        if (el.children.length > 0) continue;
        const txt = (el.textContent || '').trim().toLowerCase();
        if (['ur', 'sr', 'pc', 'l', 'r', 'c'].includes(txt)) {
          return RARITY_MAP[txt];
        }
      }
    } catch (_) {}

    return 'Commune';
  }

  function getCardIndexInPack() {
    try {
      const elements = document.querySelectorAll('div, span, p');
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        if (el.closest('.wm-inspecting, #wikilogix-toast-container')) continue;
        if (el.children.length === 0) {
          const txt = (el.textContent || '').trim();
          const match = txt.match(/(?:carte\s*)?(\d+)\s*\/\s*(\d+)/i);
          if (match) {
            const idx = parseInt(match[1], 10);
            const total = parseInt(match[2], 10);
            if (idx >= 1 && total >= 3 && total <= 10) {
              return { cardIndex: idx, totalInBooster: total };
            }
          }
        }
      }
    } catch (_) {}
    return { cardIndex: (seenCardsInCurrentPack.length || 0) + 1, totalInBooster: 5 };
  }

  function extractCardData(titleElement, detectedRarity) {
    const bottomBox = titleElement.closest('div[class*="top-[45%]"]') || titleElement.parentElement;
    const fullCard = bottomBox ? bottomBox.parentElement : null;

    const name = (titleElement.innerText || titleElement.textContent || '').trim();
    const descEl = bottomBox ? bottomBox.querySelector('p') : null;
    const description = descEl ? descEl.innerText.trim() : '';

    let imageUrl = null;
    if (fullCard) {
      const topImageBox = fullCard.querySelector('div[class*="h-[45%"]');
      const illustrationImg = topImageBox ? topImageBox.querySelector('img') : null;

      if (illustrationImg) {
        imageUrl = illustrationImg.currentSrc || illustrationImg.src || illustrationImg.getAttribute('src');
      }

      if (!imageUrl) {
        const allImgs = fullCard.querySelectorAll('img');
        for (let i = 0; i < allImgs.length; i++) {
          const img = allImgs[i];
          const src = (img.src || img.getAttribute('src') || '').toLowerCase();
          if (!src.includes('commun.png') && 
              !src.includes('rare.png') && 
              !src.includes('legendaire.png') && 
              !src.includes('avatar') &&
              !src.includes('icon')) {
            imageUrl = img.currentSrc || img.src || img.getAttribute('src');
            break;
          }
        }
      }

      if (!imageUrl) {
        const elementsWithBg = fullCard.querySelectorAll('div, span, figure');
        for (let i = 0; i < elementsWithBg.length; i++) {
          const el = elementsWithBg[i];
          const bg = window.getComputedStyle(el).backgroundImage;
          if (bg && bg.startsWith('url(')) {
            const cleanUrl = bg.slice(4, -1).replace(/["']/g, '');
            if (cleanUrl && !cleanUrl.includes('data:image') && !cleanUrl.includes('.png')) {
              imageUrl = cleanUrl;
              break;
            }
          }
        }
      }

      if (imageUrl) {
        if (imageUrl.startsWith('//')) {
          imageUrl = window.location.protocol + imageUrl;
        } else if (imageUrl.startsWith('/')) {
          imageUrl = window.location.origin + imageUrl;
        }
      }
    }

    let attack = '';
    let defense = '';
    if (bottomBox) {
      const statSpans = bottomBox.querySelectorAll('span.font-bold');
      if (statSpans.length >= 2) {
        attack = statSpans[0].innerText.trim();
        defense = statSpans[1].innerText.trim();
      }
    }

    const { cardIndex, totalInBooster } = getCardIndexInPack();

    return {
      name,
      rarity: detectedRarity,
      description,
      imageUrl,
      attack,
      defense,
      cardIndex,
      totalInBooster,
      lastPrice: '',
      minPrice: '',
      avgPrice: '',
      maxPrice: '',
      suggestedPrice: 0
    };
  }

  // ==========================================================================
  // 7. GESTION DES NOTIFICATIONS TOASTS & BADGE IN-PAGE (Haute Fluidité)
  // ==========================================================================

  const styleEl = document.createElement('style');
  styleEl.textContent = `
    @keyframes wikilogixSlideIn {
      from { opacity: 0; transform: translateX(50px) scale(0.95); }
      to { opacity: 1; transform: translateX(0) scale(1); }
    }
    @keyframes wikilogixSlideOut {
      from { opacity: 1; transform: translateX(0) scale(1); }
      to { opacity: 0; transform: translateX(60px) scale(0.92); }
    }
    @keyframes wikilogixPulseGold {
      0% { transform: scale(1); filter: brightness(1); }
      50% { transform: scale(1.15); filter: brightness(1.4) drop-shadow(0 0 12px #ffe144); }
      100% { transform: scale(1); filter: brightness(1); }
    }
    .wikilogix-toast-item {
      position: relative;
      background: linear-gradient(135deg, rgba(13, 17, 28, 0.98) 0%, rgba(22, 28, 48, 0.98) 100%);
      backdrop-filter: blur(16px);
      color: #ffffff;
      padding: 12px 14px;
      border-radius: 12px;
      box-shadow: 0 12px 35px rgba(0, 0, 0, 0.85);
      display: flex;
      flex-direction: column;
      gap: 5px;
      min-width: 300px;
      max-width: 370px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      animation: wikilogixSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      transition: all 0.28s ease;
      pointer-events: auto;
      overflow: hidden;
    }
    .wikilogix-toast-close {
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #94a3b8;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      cursor: pointer;
      line-height: 1;
      padding: 0;
      transition: all 0.15s ease;
    }
    .wikilogix-toast-close:hover {
      background: rgba(239, 68, 68, 0.3);
      border-color: #ef4444;
      color: #ffffff;
      transform: scale(1.1);
    }
    .wikilogix-in-card-pill {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 225, 68, 0.4);
      border-radius: 8px;
      padding: 6px 10px;
      margin-top: 6px;
      font-size: 11px;
      font-weight: 700;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(0,0,0,0.6);
      animation: wikilogixSlideIn 0.2s ease-out;
    }
    .wikilogix-price-highlight {
      display: inline-block;
      animation: wikilogixPulseGold 0.5s ease-out;
    }
  `;
  if (document.head) {
    document.head.appendChild(styleEl);
  } else {
    document.addEventListener('DOMContentLoaded', () => document.head?.appendChild(styleEl));
  }

  function getOrCreateToastContainer() {
    let container = document.getElementById('wikilogix-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'wikilogix-toast-container';
      container.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999999;
        display: flex;
        flex-direction: column-reverse;
        gap: 8px;
        max-height: 80vh;
        overflow: hidden;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }
    return container;
  }

  function getToastDomId(cardName) {
    const safe = (cardName || '').trim().toLowerCase().replace(/[^a-z0-9]/gi, '_');
    return `wikilogix-toast-${safe}`;
  }

  function dismissToastElement(toast, toastId) {
    if (!toast || !toast.parentElement) return;
    if (activeToastTimers.has(toastId)) {
      clearTimeout(activeToastTimers.get(toastId));
      activeToastTimers.delete(toastId);
    }
    toast.style.animation = 'wikilogixSlideOut 0.25s ease forwards';
    setTimeout(() => {
      try {
        toast.remove();
      } catch (_) {}
    }, 240);
  }

  function showInPageToast(card, meta) {
    if (!isValidCardName(card.name)) return;

    const container = getOrCreateToastContainer();
    const toastId = getToastDomId(card.name);

    // Limiter le nombre maximum de toasts simultanés à 3 pour ne pas encombrer l'écran
    while (container.children.length >= 3) {
      const oldest = container.firstElementChild;
      if (oldest) oldest.remove();
    }

    let toast = document.getElementById(toastId);
    if (!toast) {
      toast = document.createElement('div');
      toast.id = toastId;
      toast.className = 'wikilogix-toast-item';
      container.appendChild(toast);
    }

    // Réinitialiser la visibilité en cas de mise à jour de prix
    toast.style.opacity = '1';
    toast.style.transform = 'none';
    toast.style.border = `1px solid ${meta.border}`;
    toast.style.boxShadow = `0 10px 25px -5px rgba(0, 0, 0, 0.75), 0 0 14px ${meta.border}55`;

    const pAvg = Number(meta.avgPrice) > 0 ? Number(meta.avgPrice) : 0;
    const priceText = pAvg > 0
      ? `🪙 ${pAvg.toLocaleString('fr-FR')}`
      : `Non cotée (0 vente)`;

    const resaleText = pAvg > 0
      ? `🪙 ${meta.sellMin.toLocaleString('fr-FR')} - ${meta.sellMax.toLocaleString('fr-FR')}`
      : `À fixer librement`;

    toast.innerHTML = `
      <button class="wikilogix-toast-close" title="Fermer la notification">✕</button>

      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; padding-right: 18px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="background: ${meta.color}; color: ${meta.textColor}; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 5px;">
            ${meta.shortCode} - ${meta.label}
          </span>
        </div>
        <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">Carte ${card.cardIndex || 1}/${card.totalInBooster || 5}</span>
      </div>

      <div style="font-size: 13px; font-weight: 700; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px;">
        ${card.name}
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.45); padding: 6px 9px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); margin-top: 2px;">
        <div style="display: flex; flex-direction: column;">
          <span style="font-size: 8.5px; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Prix Moyen</span>
          <span class="wikilogix-toast-price" style="font-size: 11.5px; font-weight: 800; color: #ffe144;">${priceText}</span>
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-end;">
          <span style="font-size: 8.5px; color: #34d399; font-weight: 700; text-transform: uppercase;">Conseil Revente (50-75%)</span>
          <span class="wikilogix-toast-resale" style="font-size: 11.5px; font-weight: 800; color: #34d399;">${resaleText}</span>
        </div>
      </div>
    `;

    // Gestion du bouton fermer
    const closeBtn = toast.querySelector('.wikilogix-toast-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dismissToastElement(toast, toastId);
      });
    }

    if (activeToastTimers.has(toastId)) {
      clearTimeout(activeToastTimers.get(toastId));
    }

    const timer = setTimeout(() => {
      dismissToastElement(toast, toastId);
    }, 4500);

    activeToastTimers.set(toastId, timer);
  }

  // Injecte ou actualise le badge de prix directement sur la carte dans la page
  function injectInCardPriceBadge(titleElement, avgPrice, sellMin, sellMax) {
    if (!titleElement || !titleElement.parentElement) return;
    try {
      const bottomBox = titleElement.closest('div[class*="top-[45%"]') || titleElement.parentElement;
      let badge = bottomBox.querySelector('.wikilogix-in-card-pill');
      if (!badge) {
        badge = document.createElement('div');
        badge.className = 'wikilogix-in-card-pill';
        bottomBox.appendChild(badge);
      }

      const pAvg = Number(avgPrice) > 0 ? Number(avgPrice) : 0;
      const avgStr = pAvg > 0 ? `${pAvg.toLocaleString('fr-FR')} 🪙` : 'Non cotée';
      const resaleStr = pAvg > 0 ? `${sellMin.toLocaleString('fr-FR')} - ${sellMax.toLocaleString('fr-FR')} 🪙` : 'À fixer';

      badge.innerHTML = `
        <span style="color: #ffe144;">Moy : ${avgStr}</span>
        <span style="color: #34d399; margin-left: 8px;">Revente : ${resaleStr}</span>
      `;
    } catch (_) {}
  }

  async function persistCardToStorage(cardData, detectedRarity) {
    if (!cardData || !isValidCardName(cardData.name)) return;

    return enqueueContentStorage(async () => {
      try {
        const cleanName = cardData.name.trim();
        const normRarity = normalizeRarity(detectedRarity || cardData.rarity);
        const now = Date.now();

        const res = await new Promise((resolve) => {
          if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get(
              [
                'wikilogix_boosters_history',
                'wikilogix_cards_history',
                'wikilogix_active_booster_session',
                'wikilogix_market_prices_cache',
                'pulledCardsHistory',
                'totalCardsCount',
                'totalPacksCount',
                'rarityCounts',
                'totalSessionStats'
              ],
              resolve
            );
          } else {
            resolve({});
          }
        });

        let boosters = res.wikilogix_boosters_history || [];
        let cards = (res.wikilogix_cards_history || []).filter((c) => isValidCardName(c.name));
        let pulledCardsHistory = res.pulledCardsHistory || [];
        let rarityCounts = res.rarityCounts || {};
        let totalCardsCount = (res.totalCardsCount || 0) + 1;
        let totalPacksCount = res.totalPacksCount || Math.max(1, boosters.length);
        let totalSessionStats = res.totalSessionStats || { packsOpened: totalPacksCount, cardsPulled: cards.length, cards: [] };
        const marketCache = res.wikilogix_market_prices_cache || {};
        let activeSession = res.wikilogix_active_booster_session || null;

        const numPrice = parseFloat(cardData.avgPrice) || 0;
        const meta = getRarityMeta(normRarity, numPrice);

        const cardIndex = parseInt(cardData.cardIndex, 10) || (seenCardsInCurrentPack.length || 1);
        const totalInBooster = parseInt(cardData.totalInBooster, 10) || 5;
        const sessionId = cardData.sessionId || currentSessionId;

        let shouldCreateNewBooster = false;
        if (!activeSession) {
          shouldCreateNewBooster = true;
        } else if (sessionId && activeSession.sessionId && sessionId !== activeSession.sessionId) {
          shouldCreateNewBooster = true;
        } else if (activeSession.cards && activeSession.cards.length >= totalInBooster) {
          shouldCreateNewBooster = true;
        }

        if (shouldCreateNewBooster) {
          const newBoosterId = `booster_${now}_${Math.random().toString(36).substr(2, 6)}`;
          activeSession = {
            id: newBoosterId,
            sessionId: sessionId,
            timestamp: now,
            totalExpected: totalInBooster,
            cards: [],
            sourceUrl: window.location.href
          };
          boosters.push(activeSession);
          totalPacksCount = boosters.length;
        }

        if (activeSession.cards) {
          activeSession.cards = activeSession.cards.filter((c) => isValidCardName(c.name));
        }

        const alreadyInBooster = activeSession.cards.some((c) => {
          return (
            c.cardIndex === cardIndex &&
            c.name.trim().toLowerCase() === cleanName.toLowerCase() &&
            c.rarity === normRarity
          );
        });

        if (alreadyInBooster) {
          return;
        }

        const cardRecord = {
          id: `card_${now}_${cardIndex}_${Math.random().toString(36).substr(2, 5)}`,
          boosterId: activeSession.id,
          sessionId: activeSession.sessionId,
          name: cleanName,
          rawRarity: detectedRarity || cardData.rarity || 'C',
          rarity: normRarity,
          rarityLabel: meta.label,
          rarityShortCode: meta.shortCode,
          rarityColor: meta.color,
          cardIndex: cardIndex,
          totalInBooster: totalInBooster,
          description: cardData.description || '',
          attack: cardData.attack || null,
          defense: cardData.defense || null,
          image: cardData.imageUrl || null,
          imageUrl: cardData.imageUrl || null,
          avgPrice: meta.avgPrice,
          sellPriceMin: meta.sellMin,
          sellPriceMax: meta.sellMax,
          sellPriceMid: Math.round(meta.avgPrice * 0.625),
          minPrice: parseFloat(cardData.minPrice) || meta.avgPrice,
          maxPrice: parseFloat(cardData.maxPrice) || meta.avgPrice,
          lastPrice: parseFloat(cardData.lastPrice) || meta.avgPrice,
          salesCount: cardData.salesCount || (meta.avgPrice > 0 ? 1 : 0),
          hasRealMarketPrice: meta.isRealMarketPrice,
          suggestedPrice: cardData.suggestedPrice || meta.sellMin || 0,
          timestamp: now
        };

        activeSession.cards.push(cardRecord);
        cards.push(cardRecord);

        pulledCardsHistory.push({
          name: cleanName,
          rarity: detectedRarity || meta.label,
          imageUrl: cardData.imageUrl || '',
          lastPrice: String(cardRecord.lastPrice || ''),
          minPrice: String(cardRecord.minPrice || ''),
          avgPrice: String(cardRecord.avgPrice || ''),
          maxPrice: String(cardRecord.maxPrice || ''),
          suggestedPrice: cardRecord.suggestedPrice || 0,
          date: new Date().toLocaleTimeString()
        });

        const rLabel = detectedRarity || meta.label;
        rarityCounts[rLabel] = (rarityCounts[rLabel] || 0) + 1;

        const bIndex = boosters.findIndex((b) => b.id === activeSession.id);
        if (bIndex !== -1) {
          boosters[bIndex] = activeSession;
        }

        // Mettre à jour le cache de marché
        if (numPrice > 0) {
          const marketInfo = {
            cardName: cleanName,
            rarity: normRarity,
            avgPrice: numPrice,
            minPrice: cardRecord.minPrice,
            maxPrice: cardRecord.maxPrice,
            lastPrice: cardRecord.lastPrice,
            salesCount: cardRecord.salesCount,
            sellMin: meta.sellMin,
            sellMax: meta.sellMax,
            hasRealMarketPrice: true,
            updatedAt: now
          };
          marketCache[cleanName.toLowerCase()] = marketInfo;
          marketCache[`${cleanName.toLowerCase()}__${normRarity}`] = marketInfo;
          localMarketCache[cleanName.toLowerCase()] = marketInfo;
          localMarketCache[`${cleanName.toLowerCase()}__${normRarity}`] = marketInfo;
        }

        totalSessionStats.cardsPulled = cards.length;
        totalSessionStats.packsOpened = boosters.length;

        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          await new Promise((resolve) => {
            chrome.storage.local.set(
              {
                wikilogix_boosters_history: boosters,
                wikilogix_cards_history: cards,
                wikilogix_active_booster_session: activeSession,
                wikilogix_market_prices_cache: marketCache,
                pulledCardsHistory: pulledCardsHistory.slice(-500),
                totalCardsCount: totalCardsCount,
                totalPacksCount: totalPacksCount,
                rarityCounts: rarityCounts,
                totalSessionStats: totalSessionStats
              },
              resolve
            );
          });
          console.log(
            `%c[WikiLogix] 🎴 Carte enregistrée : "${cleanName}" [${normRarity}] (Prix: ${meta.avgPrice} 🪙 | Revente: ${cardRecord.suggestedPrice} 🪙)`,
            'color: #10b981; font-weight: bold;'
          );

          try {
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
              chrome.runtime.sendMessage({ type: 'UPDATE_BADGE' }, () => {
                if (chrome.runtime.lastError) {}
              });
            }
          } catch (_) {}
        }
      } catch (err) {
        console.error('[WikiLogix Storage] Erreur sauvegarde :', err);
      }
    });
  }

  // ==========================================================================
  // 8. TRAITEMENT CENTRALISÉ D'UNE CARTE (100% Fidèle, Fluide & Infaillible)
  // ==========================================================================

  function processDetectedCard(candidate) {
    if (!isPullsPage() || isProcessingCardInspection || isZeventElement(candidate)) return;

    try {
      const txt = (candidate.innerText || candidate.textContent || '').trim();
      if (!txt || isIgnoredTitle(txt) || !isValidCardName(txt) || txt.toUpperCase().includes('ZEVENT')) return;

      // --- Fix #2 : Marqueur DOM infaillible ---
      // Si cet élément a déjà été traité dans ce cycle, on s'arrête immédiatement
      if (candidate.dataset.wikilogixProcessed) return;
      candidate.dataset.wikilogixProcessed = '1';

      // --- Fix #3 : File FIFO anti-doublon scroll (15 slots) ---
      const fifoIdx = recentCardFifo.indexOf(txt);
      if (fifoIdx !== -1) {
        // Carte déjà vue récemment : on la remonte en tête sans la retraiter
        recentCardFifo.splice(fifoIdx, 1);
        recentCardFifo.unshift(txt);
        return;
      }
      // Ajout en tête de la FIFO
      recentCardFifo.unshift(txt);
      if (recentCardFifo.length > FIFO_MAX_SIZE) recentCardFifo.pop();

      const now = Date.now();

      const { cardIndex, totalInBooster } = getCardIndexInPack();

      // Si le pack en cours a atteint son quota ou si on est revenu au début après plusieurs cartes
      if (seenCardsInCurrentPack.length >= totalInBooster || (cardIndex === 1 && seenCardsInCurrentPack.length >= 3)) {
        seenCardsInCurrentPack = [];
        currentSessionId = `booster_${now}_${Math.random().toString(36).substr(2, 6)}`;
      }

      const cardSignature = `${txt}__${cardIndex}`;
      if (seenCardsInCurrentPack.includes(cardSignature) && (now - lastCardProcessedTimestamp < 2000)) {
        return;
      }

      // Carte authentique validée pour le traitement
      const detectedRarity = getRarityFromBadge();
      const cardData = extractCardData(candidate, detectedRarity);
      cardData.cardIndex = cardIndex || (seenCardsInCurrentPack.length + 1);
      cardData.totalInBooster = totalInBooster || 5;
      cardData.sessionId = currentSessionId;

      // Verrouillage immédiat pour ce cycle
      seenCardsInCurrentPack.push(cardSignature);
      lastProcessedCardElement = candidate;
      lastProcessedCardText = txt;
      lastCardProcessedTimestamp = now;
      recentCardFingerprints.set(txt, now);

      isProcessingCardInspection = true;

      // Watchdog de sécurité absolu (déverrouille au bout de 2.2s quoi qu'il arrive)
      if (inspectionWatchdog) clearTimeout(inspectionWatchdog);
      inspectionWatchdog = setTimeout(() => {
        isProcessingCardInspection = false;
      }, 2200);

      const cardContainer = candidate.closest('div.glow-c, div.glow-pc, div.glow-r, div.glow-sr, div.glow-ur, div.glow-l') || candidate.closest('.card, [class*="card-"], div[class*="w-72"]') || candidate;
      const normRarity = normalizeRarity(detectedRarity);

      // Vérifier si la carte est déjà en cache mémoire local
      const cachedMarket = localMarketCache[cardData.name.toLowerCase()] || localMarketCache[`${cardData.name.toLowerCase()}__${normRarity}`];

      if (cachedMarket && Number(cachedMarket.avgPrice) > 0) {
        cardData.avgPrice  = String(cachedMarket.avgPrice);
        cardData.minPrice  = String(cachedMarket.minPrice  || cachedMarket.avgPrice);
        cardData.maxPrice  = String(cachedMarket.maxPrice  || cachedMarket.avgPrice);
        cardData.lastPrice = String(cachedMarket.lastPrice || cachedMarket.avgPrice);
        cardData.suggestedPrice = Math.round(Number(cardData.avgPrice) * 0.50);

        const meta = getRarityMeta(normRarity, Number(cardData.avgPrice));
        showInPageToast({ name: cardData.name, rarity: normRarity, cardIndex: cardData.cardIndex, totalInBooster: cardData.totalInBooster }, meta);
        injectInCardPriceBadge(candidate, meta.avgPrice, meta.sellMin, meta.sellMax);

        if (normRarity === 'L')        playDynamicSound('legendary');
        else if (normRarity === 'UR')  playDynamicSound('ultra');
        else if (normRarity === 'SR')  playDynamicSound('super_rare');

        persistCardToStorage(cardData, detectedRarity);
        try {
          if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({ type: 'SEND_DISCORD_NOTIFICATION', payload: { ...cardData, hasRealMarketPrice: true } });
          }
        } catch (_) {}

        isProcessingCardInspection = false;
        return;
      }

      // Inspection furtive exacte
      inspectCardPricesStealth(cardContainer, cardData, () => {
        try {
          const numPrice = parseFloat(cardData.avgPrice) || 0;
          const meta = getRarityMeta(normRarity, numPrice);

          // Toast immédiat avec prix
          showInPageToast({
            name: cardData.name,
            rarity: normRarity,
            cardIndex: cardData.cardIndex,
            totalInBooster: cardData.totalInBooster
          }, meta);

          injectInCardPriceBadge(candidate, meta.avgPrice, meta.sellMin, meta.sellMax);

          // Synthèse Audio Web Audio API
          if (normRarity === 'L') {
            playDynamicSound('legendary');
          } else if (normRarity === 'UR' || numPrice >= 1000) {
            playDynamicSound('ultra');
          } else if (normRarity === 'SR') {
            playDynamicSound('super_rare');
          }

          // Enregistrement garanti unique avec prix
          persistCardToStorage(cardData, detectedRarity);

          // Notification Discord & Push
          try {
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
              chrome.runtime.sendMessage({
                type: 'SEND_DISCORD_NOTIFICATION',
                payload: {
                  ...cardData,
                  cardIndex: cardData.cardIndex,
                  totalInBooster: cardData.totalInBooster,
                  hasRealMarketPrice: numPrice > 0
                }
              });
            }
          } catch (_) {}

          console.log(`🃏 [Carte ${cardData.cardIndex}/${cardData.totalInBooster}] : "${cardData.name}" [${detectedRarity}] | Prix moyen : ${cardData.avgPrice || '-'} 🪙 | Revente conseillée : ${cardData.suggestedPrice || '-'}`);
        } catch (err) {
          console.error("Erreur post-inspection :", err);
        } finally {
          isProcessingCardInspection = false;
        }
      });
    } catch (err) {
      console.error("Erreur dans processDetectedCard :", err);
      isProcessingCardInspection = false;
    }
  }

  function checkAndProcessVisibleCard() {
    if (isProcessingCardInspection || !isPullsPage()) return;
    try {
      const visible = getVisibleCardTitleElement();
      if (visible) {
        const { element, text } = visible;
        const now = Date.now();

        // Utiliser le marqueur DOM comme garde principal (fix #2)
        // On accepte aussi si c'est un élément différent OU que le texte a changé ET que 1.5s se sont écoulées
        const isDifferentElement = (element !== lastProcessedCardElement);
        const isDifferentText = (text !== lastProcessedCardText);
        const hasTimePassed = (now - lastCardProcessedTimestamp > 1500);

        if (!element.dataset.wikilogixProcessed && (isDifferentElement || isDifferentText || hasTimePassed)) {
          processDetectedCard(element);
        }
      }
    } catch (e) {
      console.warn("Notice: checkAndProcessVisibleCard error", e);
    }
  }

  // ==========================================================================
  // 9. ÉCOUTEURS D'ÉVÉNEMENTS & OBSERVATEUR DOM (100% Fluide & Robuste)
  // ==========================================================================

  const domObserver = new MutationObserver(() => {
    neutralizeZeventElements();
    if (!isPullsPage() || isProcessingCardInspection || isObserverFramePending) return;

    isObserverFramePending = true;
    requestAnimationFrame(() => {
      isObserverFramePending = false;
      if (!isPullsPage() || isProcessingCardInspection) return;
      checkAndProcessVisibleCard();
    });
  });

  domObserver.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true
  });

  document.addEventListener('click', (e) => {
    if (!isPullsPage()) return;

    try {
      const target = e.target.closest('button, [role="button"], a, div');
      if (!target) return;

      if (isHeaderOrWalletElement(target) || isCurrencyOrShopElement(target) || isZeventElement(target)) return;

      const targetText = (target.innerText || target.textContent || '').trim().toLowerCase();
      if (targetText.includes('zevent')) return;

      const hasPackImg = Boolean(target.querySelector('img[alt*="paquet" i], img[src*="card_pack" i], img[src*="card_pack.png" i]'));
      const isPackImgItself = (e.target.tagName === 'IMG') && (((e.target.src || '').includes('card_pack')) || ((e.target.alt || '').toLowerCase().includes('paquet')));

      const isRealOpenAction = hasPackImg || isPackImgItself || (
        (targetText.includes('ouvrir') || targetText.includes('booster')) &&
        !targetText.includes('continuer') &&
        !targetText.includes('valider') &&
        !targetText.includes('marché') &&
        !targetText.includes('boutique') &&
        !targetText.includes('shop') &&
        !targetText.includes('acheter')
      );

      const isFinishAction = targetText.includes('terminer') || 
                             targetText.includes('fermer') || 
                             targetText.includes('valider') || 
                             targetText.includes('continuer');

      const isArrowNav = Boolean(target.querySelector('svg[class*="chevron"], svg polyline, svg path[d*="M9 5l7 7-7 7"]') || target.classList.contains('rounded-full'));

      if (isRealOpenAction) {
        currentSessionId = `booster_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        seenCardsInCurrentPack = [];
        recentCardFifo.length = 0; // Reset FIFO pour le nouveau booster
        lastProcessedCardElement = null;
        lastProcessedCardText = '';
        lastCardProcessedTimestamp = 0;
      } else if (isFinishAction) {
        seenCardsInCurrentPack = [];
        recentCardFifo.length = 0; // Reset FIFO
        lastProcessedCardElement = null;
        lastProcessedCardText = '';
        lastCardProcessedTimestamp = 0;
      } else if (isArrowNav) {
        lastProcessedCardElement = null;
      }

      if (!isProcessingCardInspection) {
        requestAnimationFrame(() => {
          checkAndProcessVisibleCard();
        });
        setTimeout(() => {
          checkAndProcessVisibleCard();
        }, 120);
      }
    } catch (err) {
      console.warn("Notice: Click listener error :", err);
    }
  }, true);

  // Écouteur pour la réinitialisation instantanée du cache local depuis la popup / background
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg && msg.type === 'CLEAR_LOCAL_CACHE') {
        seenCardsInCurrentPack = [];
        recentCardFingerprints.clear();
        recentCardFifo.length = 0; // Vider la FIFO
        lastProcessedCardElement = null;
        lastProcessedCardText = '';
        lastCardProcessedTimestamp = 0;
        // Nettoyer les marqueurs DOM
        document.querySelectorAll('[data-wikilogix-processed]').forEach(el => {
          delete el.dataset.wikilogixProcessed;
        });
        for (const key of Object.keys(localMarketCache)) {
          delete localMarketCache[key];
        }
        const container = document.getElementById('wikilogix-toast-container');
        if (container) container.innerHTML = '';
        console.log('[WikiLogix] 🧹 Cache mémoire et historique réinitialisés.');
      }
    });
  }

  setInterval(checkAndProcessVisibleCard, 200);
  checkAndProcessVisibleCard();

})();
