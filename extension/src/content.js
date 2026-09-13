/**
 * WikiLogix - Content Script Tracker & Prix Réels (v1.6.0)
 * - Moteur d'extraction et de scan discret 100% fidèle à l'ancienne extension
 * - Style furtif instantané (.wm-inspecting) sans clignotement ni reflow
 * - Déclencheur de clic forcé géométrique (forceClickElement)
 * - Moteur Regex & Parser pré-compilés (RE_AVG, RE_LAST, RE_MIN, RE_MAX, RE_COIN_PRICE, parsePriceString)
 * - Calcul du conseil de revente officiel (50% à 75% du prix moyen réel)
 * - Notifications push toasts dorées
 * - Synchronisation atomique dans chrome.storage.local
 */

(() => {
  if (window.__WIKILOGIX_CONTENT_LOADED__) return;
  window.__WIKILOGIX_CONTENT_LOADED__ = true;

  console.log(
    '%c[WikiLogix v1.6.0] ⚡ Moteur de Récupération des Prix Réels Actif',
    'background: #6366f1; color: #ffffff; padding: 6px 14px; border-radius: 6px; font-weight: bold; font-size: 13px;'
  );

  // ==========================================================================
  // 1. CONSTANTES & LISTE NOIRE D'INTERFACE
  // ==========================================================================

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

  function isValidCardName(name) {
    if (!name || typeof name !== 'string') return false;
    const clean = name.trim().toLowerCase().replace(/\s+/g, ' ');
    if (clean.length < 2 || clean.length > 90) return false;

    // Rejet strict des codes de rareté
    const RARITY_CODES = new Set(['c', 'pc', 'r', 'sr', 'ur', 'l', 'uc', 'cr']);
    if (RARITY_CODES.has(clean)) return false;

    // Rejet des termes d'interface exacts
    if (BOGUS_EXACT_NAMES.has(clean)) return false;

    // Rejet des préfixes d'interface
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
  // 2. REGEX & PARSEUR DE PRIX (Issu de l'ancienne extension)
  // ==========================================================================

  const RE_K = /([\d.,]+)\s*k\b/i;
  const RE_NUM = /^\d+(?:[.,\s\u00a0\u202f]\d{3})*(?:[.,]\d+)?|\d+/;
  const RE_CLEAN_ALL_SPACES = /[\u00a0\u202f\u200b\s]+/g;
  const RE_CLEAN_DOTS_SPACES = /[\s\u00a0\u202f.]/g;

  const RE_LAST = /(?:derni[eè]re?\s+(?:vente|prix)|dernier)[^\d\n\r]*([\d\s\u00a0\u202f.,]+k?)/i;
  const RE_MIN  = /(?:prix\s+min(?:imum)?|min(?:imum)?\s*:|plus\s+bas|plancher|floor)[^\d\n\r]*([\d\s\u00a0\u202f.,]+k?)/i;
  const RE_AVG  = /(?:prix\s+moyen(?:ne)?|moyen(?:ne)?\s*:|m[eé]dian(?:ne)?)[^\d\n\r]*([\d\s\u00a0\u202f.,]+k?)/i;
  const RE_MAX  = /(?:prix\s+max(?:imum)?|max(?:imum)?\s*:|plus\s+haut)[^\d\n\r]*([\d\s\u00a0\u202f.,]+k?)/i;
  const RE_COIN_PRICE = /(?:([\d\s\u00a0\u202f.,]+k?)\s*🪙|🪙\s*([\d\s\u00a0\u202f.,]+k?))/i;

  function parsePriceString(str) {
    if (!str || typeof str !== 'string') return 0;
    try {
      const kMatch = str.match(RE_K);
      if (kMatch) {
        const base = parseFloat(kMatch[1].replace(',', '.'));
        if (!isNaN(base)) return Math.round(base * 1000);
      }

      const cleaned = str.replace(RE_CLEAN_ALL_SPACES, ' ').trim();
      const numMatch = cleaned.match(RE_NUM);
      if (!numMatch) return 0;

      const rawNum = numMatch[0].replace(RE_CLEAN_DOTS_SPACES, '').replace(',', '.');
      const val = Math.round(parseFloat(rawNum));
      return isNaN(val) ? 0 : val;
    } catch (_) {
      return 0;
    }
  }

  // ==========================================================================
  // 3. STYLE FURTIF & CLIC DIRECT (Issu de l'ancienne extension)
  // ==========================================================================

  function ensureStealthStyle() {
    if (document.getElementById('wikilogix-stealth-modal-style')) return;
    try {
      const stealthStyle = document.createElement('style');
      stealthStyle.id = 'wikilogix-stealth-modal-style';
      stealthStyle.textContent = `
        div.fixed.inset-0.z-50.wm-inspecting,
        div.fixed.inset-0.z-50.wm-stealth-hidden,
        div.fixed.inset-0.wm-inspecting,
        div.card-frame.wm-inspecting,
        div[role="dialog"].wm-inspecting,
        [data-radix-portal] .wm-inspecting {
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

  function forceClickElement(el) {
    if (!el || !(el instanceof Element)) return false;
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
  // 4. MOTEUR D'INSPECTION FURTIVE DES PRIX DU MARCHÉ
  // ==========================================================================

  let isProcessingCardInspection = false;

  function inspectCardPricesStealth(cardElement, cardData, callback) {
    let isFinished = false;
    let activeModalRef = null;
    let pollModal = null;
    let pollMarketData = null;
    let inspectionWatchdog = null;

    ensureStealthStyle();

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
          const openModal = document.querySelector('div.fixed.inset-0.z-50, div.fixed.inset-0:has(.card-frame), div[role="dialog"], div.fixed.inset-0');
          if (openModal) {
            openModal.classList.remove('wm-inspecting');
            forceCloseModal(openModal);
          }
        }
      } catch (e) {
        console.warn("Notice: Fermeture modale :", e);
      }

      isProcessingCardInspection = false;

      setTimeout(() => {
        try {
          callback(cardData);
        } catch (err) {
          console.error("Erreur callback inspection :", err);
        }
      }, 30);
    };

    // Watchdog strict d'inspection (1.8s max)
    inspectionWatchdog = setTimeout(() => {
      finishInspection();
    }, 1800);

    // Clic d'ouverture sur le conteneur de la carte
    try {
      forceClickElement(cardElement);
    } catch (err) {
      finishInspection();
      return;
    }

    let openAttempts = 0;
    pollModal = setInterval(() => {
      openAttempts++;
      const modal = document.querySelector('div.fixed.inset-0.z-50, div.fixed.inset-0:has(.card-frame), div[role="dialog"], div.fixed.inset-0');

      if (modal) {
        clearInterval(pollModal);
        pollModal = null;
        activeModalRef = modal;
        modal.classList.add('wm-inspecting');

        const tabs = Array.from(modal.querySelectorAll('button[role="tab"], button, div[role="button"]'));
        const marketTab = tabs.find((t) => {
          const txt = (t.innerText || t.textContent || '').toLowerCase();
          return txt.includes('march') || txt.includes('vente') || txt.includes('historique');
        });
        if (marketTab) {
          forceClickElement(marketTab);
        }

        let waitDataAttempts = 0;
        pollMarketData = setInterval(() => {
          waitDataAttempts++;

          try {
            if (waitDataAttempts % 3 === 0 && marketTab) {
              forceClickElement(marketTab);
            }

            const marketContainer = modal.querySelector('[role="tabpanel"], div[class*="tab-content"], div[class*="market"], div[class*="table"], div[class*="history"], div[class*="ventes"]') || modal;
            const marketText = (marketContainer.innerText || marketContainer.textContent || '');

            const extractFromRegex = (regex) => {
              const m = marketText.match(regex);
              return m ? parsePriceString(m[1]) : 0;
            };

            const lastVal = extractFromRegex(RE_LAST);
            const minVal  = extractFromRegex(RE_MIN);
            const avgVal  = extractFromRegex(RE_AVG);
            const maxVal  = extractFromRegex(RE_MAX);

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

            // Extraction SVG Recharts
            let svgAvg = 0;
            const chartTexts = modal.querySelectorAll('text, tspan');
            for (const ct of chartTexts) {
              const txt = (ct.textContent || '').trim();
              const match = txt.match(/Moy\.?\s*:?\s*(\d[\d\s]*)/i) || txt.match(/Moyenne\s*:?\s*(\d[\d\s]*)/i);
              if (match && match[1]) {
                const val = parsePriceString(match[1]);
                if (val > 0) {
                  svgAvg = val;
                  break;
                }
              }
            }

            const effectiveAvg = avgVal > 0 ? avgVal : svgAvg;
            const hasFoundRegexPrice = lastVal > 0 || minVal > 0 || effectiveAvg > 0 || maxVal > 0;
            const hasFoundListingPrice = listingPrices.length > 0;

            if (hasFoundRegexPrice || hasFoundListingPrice || waitDataAttempts >= 10) {
              if (pollMarketData) { clearInterval(pollMarketData); pollMarketData = null; }

              if (lastVal > 0) cardData.lastPrice = lastVal;
              if (minVal > 0)  cardData.minPrice = minVal;
              if (effectiveAvg > 0) cardData.avgPrice = effectiveAvg;
              if (maxVal > 0)  cardData.maxPrice = maxVal;

              if (listingPrices.length > 0) {
                const sortedPrices = [...listingPrices].sort((a, b) => a - b);
                if (!cardData.minPrice || cardData.minPrice === 0) {
                  cardData.minPrice = sortedPrices[0];
                }
                if (!cardData.maxPrice || cardData.maxPrice === 0) {
                  cardData.maxPrice = sortedPrices[sortedPrices.length - 1];
                }
                if (!cardData.avgPrice || cardData.avgPrice === 0) {
                  const sum = sortedPrices.reduce((a, b) => a + b, 0);
                  cardData.avgPrice = Math.round(sum / sortedPrices.length);
                }
                if (!cardData.lastPrice || cardData.lastPrice === 0) {
                  cardData.lastPrice = listingPrices[0];
                }
              }

              // Absence totale de ventes confirmée
              const isZeroSales = (
                marketText.toLowerCase().includes('aucune vente') ||
                marketText.toLowerCase().includes('0 vente') ||
                marketText.toLowerCase().includes('pas de données') ||
                marketText.toLowerCase().includes('pas de vente')
              );

              if (isZeroSales && !cardData.avgPrice) {
                cardData.avgPrice = 0;
                cardData.minPrice = 0;
                cardData.maxPrice = 0;
                cardData.lastPrice = 0;
              }

              finishInspection();
            }
          } catch (e) {
            console.warn("Notice: Parsing marché error", e);
            finishInspection();
          }
        }, 60);
        return;
      }

      if (openAttempts > 10) {
        if (pollModal) { clearInterval(pollModal); pollModal = null; }
        finishInspection();
      }
    }, 45);
  }

  // ==========================================================================
  // 5. CIBLAGE DOM & DÉTECTION DES CARTES (Issu de l'ancienne extension)
  // ==========================================================================

  function getVisibleCardTitleElement() {
    try {
      const titleCandidates = document.querySelectorAll('h3.text-base, div[class*="top-[45%]"] h3, .card h3, div[class*="glow-"] h3, h3');
      for (let i = 0; i < titleCandidates.length; i++) {
        const candidate = titleCandidates[i];
        if (candidate && candidate.offsetParent !== null) {
          if (candidate.closest('.card-frame.animate-fade-in-up, [role="dialog"], div.fixed.inset-0, div.fixed.inset-0.z-50')) {
            continue;
          }
          const txt = (candidate.innerText || candidate.textContent || '').trim();
          if (txt && isValidCardName(txt)) {
            return { element: candidate, text: txt };
          }
        }
      }
    } catch (e) {
      console.warn("Notice: getVisibleCardTitleElement error", e);
    }
    return null;
  }

  function getRarityFromBadge(cardContainer) {
    try {
      const badges = (cardContainer || document).querySelectorAll(
        'div[style*="--color-rarity-"], .absolute.top-2.left-2, [class*="rounded-md"][class*="font-bold"], [class*="glow-"]'
      );

      for (let i = 0; i < badges.length; i++) {
        const b = badges[i];
        const rawText = (b.innerText || b.textContent || '').trim().toLowerCase();
        if (RARITY_MAP[rawText]) {
          return normalizeRarity(rawText);
        }

        const styleAttr = (b.getAttribute('style') || '').toLowerCase();
        if (styleAttr.includes('--color-rarity-l')) return 'L';
        if (styleAttr.includes('--color-rarity-ur')) return 'UR';
        if (styleAttr.includes('--color-rarity-sr')) return 'SR';
        if (styleAttr.includes('--color-rarity-r')) return 'R';
        if (styleAttr.includes('--color-rarity-pc')) return 'PC';
        if (styleAttr.includes('--color-rarity-c')) return 'C';
      }

      if (cardContainer) {
        const matchGlow = (cardContainer.className || '').match(/\bglow-([a-z]+)\b/i);
        if (matchGlow && matchGlow[1]) {
          return normalizeRarity(matchGlow[1]);
        }
      }
    } catch (_) {}

    return 'C';
  }

  function extractCardData(titleElement, detectedRarity) {
    const bottomBox = titleElement.closest('div[class*="top-[45%"]') || titleElement.parentElement;
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

      if (imageUrl) {
        if (imageUrl.startsWith('//')) {
          imageUrl = window.location.protocol + imageUrl;
        } else if (imageUrl.startsWith('/')) {
          imageUrl = window.location.origin + imageUrl;
        }
      }
    }

    let attack = null;
    let defense = null;
    if (bottomBox) {
      const swordsEl = bottomBox.querySelector('.lucide-swords, svg[class*="swords"]');
      if (swordsEl && swordsEl.parentElement) {
        const num = swordsEl.parentElement.textContent.replace(/[^0-9]/g, '');
        if (num) attack = parseInt(num, 10);
      }
      const shieldEl = bottomBox.querySelector('.lucide-shield, svg[class*="shield"]');
      if (shieldEl && shieldEl.parentElement) {
        const num = shieldEl.parentElement.textContent.replace(/[^0-9]/g, '');
        if (num) defense = parseInt(num, 10);
      }
    }

    return {
      name,
      rarity: detectedRarity,
      description,
      imageUrl,
      attack,
      defense,
      lastPrice: 0,
      minPrice: 0,
      avgPrice: 0,
      maxPrice: 0,
      suggestedPrice: 0
    };
  }

  // ==========================================================================
  // 6. GESTION DES NOTIFICATIONS TOASTS & STOCKAGE
  // ==========================================================================

  let currentSessionId = `booster_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  let lastProcessedCardName = '';
  const recentCardFingerprints = new Map();
  const seenCardsInCurrentPack = new Set();
  const localMarketCache = {};
  const activeToastTimers = new Map();

  function isPullsPage() {
    const path = window.location.pathname || '';
    return path === '/pulls' || path.startsWith('/pulls');
  }

  // Styles CSS pour les notifications toasts
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    @keyframes wikilogixSlideIn {
      from { opacity: 0; transform: translateX(50px) scale(0.95); }
      to { opacity: 1; transform: translateX(0) scale(1); }
    }
    @keyframes wikilogixPulseGold {
      0% { transform: scale(1); filter: brightness(1); }
      50% { transform: scale(1.15); filter: brightness(1.4) drop-shadow(0 0 12px #ffe144); }
      100% { transform: scale(1); filter: brightness(1); }
    }
    .wikilogix-toast-item {
      background: linear-gradient(135deg, rgba(9, 13, 22, 0.97) 0%, rgba(26, 32, 53, 0.97) 100%);
      backdrop-filter: blur(14px);
      color: #ffffff;
      padding: 12px 16px;
      border-radius: 12px;
      box-shadow: 0 12px 35px rgba(0, 0, 0, 0.85);
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 310px;
      max-width: 390px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      animation: wikilogixSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      transition: all 0.35s ease;
      pointer-events: auto;
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
        flex-direction: column;
        gap: 8px;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }
    return container;
  }

  function getToastDomId(cardName) {
    return `wikilogix-toast-${encodeURIComponent((cardName || '').trim().toLowerCase())}`;
  }

  function showInPageToast(card, meta) {
    if (!isValidCardName(card.name)) return;

    const container = getOrCreateToastContainer();
    const toastId = getToastDomId(card.name);

    let toast = document.getElementById(toastId);
    if (!toast) {
      toast = document.createElement('div');
      toast.id = toastId;
      toast.className = 'wikilogix-toast-item';
      container.appendChild(toast);
    }

    toast.style.border = `1px solid ${meta.border}`;
    toast.style.boxShadow = `0 10px 25px -5px rgba(0, 0, 0, 0.75), 0 0 14px ${meta.border}55`;

    const priceText = meta.avgPrice > 0
      ? `🪙 ${meta.avgPrice.toLocaleString('fr-FR')}`
      : (card.hasScannedMarket ? `0 🪙` : `Recherche du cours...`);

    const resaleText = meta.avgPrice > 0
      ? `🪙 ${meta.sellMin.toLocaleString('fr-FR')} - ${meta.sellMax.toLocaleString('fr-FR')}`
      : (card.hasScannedMarket ? `0 🪙` : `En attente...`);

    toast.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="background: ${meta.color}; color: ${meta.textColor}; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 5px;">
            ${meta.shortCode} - ${meta.label}
          </span>
        </div>
        <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">Carte ${card.cardIndex}/${card.totalInBooster}</span>
      </div>

      <div style="font-size: 14px; font-weight: 700; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px;">
        ${card.name}
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.45); padding: 7px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); margin-top: 2px;">
        <div style="display: flex; flex-direction: column;">
          <span style="font-size: 9px; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Prix Moyen</span>
          <span class="wikilogix-toast-price" style="font-size: 12px; font-weight: 800; color: #ffe144;">${priceText}</span>
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-end;">
          <span style="font-size: 9px; color: #34d399; font-weight: 700; text-transform: uppercase;">Conseil Revente (50-75%)</span>
          <span class="wikilogix-toast-resale" style="font-size: 12px; font-weight: 800; color: #34d399;">${resaleText}</span>
        </div>
      </div>
    `;

    if (activeToastTimers.has(toastId)) {
      clearTimeout(activeToastTimers.get(toastId));
    }

    const timer = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => {
        toast.remove();
        activeToastTimers.delete(toastId);
      }, 350);
    }, meta.isRealMarketPrice ? 5000 : 7000);

    activeToastTimers.set(toastId, timer);
  }

  function updateToastWithDiscoveredPrice(cardName, marketPayload) {
    if (!isValidCardName(cardName)) return;

    const cleanName = cardName.trim();
    const toastId = getToastDomId(cleanName);
    const toast = document.getElementById(toastId);

    const numPrice = Number(marketPayload.avgPrice) > 0 ? Number(marketPayload.avgPrice) : 0;
    const sellMin = Math.round(numPrice * 0.50);
    const sellMax = Math.round(numPrice * 0.75);
    const isReal = numPrice > 0;

    if (toast) {
      const priceEl = toast.querySelector('.wikilogix-toast-price');
      const resaleEl = toast.querySelector('.wikilogix-toast-resale');

      if (priceEl) {
        priceEl.innerHTML = `<span class="wikilogix-price-highlight">${isReal ? `🪙 ${numPrice.toLocaleString('fr-FR')}` : `0 🪙`}</span>`;
      }
      if (resaleEl) {
        resaleEl.innerHTML = `<span class="wikilogix-price-highlight" style="color:#34d399;">${isReal ? `🪙 ${sellMin.toLocaleString('fr-FR')} - ${sellMax.toLocaleString('fr-FR')}` : `0 🪙`}</span>`;
      }

      if (activeToastTimers.has(toastId)) {
        clearTimeout(activeToastTimers.get(toastId));
      }

      const newTimer = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => {
          toast.remove();
          activeToastTimers.delete(toastId);
        }, 350);
      }, 5000);

      activeToastTimers.set(toastId, newTimer);
    }
  }

  async function syncMarketPriceToStorage(cardName, marketPayload) {
    if (!isValidCardName(cardName) || typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return;

    try {
      const res = await new Promise((r) => chrome.storage.local.get(['wikilogix_market_prices_cache', 'wikilogix_cards_history', 'wikilogix_boosters_history'], r));
      const cache = res.wikilogix_market_prices_cache || {};
      let cards = (res.wikilogix_cards_history || []).filter((c) => isValidCardName(c.name));
      let boosters = res.wikilogix_boosters_history || [];

      const cleanName = cardName.trim();
      const numPrice = Number(marketPayload.avgPrice) > 0 ? Number(marketPayload.avgPrice) : 0;
      const sellMin = Math.round(numPrice * 0.50);
      const sellMax = Math.round(numPrice * 0.75);

      cache[cleanName.toLowerCase()] = {
        cardName: cleanName,
        avgPrice: numPrice,
        minPrice: marketPayload.minPrice || (numPrice > 0 ? numPrice : 0),
        maxPrice: marketPayload.maxPrice || (numPrice > 0 ? numPrice : 0),
        lastPrice: marketPayload.lastPrice || (numPrice > 0 ? numPrice : 0),
        salesCount: marketPayload.salesCount || (numPrice > 0 ? 1 : 0),
        hasRealMarketPrice: numPrice > 0
      };

      let updatedCount = 0;
      cards.forEach((c) => {
        if (c.name && c.name.trim().toLowerCase() === cleanName.toLowerCase()) {
          c.avgPrice = numPrice;
          c.sellPriceMin = sellMin;
          c.sellPriceMax = sellMax;
          c.minPrice = marketPayload.minPrice || (numPrice > 0 ? numPrice : 0);
          c.maxPrice = marketPayload.maxPrice || (numPrice > 0 ? numPrice : 0);
          c.lastPrice = marketPayload.lastPrice || (numPrice > 0 ? numPrice : 0);
          c.salesCount = marketPayload.salesCount || (numPrice > 0 ? 1 : 0);
          c.hasRealMarketPrice = numPrice > 0;
          updatedCount++;
        }
      });

      boosters.forEach((b) => {
        if (Array.isArray(b.cards)) {
          b.cards = b.cards.filter((c) => isValidCardName(c.name));
          b.cards.forEach((c) => {
            if (c.name && c.name.trim().toLowerCase() === cleanName.toLowerCase()) {
              c.avgPrice = numPrice;
              c.sellPriceMin = sellMin;
              c.sellPriceMax = sellMax;
              c.minPrice = marketPayload.minPrice || (numPrice > 0 ? numPrice : 0);
              c.maxPrice = marketPayload.maxPrice || (numPrice > 0 ? numPrice : 0);
              c.lastPrice = marketPayload.lastPrice || (numPrice > 0 ? numPrice : 0);
              c.salesCount = marketPayload.salesCount || (numPrice > 0 ? 1 : 0);
              c.hasRealMarketPrice = numPrice > 0;
            }
          });
        }
      });

      await new Promise((r) => chrome.storage.local.set({
        wikilogix_market_prices_cache: cache,
        wikilogix_cards_history: cards,
        wikilogix_boosters_history: boosters
      }, r));

      console.log(`%c[WikiLogix] ⚡ Cours réel synchronisé : ${cleanName} = ${numPrice} 🪙 (${updatedCount} cartes mises à jour)`, 'color: #fa9931; font-weight: bold;');
    } catch (err) {
      console.warn('[WikiLogix] Erreur synchronisation marché :', err);
    }
  }

  async function persistCardToStorage(cardData) {
    if (!cardData || !isValidCardName(cardData.name)) return;

    try {
      const cleanName = cardData.name.trim();
      const normRarity = normalizeRarity(cardData.rarity);
      const now = Date.now();

      const res = await new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.get(
            ['wikilogix_boosters_history', 'wikilogix_cards_history', 'wikilogix_active_booster_session', 'wikilogix_market_prices_cache'],
            resolve
          );
        } else {
          resolve({});
        }
      });

      let boosters = res.wikilogix_boosters_history || [];
      let cards = (res.wikilogix_cards_history || []).filter((c) => isValidCardName(c.name));
      const marketCache = res.wikilogix_market_prices_cache || {};
      let activeSession = res.wikilogix_active_booster_session || null;

      const cachedMarket = marketCache[cleanName.toLowerCase()] || marketCache[`${cleanName.toLowerCase()}__${normRarity}`];
      const realPrice = cachedMarket ? (cachedMarket.avgPrice || cachedMarket.price || 0) : (Number(cardData.avgPrice) > 0 ? Number(cardData.avgPrice) : 0);
      const meta = getRarityMeta(normRarity, realPrice);

      const cardIndex = parseInt(cardData.cardIndex, 10) || 1;
      const totalInBooster = parseInt(cardData.totalInBooster, 10) || 5;
      const sessionId = cardData.sessionId || `session_${now}`;

      let shouldCreateNewBooster = false;
      if (!activeSession) {
        shouldCreateNewBooster = true;
      } else if (sessionId && activeSession.sessionId && sessionId !== activeSession.sessionId) {
        shouldCreateNewBooster = true;
      } else if (activeSession.cards && activeSession.cards.length >= totalInBooster && cardIndex === 1) {
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
        rawRarity: cardData.rarity || 'C',
        rarity: normRarity,
        rarityLabel: meta.label,
        rarityShortCode: meta.shortCode,
        rarityColor: meta.color,
        cardIndex: cardIndex,
        totalInBooster: totalInBooster,
        description: cardData.description || '',
        attack: cardData.attack || null,
        defense: cardData.defense || null,
        image: cardData.imageUrl || cardData.image || null,
        avgPrice: meta.avgPrice,
        sellPriceMin: meta.sellMin,
        sellPriceMax: meta.sellMax,
        sellPriceMid: Math.round(meta.avgPrice * 0.625),
        minPrice: cachedMarket?.minPrice || (meta.avgPrice > 0 ? meta.avgPrice : 0),
        maxPrice: cachedMarket?.maxPrice || (meta.avgPrice > 0 ? meta.avgPrice : 0),
        lastPrice: cachedMarket?.lastPrice || (meta.avgPrice > 0 ? meta.avgPrice : 0),
        salesCount: cachedMarket?.salesCount || (meta.avgPrice > 0 ? 1 : 0),
        hasRealMarketPrice: meta.isRealMarketPrice,
        timestamp: now
      };

      activeSession.cards.push(cardRecord);
      cards.push(cardRecord);

      const bIndex = boosters.findIndex((b) => b.id === activeSession.id);
      if (bIndex !== -1) {
        boosters[bIndex] = activeSession;
      }

      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await new Promise((resolve) => {
          chrome.storage.local.set(
            {
              wikilogix_boosters_history: boosters,
              wikilogix_cards_history: cards,
              wikilogix_active_booster_session: activeSession
            },
            resolve
          );
        });
        console.log(
          `%c[WikiLogix] 🎴 Carte enregistrée : ${cleanName} [${normRarity}] (Prix: ${meta.avgPrice} 🪙)`,
          'color: #10b981; font-weight: bold;'
        );
      }
    } catch (err) {
      console.error('[WikiLogix Storage] Erreur sauvegarde :', err);
    }
  }

  // Clic sur Ouvrir un paquet
  document.addEventListener('click', (event) => {
    if (!isPullsPage()) return;
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const btn = target.closest('button, [role="button"], a');
    if (btn) {
      const hasPackImg = btn.querySelector('img[alt*="paquet"], img[src*="card_pack"]');
      const txt = (btn.textContent || '').toLowerCase();
      const hasOpenText = (txt.includes('ouvrir') || txt.includes('booster')) && !txt.includes('marché') && !txt.includes('boutique');
      if (hasPackImg || hasOpenText) {
        currentSessionId = `booster_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        seenCardsInCurrentPack.clear();
        lastProcessedCardName = '';
        console.log('%c[WikiLogix] Nouveau booster ouvert ! Session :', 'color: #6366f1; font-weight: bold;', currentSessionId);
      }
    }
  }, true);

  // ==========================================================================
  // 7. BOUCLE CENTRALE DE DÉTECTION ET INSPECTION
  // ==========================================================================

  function checkAndProcessVisibleCard() {
    if (!isPullsPage() || isProcessingCardInspection) return;

    try {
      const visible = getVisibleCardTitleElement();
      if (!visible) return;

      const { element: titleEl, text: cardName } = visible;
      const now = Date.now();

      // Vérification anti-doublon (10 secondes)
      const lastSeen = recentCardFingerprints.get(cardName) || 0;
      if (seenCardsInCurrentPack.has(cardName) || (now - lastSeen < 10000 && cardName === lastProcessedCardName)) {
        return;
      }

      const bottomBox = titleEl.closest('div[class*="top-[45%"]') || titleEl.parentElement;
      const cardContainer = bottomBox?.parentElement?.closest('div.glow-c, div.glow-pc, div.glow-r, div.glow-sr, div.glow-ur, div.glow-l, div.w-72') || titleEl.closest('div.glow-c, div.glow-pc, div.glow-r, div.glow-sr, div.glow-ur, div.glow-l, div.w-72') || titleEl;

      const normRarity = getRarityFromBadge(cardContainer);
      const extracted = extractCardData(titleEl, normRarity);

      // Compteur de carte dans le booster
      let cardIndex = seenCardsInCurrentPack.size + 1;
      let totalInBooster = 5;
      const allSpansAndDivs = document.querySelectorAll('div, span, p');
      for (const el of allSpansAndDivs) {
        if (el.children.length === 0) {
          const txt = (el.textContent || '').trim();
          const m = txt.match(/(?:Carte\s*)?(\d+)\s*\/\s*(\d+)/i);
          if (m && parseInt(m[2], 10) >= 3 && parseInt(m[2], 10) <= 10) {
            cardIndex = parseInt(m[1], 10);
            totalInBooster = parseInt(m[2], 10);
            break;
          }
        }
      }

      // Verrouillage de la carte
      seenCardsInCurrentPack.add(cardName);
      recentCardFingerprints.set(cardName, now);
      lastProcessedCardName = cardName;

      const cachedMarket = localMarketCache[cardName.toLowerCase()];
      const knownPrice = cachedMarket ? (cachedMarket.avgPrice || 0) : 0;
      const meta = getRarityMeta(normRarity, knownPrice);

      const cardPayload = {
        name: cardName,
        rarity: normRarity,
        cardIndex,
        totalInBooster,
        attack: extracted.attack,
        defense: extracted.defense,
        description: extracted.description,
        imageUrl: extracted.imageUrl,
        avgPrice: meta.avgPrice,
        sellPriceMin: meta.sellMin,
        sellPriceMax: meta.sellMax,
        minPrice: cachedMarket?.minPrice || (meta.avgPrice > 0 ? meta.avgPrice : 0),
        maxPrice: cachedMarket?.maxPrice || (meta.avgPrice > 0 ? meta.avgPrice : 0),
        lastPrice: cachedMarket?.lastPrice || (meta.avgPrice > 0 ? meta.avgPrice : 0),
        salesCount: cachedMarket?.salesCount || (meta.avgPrice > 0 ? 1 : 0),
        hasRealMarketPrice: meta.isRealMarketPrice,
        hasScannedMarket: !!cachedMarket,
        sessionId: currentSessionId,
        url: window.location.href,
        timestamp: now
      };

      showInPageToast(cardPayload, meta);
      persistCardToStorage(cardPayload);

      // Lancement de l'inspection silencieuse si prix non encore scanné
      if (!cachedMarket || cachedMarket.avgPrice === undefined) {
        isProcessingCardInspection = true;
        console.log(`%c[WikiLogix] ⚡ Inspection silencieuse de la carte : ${cardName}`, 'color: #8b5cf6; font-weight: bold;');

        inspectCardPricesStealth(cardContainer, { name: cardName, rarity: normRarity }, (results) => {
          const discoveredPrice = Number(results.avgPrice) > 0 ? Number(results.avgPrice) : 0;
          const marketPayload = {
            cardName: cardName,
            rarity: normRarity,
            avgPrice: discoveredPrice,
            minPrice: Number(results.minPrice) || discoveredPrice,
            maxPrice: Number(results.maxPrice) || discoveredPrice,
            lastPrice: Number(results.lastPrice) || discoveredPrice,
            salesCount: discoveredPrice > 0 ? 1 : 0,
            hasRealMarketPrice: discoveredPrice > 0
          };

          localMarketCache[cardName.toLowerCase()] = marketPayload;
          syncMarketPriceToStorage(cardName, marketPayload);
          updateToastWithDiscoveredPrice(cardName, marketPayload);

          // Notification Discord filtrée
          try {
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
              chrome.runtime.sendMessage({
                type: 'SEND_DISCORD_NOTIFICATION',
                payload: {
                  ...cardPayload,
                  avgPrice: discoveredPrice,
                  minPrice: marketPayload.minPrice,
                  maxPrice: marketPayload.maxPrice,
                  lastPrice: marketPayload.lastPrice,
                  hasRealMarketPrice: marketPayload.hasRealMarketPrice
                }
              });
            }
          } catch (_) {}
        });
      } else {
        // Déjà en cache : notification Discord immédiate
        try {
          if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({
              type: 'SEND_DISCORD_NOTIFICATION',
              payload: cardPayload
            });
          }
        } catch (_) {}
      }

    } catch (err) {
      console.warn("Notice: checkAndProcessVisibleCard error :", err);
      isProcessingCardInspection = false;
    }
  }

  // Observation continue du DOM
  const domObserver = new MutationObserver(() => {
    checkAndProcessVisibleCard();
  });

  domObserver.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true
  });

  setInterval(checkAndProcessVisibleCard, 100);
  checkAndProcessVisibleCard();

  window.addEventListener('popstate', () => {
    setTimeout(checkAndProcessVisibleCard, 50);
  });

})();

