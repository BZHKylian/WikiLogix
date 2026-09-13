// ============================================================================
// WikiMasters Auto-Booster Pro — Content Script v3.3 (Anti-Spam & 24/7 Shield)
// ============================================================================

(function () {
  'use strict';

  // --- ÉTAT DU BOT & VERROUS DE CONTRÔLE MUTEX ---
  let isBotActive = false;
  let loopTimeout = null;
  let sessionTimeout = null;
  let breakWatchdogTimeout = null;
  let inspectionWatchdog = null;
  let globalWatchdogTimer = null;
  let periodicReloadTimer = null;

  // Verrous d'état opérationnels stricts
  let isTransitioning = false;
  let isProcessingCardInspection = false;
  let isWaitingToOpenBooster = false;
  let isHandlingCaptcha = false;
  let isReloadPendingAfterPack = false;

  // Timestamps & Métriques de surveillance
  let lastBoosterOpenedTime = 0;
  let breakCycleCount = 0;
  let lastActivityTimestamp = Date.now();
  let lastActivityDescription = "Initialisation";
  let consecutiveStallsCount = 0;
  let cardsPulledSinceLastPurge = 0;

  // Rechargement préventif périodique (Toutes les 1h30 = 90 minutes)
  const PREVENTIVE_RELOAD_INTERVAL_MS = 90 * 60 * 1000;
  let nextScheduledReloadTimestamp = Date.now() + PREVENTIVE_RELOAD_INTERVAL_MS;

  // Gestion des sessions & pauses
  let isPausedForBreak = false;
  let isBreakPending = false;
  let currentSessionEnd = 0;
  let nextBreakDurationMin = 0;

  // --- SYSTÈME FINGERPRINT & ANTI-DOUBLON (MUTEX 10 SECONDES) ---
  let lastProcessedCardElement = null;
  let lastProcessedCardText = '';
  let lastCardProcessedTimestamp = 0;
  const recentCardFingerprints = new Map(); // Map: cardName -> timestamp
  const seenCardsInCurrentPack = new Set();  // Set: cardNames in current booster

  // Caches mémoire locaux pour limiter les I/O de stockage
  let totalPacksCountCache = 0;
  let totalCardsCountCache = 0;
  let rarityCountsCache = {
    'Commune': 0, 'Peu commune': 0, 'Rare': 0,
    'Super rare': 0, 'Ultra rare': 0, 'Légendaire': 0
  };
  let pulledCardsHistoryCache = [];
  let currentBotLiveStatus = "Bot en veille";

  // Statistiques du cycle courant
  let cycleStats = {
    packsOpened: 0,
    cardsPulled: 0,
    rarityCounts: {
      'Commune': 0, 'Peu commune': 0, 'Rare': 0,
      'Super rare': 0, 'Ultra rare': 0, 'Légendaire': 0
    },
    cards: []
  };

  // Statistiques cumulées de la session
  let totalSessionStats = {
    packsOpened: 0,
    cardsPulled: 0,
    rarityCounts: {
      'Commune': 0, 'Peu commune': 0, 'Rare': 0,
      'Super rare': 0, 'Ultra rare': 0, 'Légendaire': 0
    },
    cards: []
  };

  // Configuration par défaut
  let config = {
    minClickDelay: 1500,
    maxClickDelay: 2200,
    minBoosterWaitSec: 2.0,
    maxBoosterWaitSec: 4.0,
    humanCyclesEnabled: true,
    minActiveMin: 3,
    maxActiveMin: 5,
    minBreakMin: 10,
    maxBreakMin: 30,
    discordWebhookUrl: '',
    discordUserId: '',
    pauseThreadId: '',
    targetCardsList: ['Adèle Castillon'],
    rarityRoutingEnabled: true,
    priceRoutingEnabled: true,
    rarityThreads: {
      'Légendaire': '',
      'Ultra rare': '',
      'Super rare': '',
      'Rare': '',
      'Peu commune': '',
      'Commune': ''
    },
    priceThreads: {
      'tier_1000_plus': '',
      'tier_250_1000': '',
      'tier_100_250': '',
      'tier_50_100': '',
      'tier_0_50': ''
    }
  };

  const RARITY_MAP = {
    'c': 'Commune',
    'pc': 'Peu commune',
    'r': 'Rare',
    'sr': 'Super rare',
    'ur': 'Ultra rare',
    'l': 'Légendaire'
  };

  const IGNORED_TEXTS = new Set([
    'ouvrir', 'booster', 'pack', 'continuer', 'terminer', 'valider', 'fermer', 
    'stats', 'inventaire', 'collection', 'suivant', 'precedent', 'retour',
    'points', 'prix', 'edition', 'wiki', 'masters', 'carte', 'boutique', 'acheter', 'shop', 'wikibidous', 'zevent'
  ]);

  // Regex pré-compilées ultra-optimisées
  const RE_K = /([\d.,]+)\s*k\b/i;
  const RE_NUM = /^\d+(?:[.,\s\u00a0\u202f]\d{3})*(?:[.,]\d+)?|\d+/;
  const RE_CLEAN_ALL_SPACES = /[\u00a0\u202f\u200b\s]+/g;
  const RE_CLEAN_DOTS_SPACES = /[\s\u00a0\u202f.]/g;

  const RE_LAST = /(?:derni[eè]re?\s+(?:vente|prix)|dernier)[^\d\n\r]*([\d\s\u00a0\u202f.,]+k?)/i;
  const RE_MIN  = /(?:prix\s+min(?:imum)?|min(?:imum)?\s*:|plus\s+bas|plancher|floor)[^\d\n\r]*([\d\s\u00a0\u202f.,]+k?)/i;
  const RE_AVG  = /(?:prix\s+moyen(?:ne)?|moyen(?:ne)?\s*:|m[eé]dian(?:ne)?)[^\d\n\r]*([\d\s\u00a0\u202f.,]+k?)/i;
  const RE_MAX  = /(?:prix\s+max(?:imum)?|max(?:imum)?\s*:|plus\s+haut)[^\d\n\r]*([\d\s\u00a0\u202f.,]+k?)/i;
  const RE_COIN_PRICE = /(?:([\d\s\u00a0\u202f.,]+k?)\s*🪙|🪙\s*([\d\s\u00a0\u202f.,]+k?))/i;

  // AudioContext singleton
  let cachedAudioCtx = null;

  // ==========================================================================
  // 1. UTILITAIRES DE BASE & FILTRES DE SÉCURITÉ DOM
  // ==========================================================================

  function isPullsPage() {
    try {
      const path = window.location.pathname.toLowerCase();
      return path.startsWith('/pulls') || path === '/pulls';
    } catch (_) {
      return false;
    }
  }

  function getRandomFloat(min, max) {
    if (min > max) { const tmp = min; min = max; max = tmp; }
    return Math.random() * (max - min) + min;
  }

  function getRandomInt(min, max) {
    return Math.round(getRandomFloat(min, max));
  }

  function markActivity(description) {
    lastActivityTimestamp = Date.now();
    lastActivityDescription = description || "Activité en cours";
  }

  // --- FILTRE DE BLOCAGE ABSOLU DU BOUTON ZEVENT ---
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

      if (el.querySelector && el.querySelector('.zv-pulse, [class*="zv-pulse"], [aria-label*="ZEVENT" i], [title*="ZEVENT" i]')) {
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
  // 2. PARSING DE PRIX ROBUSTE & ULTRA-RAPIDE
  // ==========================================================================

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

  function setBotLiveStatus(statusText) {
    try {
      if (currentBotLiveStatus === statusText) return;
      currentBotLiveStatus = statusText;
      chrome.storage.local.set({
        botLiveStatus: {
          text: statusText,
          timestamp: Date.now()
        }
      });
    } catch (e) {
      console.warn("Notice: setBotLiveStatus error", e);
    }
  }

  // ==========================================================================
  // 3. SYNTHÈSE AUDIO WEB AUDIO API (SANS FUITE MÉMOIRE)
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

      if (soundType === 'legendary') {
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
      } else if (soundType === 'ultra') {
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
      } else if (soundType === 'super_rare') {
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
  // 4. CLIC DE POINTEUR FORCÉ & SÉCURISÉ
  // ==========================================================================

  function forceClickElement(el) {
    if (!el || !(el instanceof Element)) return false;
    
    // Verrou de sécurité absolu ZEVENT
    if (isZeventElement(el)) {
      console.warn("🚫 [Sécurité ZEVENT] Interdiction formelle de cliquer : Clic bloqué sur l'élément ZEVENT.");
      return false;
    }

    try {
      const rect = el.getBoundingClientRect();
      const offsetX = (rect.width > 0 ? rect.width : 20) * getRandomFloat(0.3, 0.7);
      const offsetY = (rect.height > 0 ? rect.height : 20) * getRandomFloat(0.3, 0.7);
      
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

  const clickElement = forceClickElement;

  // ==========================================================================
  // 5. CIBLAGE PRÉCIS DES ÉLÉMENTS DOM
  // ==========================================================================

  function findNextArrowButton() {
    try {
      const rightArrowSvg = document.querySelector(
        'svg polyline[points="9 18 15 12 9 6"], ' +
        'svg polyline[points="9 6 15 12 9 18"], ' +
        'svg[class*="lucide-chevron-right"], ' +
        'svg[class*="chevron-right"], ' +
        'svg[class*="arrow-right"], ' +
        'svg path[d*="M9 5l7 7-7 7"], ' +
        'svg path[d*="m9 18 6-6-6-6"], ' +
        'svg path[d*="m9 6 6 6-6 6"]'
      );
      if (rightArrowSvg) {
        const btn = rightArrowSvg.closest('button, [role="button"], a, div');
        if (btn && !btn.disabled && !btn.hasAttribute('disabled') && btn.offsetParent !== null && !isHeaderOrWalletElement(btn) && !isCurrencyOrShopElement(btn) && !isZeventElement(btn)) {
          return btn;
        }
      }

      const ariaBtn = document.querySelector(
        'button[aria-label*="suivant" i], button[aria-label*="next" i], button[aria-label*="droite" i], ' +
        'button[class*="next" i], button[class*="arrow-right" i]'
      );
      if (ariaBtn && !ariaBtn.disabled && !ariaBtn.hasAttribute('disabled') && ariaBtn.offsetParent !== null && !isHeaderOrWalletElement(ariaBtn) && !isCurrencyOrShopElement(ariaBtn) && !isZeventElement(ariaBtn)) {
        return ariaBtn;
      }

      const roundButtons = Array.from(document.querySelectorAll('button.w-12.rounded-full:not([disabled]), button[class*="rounded-full"]:not([disabled])'))
        .filter(b => b.offsetParent !== null && !b.hasAttribute('disabled') && !isHeaderOrWalletElement(b) && !isCurrencyOrShopElement(b) && !isZeventElement(b));

      if (roundButtons.length > 0) {
        roundButtons.sort((a, b) => b.getBoundingClientRect().left - a.getBoundingClientRect().left);
        const rightmost = roundButtons[0];
        if (!rightmost.querySelector('svg polyline[points="15 18 9 12 15 6"]') && !isZeventElement(rightmost)) {
          return rightmost;
        }
      }
    } catch (e) {
      console.warn("Notice: findNextArrowButton error", e);
    }
    return null;
  }

  function findFinishPackButton() {
    try {
      const allButtons = Array.from(document.querySelectorAll('button, div[role="button"], a'));
      return allButtons.find(b => {
        if (b.disabled || b.hasAttribute('disabled') || b.offsetParent === null) return false;
        if (isHeaderOrWalletElement(b) || isCurrencyOrShopElement(b) || isZeventElement(b)) return false;

        const txt = (b.innerText || b.textContent || '').trim().toLowerCase();
        const aria = (b.getAttribute('aria-label') || '').toLowerCase();
        const isFinishText = (
          txt.includes('terminer') ||
          txt.includes('valider') ||
          txt.includes('continuer') ||
          txt.includes('fermer') ||
          aria.includes('terminer') ||
          aria.includes('valider') ||
          aria.includes('continuer') ||
          aria.includes('fermer')
        );
        return isFinishText && !txt.includes('marché') && !txt.includes('booster') && !txt.includes('ouvrir') && !txt.includes('boutique') && !txt.includes('shop') && !txt.includes('zevent') && !aria.includes('zevent');
      });
    } catch (e) {
      return null;
    }
  }

  function findOpenBoosterButton() {
    try {
      const packImgs = document.querySelectorAll('img[alt="Ouvrir un paquet" i], img[src*="card_pack.png" i], img[src*="card_pack" i]');
      for (let i = 0; i < packImgs.length; i++) {
        const packImg = packImgs[i];
        if (isZeventElement(packImg)) continue;
        const btn = packImg.closest('button, div[role="button"], a');
        if (btn && !btn.disabled && !btn.hasAttribute('disabled') && !isHeaderOrWalletElement(btn) && !isCurrencyOrShopElement(btn) && !isZeventElement(btn)) {
          return btn;
        }
      }

      const buttons = Array.from(document.querySelectorAll('button, div[role="button"], a')).filter(el => {
        if (el.disabled || el.hasAttribute('disabled') || el.offsetParent === null) return false;
        if (isHeaderOrWalletElement(el) || isCurrencyOrShopElement(el) || isZeventElement(el)) return false;

        const title = (el.getAttribute('title') || el.title || '').toLowerCase();
        const aria = (el.getAttribute('aria-label') || '').toLowerCase();
        const text = (el.innerText || el.textContent || '').trim().toLowerCase();

        if (title.includes('boutique') || aria.includes('boutique') || text.includes('boutique') ||
            text.includes('wikibidou') || text.includes('marché') || text.includes('acheter') || text.includes('vente') || text.includes('fermer') ||
            title.includes('zevent') || aria.includes('zevent') || text.includes('zevent') || el.classList.contains('zv-pulse')) {
          return false;
        }

        return text === 'ouvrir' || text === 'ouvrir un paquet' || text === 'ouvrir un booster' || 
               aria === 'ouvrir' || aria === 'ouvrir un paquet' || aria.includes('ouvrir');
      });

      return buttons[0] || null;
    } catch (e) {
      return null;
    }
  }

  const findBoosterOpenButton = findOpenBoosterButton;

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

  function getVisibleCardTitleElement() {
    try {
      const titleCandidates = document.querySelectorAll('h3.text-base, div[class*="top-[45%]"] h3, .card h3, div[class*="glow-"] h3, h3');
      for (let i = 0; i < titleCandidates.length; i++) {
        const candidate = titleCandidates[i];
        if (candidate && candidate.offsetParent !== null && !isHeaderOrWalletElement(candidate) && !isCurrencyOrShopElement(candidate) && !isZeventElement(candidate)) {
          const txt = (candidate.innerText || candidate.textContent || '').trim();
          if (txt && !isIgnoredTitle(txt)) {
            return { element: candidate, text: txt };
          }
        }
      }
    } catch (e) {
      console.warn("Notice: getVisibleCardTitleElement error", e);
    }
    return null;
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

    return {
      name,
      rarity: detectedRarity,
      description,
      imageUrl,
      attack,
      defense,
      lastPrice: '',
      minPrice: '',
      avgPrice: '',
      maxPrice: '',
      suggestedPrice: 0
    };
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

  function forceCloseModal(modal) {
    if (!modal) return;
    try {
      const closeBtn = modal.querySelector('button[aria-label*="fermer" i], button[aria-label*="close" i], button:has(svg), svg[class*="lucide-x"]');
      if (closeBtn) {
        forceClickElement(closeBtn.closest('button') || closeBtn);
      } else {
        forceClickElement(modal);
      }
    } catch (_) {}
  }

  // ==========================================================================
  // 6. INSPECTION DES PRIX SANS IMPACT VISUEL & SANS REFLOW
  // ==========================================================================

  function ensureStealthStyle() {
    if (document.getElementById('wm-stealth-modal-style')) return;
    try {
      const stealthStyle = document.createElement('style');
      stealthStyle.id = 'wm-stealth-modal-style';
      stealthStyle.textContent = `
        div.fixed.inset-0.z-50.wm-inspecting,
        div.fixed.inset-0.z-50.wm-stealth-hidden,
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
        setBotLiveStatus(`💰 Consultation marché (${cardData.name})...`);

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

            const hasFoundRegexPrice = lastVal > 0 || minVal > 0 || avgVal > 0 || maxVal > 0;
            const hasFoundListingPrice = listingPrices.length > 0;

            if (hasFoundRegexPrice || hasFoundListingPrice || waitDataAttempts >= 10) {
              if (pollMarketData) { clearInterval(pollMarketData); pollMarketData = null; }

              if (lastVal > 0) cardData.lastPrice = String(lastVal);
              if (minVal > 0)  cardData.minPrice = String(minVal);
              if (avgVal > 0)  cardData.avgPrice = String(avgVal);
              if (maxVal > 0)  cardData.maxPrice = String(maxVal);

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

              const parsedMin = parseFloat(cardData.minPrice) || 0;
              const parsedAvg = parseFloat(cardData.avgPrice) || 0;
              const parsedLast = parseFloat(cardData.lastPrice) || 0;

              if (parsedMin > 0 && parsedAvg > 0) {
                if (parsedAvg > parsedMin * 2.5) {
                  cardData.suggestedPrice = Math.round(parsedMin * 1.15) || (parsedMin + 1);
                } else {
                  cardData.suggestedPrice = Math.round((parsedMin + parsedAvg) / 2);
                }
              } else {
                cardData.suggestedPrice = Math.round(parsedMin || parsedAvg || parsedLast || 0);
              }

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
  // 7. GESTION DES STATS, FINGERPRINTS & PURGE MÉMOIRE (500 CARTES)
  // ==========================================================================

  function performTargetedMemoryPurge() {
    try {
      cardsPulledSinceLastPurge = 0;
      
      // 1. Élagage du cache d'historique en mémoire vive (conservation des 200 dernières)
      if (pulledCardsHistoryCache.length > 200) {
        pulledCardsHistoryCache = pulledCardsHistoryCache.slice(-200);
      }

      // 2. Nettoyage des empreintes de cartes expirées (> 30s)
      const now = Date.now();
      for (const [cardName, timestamp] of recentCardFingerprints.entries()) {
        if (now - timestamp > 30000) {
          recentCardFingerprints.delete(cardName);
        }
      }

      // 3. Libération des références DOM orphelines
      lastProcessedCardElement = null;

      // 4. Réinitialisation des buffers audio inactifs
      if (cachedAudioCtx && cachedAudioCtx.state === 'running') {
        try {
          cachedAudioCtx.suspend();
        } catch (_) {}
      }

      // 5. Synchronisation sécurisée
      chrome.storage.local.set({
        pulledCardsHistory: pulledCardsHistoryCache,
        totalCardsCount: totalCardsCountCache,
        totalPacksCount: totalPacksCountCache,
        rarityCounts: rarityCountsCache
      });

      console.log(`🧹 [Mémoire] Purge ciblée effectuée (palier 500 cartes). Caches et références libérés.`);
    } catch (e) {
      console.warn("Notice: performTargetedMemoryPurge error", e);
    }
  }

  function recordPulledCard(detectedRarity, cardData) {
    try {
      cycleStats.cardsPulled++;
      cycleStats.rarityCounts[detectedRarity] = (cycleStats.rarityCounts[detectedRarity] || 0) + 1;
      cycleStats.cards.push(cardData);

      totalSessionStats.cardsPulled++;
      totalSessionStats.rarityCounts[detectedRarity] = (totalSessionStats.rarityCounts[detectedRarity] || 0) + 1;
      totalSessionStats.cards.push(cardData);

      totalCardsCountCache++;
      cardsPulledSinceLastPurge++;
      rarityCountsCache[detectedRarity] = (rarityCountsCache[detectedRarity] || 0) + 1;

      // Mémorisation de l'empreinte temporelle anti-doublon
      recentCardFingerprints.set(cardData.name, Date.now());

      pulledCardsHistoryCache.push({
        name: cardData.name,
        rarity: detectedRarity,
        imageUrl: cardData.imageUrl || '',
        lastPrice: cardData.lastPrice,
        minPrice: cardData.minPrice,
        avgPrice: cardData.avgPrice,
        maxPrice: cardData.maxPrice,
        suggestedPrice: cardData.suggestedPrice,
        date: new Date().toLocaleTimeString()
      });

      // Purge automatique toutes les 500 cartes
      if (cardsPulledSinceLastPurge >= 500) {
        performTargetedMemoryPurge();
      } else {
        if (pulledCardsHistoryCache.length > 500) {
          pulledCardsHistoryCache = pulledCardsHistoryCache.slice(-500);
        }
        chrome.storage.local.set({
          totalSessionStats,
          totalCardsCount: totalCardsCountCache,
          rarityCounts: rarityCountsCache,
          pulledCardsHistory: pulledCardsHistoryCache
        });
      }
    } catch (e) {
      console.error("Erreur recordPulledCard :", e);
    }
  }

  function recordPackOpened() {
    try {
      seenCardsInCurrentPack.clear();
      lastProcessedCardElement = null;
      lastProcessedCardText = '';
      lastCardProcessedTimestamp = 0;
      isTransitioning = false;

      cycleStats.packsOpened++;
      totalSessionStats.packsOpened++;
      totalPacksCountCache++;

      chrome.storage.local.set({
        totalSessionStats,
        totalPacksCount: totalPacksCountCache
      });
    } catch (e) {
      console.error("Erreur recordPackOpened :", e);
    }
  }

  // ==========================================================================
  // 8. TRAITEMENT CENTRALISÉ D'UNE CARTE AVEC VERROU MUTEX & ANTI-DOUBLON
  // ==========================================================================

  function processDetectedCard(candidate) {
    if (!isPullsPage() || isHandlingCaptcha || isProcessingCardInspection || isZeventElement(candidate)) return;

    try {
      const txt = (candidate.innerText || candidate.textContent || '').trim();
      if (!txt || isIgnoredTitle(txt) || txt.toUpperCase().includes('ZEVENT')) return;

      const now = Date.now();

      // --- VÉRIFICATION DU VERROU ANTI-SPAM / ANTI-DOUBLON (MUTEX 10s) ---
      // 1. Déjà inspecté dans ce même paquet ?
      const alreadyInCurrentPack = seenCardsInCurrentPack.has(txt);
      
      // 2. Déjà inspecté et enregistré il y a moins de 10 secondes ?
      const lastSeenTimestamp = recentCardFingerprints.get(txt) || 0;
      const isDuplicateRecentlyProcessed = (now - lastSeenTimestamp < 10000);

      // 3. Même élément DOM et même texte que la dernière action ?
      const isSameAsLastAction = (candidate === lastProcessedCardElement && txt === lastProcessedCardText);

      if (alreadyInCurrentPack || isDuplicateRecentlyProcessed || isSameAsLastAction) {
        console.warn(`🛡️ [Anti-Doublon] Carte "${txt}" déjà traitée (il y a ${((now - lastSeenTimestamp) / 1000).toFixed(1)}s). Refus d'enregistrement et reswipe immédiat.`);
        
        // Forcer immédiatement le passage à la carte suivante sans rien sauvegarder en double
        if (isBotActive && !isPausedForBreak && !isTransitioning) {
          setTimeout(performSynchronizedCardSwipe, 300);
        }
        return;
      }

      // Carte authentique validée pour le traitement
      const detectedRarity = getRarityFromBadge();
      const cardData = extractCardData(candidate, detectedRarity);

      // Verrouillage immédiat
      seenCardsInCurrentPack.add(txt);
      lastProcessedCardElement = candidate;
      lastProcessedCardText = txt;
      lastCardProcessedTimestamp = now;
      markActivity(`Inspection carte ${seenCardsInCurrentPack.size}/5 (${txt})`);

      isProcessingCardInspection = true;
      consecutiveStallsCount = 0;

      if (isBotActive && !isPausedForBreak) {
        setBotLiveStatus(`🔍 Analyse carte ${seenCardsInCurrentPack.size}/5...`);
      } else {
        setBotLiveStatus(isPausedForBreak ? `☕ Pause : Scan "${cardData.name}"` : `🃏 Détection manuelle : ${cardData.name}`);
      }

      const cardContainer = candidate.closest('div.glow-c, div.glow-pc, div.glow-r, div.glow-sr, div.glow-ur, div.glow-l') || candidate;
      
      inspectCardPricesStealth(cardContainer, cardData, () => {
        try {
          // Enregistrement garanti unique
          recordPulledCard(detectedRarity, cardData);

          const targets = (config.targetCardsList || []).map(t => (t || '').trim().toLowerCase()).filter(Boolean);
          const isTargetMatched = targets.some(t => cardData.name.toLowerCase().includes(t));
          const priceVal = cardData.suggestedPrice || parseFloat(cardData.minPrice) || parseFloat(cardData.avgPrice) || 0;

          // Synthèse Audio
          if (detectedRarity === 'Légendaire' || isTargetMatched) {
            playDynamicSound('legendary');
          } else if (detectedRarity === 'Ultra rare' || priceVal >= 1000) {
            playDynamicSound('ultra');
          } else if (detectedRarity === 'Super rare') {
            playDynamicSound('super_rare');
          }

          // Notifications & Discord
          if (config.discordWebhookUrl) {
            chrome.runtime.sendMessage({
              action: 'NOTIFY_DISCORD',
              data: { cardData, webhookUrl: config.discordWebhookUrl, config }
            });
          } else {
            chrome.runtime.sendMessage({
              action: 'TRIGGER_OS_NOTIF',
              data: { cardData, config }
            });
          }

          console.log(`🃏 [Carte ${seenCardsInCurrentPack.size}/5] : "${cardData.name}" [${detectedRarity}] | Revente conseillée : ${cardData.suggestedPrice || '-'}`);
        } catch (err) {
          console.error("Erreur post-inspection :", err);
        } finally {
          isProcessingCardInspection = false;
          markActivity(`Fin inspection ${cardData.name}`);
        }

        if (isBotActive && !isPausedForBreak) {
          const elapsed = Date.now() - lastCardProcessedTimestamp;
          const targetDelay = getRandomInt(config.minClickDelay || 1500, config.maxClickDelay || 2200);
          const remainingDelay = Math.max(1500 - elapsed, targetDelay - elapsed, 1500);

          setTimeout(() => {
            if (!isBotActive || isPausedForBreak) return;
            runCycle();
          }, remainingDelay);
        } else {
          const remainingStr = isPausedForBreak ? "☕ En pause" : "Mode Manuel : Prêt";
          setBotLiveStatus(seenCardsInCurrentPack.size >= 5 ? (isPausedForBreak ? "☕ En pause (Pack scanné)" : "✨ Fin du pack manuel") : remainingStr);
        }
      });
    } catch (err) {
      console.error("Erreur dans processDetectedCard :", err);
      isProcessingCardInspection = false;
      scheduleNextClick();
    }
  }

  function checkAndProcessVisibleCard() {
    if (isProcessingCardInspection || isHandlingCaptcha || !isPullsPage()) return;
    try {
      const visible = getVisibleCardTitleElement();
      if (visible) {
        const { element, text } = visible;
        const now = Date.now();
        const lastSeen = recentCardFingerprints.get(text) || 0;

        // Si la carte est différente et n'a pas été traitée dans les 10 dernières secondes
        if ((element !== lastProcessedCardElement || text !== lastProcessedCardText) && (now - lastSeen >= 10000)) {
          processDetectedCard(element);
        }
      }
    } catch (e) {
      console.warn("Notice: checkAndProcessVisibleCard error", e);
    }
  }

  // ==========================================================================
  // 9. SWIPE SYNCHRONISÉ AVEC ATTENTE ASYNCHRONE & RESWIPE DE SECOURS
  // ==========================================================================

  function performSynchronizedCardSwipe() {
    if (isTransitioning || !isBotActive || isPausedForBreak) return;

    try {
      const currentVisible = getVisibleCardTitleElement();
      const currentElem = currentVisible ? currentVisible.element : lastProcessedCardElement;
      const currentText = currentVisible ? currentVisible.text : lastProcessedCardText;

      const nextArrowBtn = findNextArrowButton();
      if (!nextArrowBtn) {
        const finishBtn = findFinishPackButton();
        if (finishBtn) {
          markActivity("Clic terminer fin pack");
          seenCardsInCurrentPack.clear();
          lastProcessedCardElement = null;
          lastProcessedCardText = '';
          lastCardProcessedTimestamp = 0;
          forceClickElement(finishBtn);
          setTimeout(scheduleNextClick, 600);
          return;
        }
        scheduleNextClick();
        return;
      }

      isTransitioning = true;
      markActivity(`Swipe carte suivante (${seenCardsInCurrentPack.size}/5)`);
      setBotLiveStatus(isBreakPending ? `➡️ Finalisation pack (${seenCardsInCurrentPack.size}/5)...` : `➡️ Carte suivante (${seenCardsInCurrentPack.size}/5)...`);

      forceClickElement(nextArrowBtn);

      let isResolved = false;
      let mutationObserver = null;
      let swipeTimeout = null;

      const cleanup = () => {
        if (isResolved) return;
        isResolved = true;
        if (swipeTimeout) { clearTimeout(swipeTimeout); swipeTimeout = null; }
        if (mutationObserver) { mutationObserver.disconnect(); mutationObserver = null; }
        isTransitioning = false;
      };

      mutationObserver = new MutationObserver(() => {
        if (!isBotActive || isPausedForBreak) {
          cleanup();
          return;
        }

        const finishBtn = findFinishPackButton();
        if (finishBtn) {
          cleanup();
          markActivity("Fin de pack détectée après swipe");
          runCycle();
          return;
        }

        const newVisible = getVisibleCardTitleElement();
        if (newVisible) {
          const isDifferentCard = (newVisible.element !== currentElem || newVisible.text !== currentText);
          if (isDifferentCard) {
            cleanup();
            markActivity(`Nouvelle carte DOM stabilisée : ${newVisible.text}`);
            runCycle();
            return;
          }
        }
      });

      mutationObserver.observe(document.body, { childList: true, subtree: true });

      // Timeout de transition (2.5s)
      swipeTimeout = setTimeout(() => {
        if (isResolved) return;
        cleanup();
        
        const retryArrowBtn = findNextArrowButton();
        if (retryArrowBtn) {
          console.log("🔄 [Reswipe] Carte inchangée après transition. Reswipe forcé...");
          forceClickElement(retryArrowBtn);
        }
        setTimeout(runCycle, 400);
      }, 2500);

    } catch (err) {
      console.error("Erreur performSynchronizedCardSwipe :", err);
      isTransitioning = false;
      scheduleNextClick();
    }
  }

  // ==========================================================================
  // 10. WATCHDOG ANTI-FREEZE 6S & PLANIFICATEUR DE RECHARGEMENT (1H30)
  // ==========================================================================

  function initPeriodicReloadPlanner() {
    if (periodicReloadTimer) clearInterval(periodicReloadTimer);

    // Planification stricte : toutes les 1h30 (90 minutes)
    nextScheduledReloadTimestamp = Date.now() + PREVENTIVE_RELOAD_INTERVAL_MS;
    console.log(`⏰ [Planificateur 1h30] Prochain rechargement préventif programmé à ${new Date(nextScheduledReloadTimestamp).toLocaleTimeString()}.`);

    periodicReloadTimer = setInterval(() => {
      if (!isBotActive) return;

      const now = Date.now();
      if (now >= nextScheduledReloadTimestamp) {
        console.log("🔄 [Planificateur 1h30] Échéance atteinte !");
        
        if (isPausedForBreak) {
          console.log("🔄 [Planificateur 1h30] Rechargement immédiat pendant la pause...");
          location.reload();
        } else {
          isReloadPendingAfterPack = true;
          console.log("🔄 [Planificateur 1h30] Rechargement programmé dès la fin du booster courant.");
        }
      }
    }, 30000);
  }

  function initGlobalWatchdog() {
    if (globalWatchdogTimer) clearInterval(globalWatchdogTimer);
    globalWatchdogTimer = setInterval(() => {
      if (!isBotActive || isPausedForBreak) {
        consecutiveStallsCount = 0;
        return;
      }

      const now = Date.now();
      const elapsed = now - lastActivityTimestamp;

      // Attente normale d'ouverture de booster
      if (isWaitingToOpenBooster) {
        const allowedWait = ((config.maxBoosterWaitSec || 4.0) + 2.5) * 1000;
        if (elapsed < allowedWait) return;
      }

      // STAGNATION DÉTECTÉE (> 6 secondes)
      if (elapsed >= 6000) {
        consecutiveStallsCount++;
        console.warn(`⚠️ [Watchdog 6s] Blocage sur "${lastActivityDescription}" depuis ${(elapsed / 1000).toFixed(1)}s (Incident #${consecutiveStallsCount}). Reswipe de secours sans fausser les stats...`);
        setBotLiveStatus("⚠️ Déblocage sécurité (Reswipe)...");

        // 1. Libération des verrous sans effacer la mémoire de la dernière carte
        isProcessingCardInspection = false;
        isWaitingToOpenBooster = false;
        isHandlingCaptcha = false;
        isTransitioning = false;

        if (inspectionWatchdog) {
          clearTimeout(inspectionWatchdog);
          inspectionWatchdog = null;
        }
        if (loopTimeout) {
          clearTimeout(loopTimeout);
          loopTimeout = null;
        }

        // 2. Fermeture forcée des modales ouvertes
        const openModal = document.querySelector('div.fixed.inset-0.z-50');
        if (openModal) {
          openModal.classList.remove('wm-inspecting');
          forceCloseModal(openModal);
        }

        // 3. Si échecs répétés consécutifs (> 3 fois), forcer un rechargement propre
        if (consecutiveStallsCount >= 3) {
          console.warn("🚨 [Watchdog 6s] Échecs consécutifs répétés (>3). Rechargement préventif de la page...");
          location.reload();
          return;
        }

        // 4. Procédure de secours SANS incrémentation statistique
        const finishBtn = findFinishPackButton();
        if (finishBtn) {
          console.log("🛡️ [Watchdog 6s] Déblocage via bouton Terminer / Valider.");
          seenCardsInCurrentPack.clear();
          lastProcessedCardElement = null;
          lastProcessedCardText = '';
          lastCardProcessedTimestamp = 0;
          forceClickElement(finishBtn);
          markActivity("Watchdog Déblocage Finish");
          setTimeout(scheduleNextClick, 600);
          return;
        }

        const arrowBtn = findNextArrowButton();
        if (arrowBtn && seenCardsInCurrentPack.size < 5) {
          console.log("🛡️ [Watchdog 6s] Reswipe de secours via Flèche Droite.");
          forceClickElement(arrowBtn);
          markActivity("Watchdog Déblocage Reswipe");
          setTimeout(scheduleNextClick, 600);
          return;
        }

        const openBtn = findOpenBoosterButton();
        if (openBtn) {
          console.log("🛡️ [Watchdog 6s] Relance ouverture booster (sans double compte).");
          seenCardsInCurrentPack.clear();
          lastProcessedCardElement = null;
          lastProcessedCardText = '';
          lastCardProcessedTimestamp = 0;
          lastBoosterOpenedTime = Date.now();
          forceClickElement(openBtn);
          markActivity("Watchdog Déblocage Open");
          setTimeout(scheduleNextClick, 800);
          return;
        }

        console.log("🛡️ [Watchdog 6s] Relance sécurisée du cycle.");
        markActivity("Watchdog Reset");
        scheduleNextClick();
      }
    }, 1000);
  }

  // ==========================================================================
  // 11. GESTION DES SESSIONS HUMAINES & BILANS DISCORD
  // ==========================================================================

  function sendSummary(type) {
    if (!config.discordWebhookUrl) return;
    try {
      const statsToSend = type === 'stop' ? totalSessionStats : cycleStats;
      if (statsToSend.cardsPulled === 0) return;

      const pauseEndSec = type === 'pause' ? Math.floor(currentSessionEnd / 1000) : null;

      chrome.runtime.sendMessage({
        action: 'SEND_SESSION_SUMMARY',
        data: {
          summaryType: type,
          sessionStats: statsToSend,
          webhookUrl: config.discordWebhookUrl,
          discordUserId: config.discordUserId,
          pauseThreadId: config.pauseThreadId,
          pauseEndTimestamp: pauseEndSec
        }
      });

      if (type === 'pause') {
        cycleStats = {
          packsOpened: 0,
          cardsPulled: 0,
          rarityCounts: {
            'Commune': 0, 'Peu commune': 0, 'Rare': 0,
            'Super rare': 0, 'Ultra rare': 0, 'Légendaire': 0
          },
          cards: []
        };
      } else if (type === 'stop') {
        cycleStats = { packsOpened: 0, cardsPulled: 0, rarityCounts: {}, cards: [] };
        totalSessionStats = { packsOpened: 0, cardsPulled: 0, rarityCounts: {}, cards: [] };
        chrome.storage.local.remove('totalSessionStats');
      }
    } catch (e) {
      console.warn("Notice: sendSummary error", e);
    }
  }

  function syncCycleState(isBreak) {
    try {
      chrome.storage.local.set({
        isPausedForBreak: isBreak,
        cycleInfo: {
          currentSessionEnd: currentSessionEnd,
          nextBreakDurationMin: nextBreakDurationMin,
          isPausedForBreak: isBreak
        }
      });
    } catch (_) {}
  }

  function triggerBreakPending() {
    if (isBreakPending || isPausedForBreak || !isBotActive) return;
    isBreakPending = true;
    console.log("⏳ [Session] Fin du booster en cours avant pause (Watchdog 4s armé)...");
    setBotLiveStatus("⏳ Fin du booster avant pause...");

    if (breakWatchdogTimeout) clearTimeout(breakWatchdogTimeout);
    breakWatchdogTimeout = setTimeout(() => {
      if (isBreakPending && !isPausedForBreak && isBotActive) {
        console.warn("⚠️ [Watchdog Pause] Timeout de 4s atteint. Forçage immédiat de la pause.");
        const finishBtn = findFinishPackButton();
        if (finishBtn) forceClickElement(finishBtn);
        seenCardsInCurrentPack.clear();
        lastProcessedCardElement = null;
        lastProcessedCardText = '';
        lastCardProcessedTimestamp = 0;
        executeBreak();
      }
    }, 4000);

    if (!isProcessingCardInspection && !isWaitingToOpenBooster && !isTransitioning) {
      if (loopTimeout) clearTimeout(loopTimeout);
      loopTimeout = setTimeout(runCycle, 150);
    }
  }

  function startNewActiveSession(isResumingFromBreak = false) {
    if (!isBotActive) return;
    try {
      if (breakWatchdogTimeout) clearTimeout(breakWatchdogTimeout);
      isPausedForBreak = false;
      isBreakPending = false;
      isWaitingToOpenBooster = false;
      isProcessingCardInspection = false;
      isHandlingCaptcha = false;
      isTransitioning = false;
      consecutiveStallsCount = 0;
      lastProcessedCardElement = null;
      lastProcessedCardText = '';
      lastCardProcessedTimestamp = 0;
      seenCardsInCurrentPack.clear();
      markActivity("Démarrage nouvelle session active");

      setBotLiveStatus("⚡ En attente de pack");

      if (isResumingFromBreak && config.discordWebhookUrl) {
        chrome.runtime.sendMessage({
          action: 'SEND_RESUME_STATUS',
          data: {
            webhookUrl: config.discordWebhookUrl,
            pauseThreadId: config.pauseThreadId,
            discordUserId: config.discordUserId
          }
        });
      }

      cycleStats = {
        packsOpened: 0,
        cardsPulled: 0,
        rarityCounts: {
          'Commune': 0, 'Peu commune': 0, 'Rare': 0,
          'Super rare': 0, 'Ultra rare': 0, 'Légendaire': 0
        },
        cards: []
      };

      if (config.humanCyclesEnabled) {
        const minMs = config.minActiveMin * 60 * 1000;
        const maxMs = config.maxActiveMin * 60 * 1000;
        const durationMs = Math.round(getRandomFloat(minMs, maxMs));
        currentSessionEnd = Date.now() + durationMs;

        const minBreakMs = config.minBreakMin * 60 * 1000;
        const maxBreakMs = config.maxBreakMin * 60 * 1000;
        const breakDurationMs = Math.round(getRandomFloat(minBreakMs, maxBreakMs));
        nextBreakDurationMin = (breakDurationMs / (60 * 1000)).toFixed(1);

        const activeSec = Math.round(durationMs / 1000);
        const m = Math.floor(activeSec / 60);
        const s = activeSec % 60;

        syncCycleState(false);
        console.log(`🟢 [Session] Nouveau farm actif : ${m}m ${s}s (pause de ${nextBreakDurationMin} min prévue).`);

        if (sessionTimeout) clearTimeout(sessionTimeout);
        if (config.maxBreakMin > 0) {
          sessionTimeout = setTimeout(triggerBreakPending, durationMs);
        }
      } else {
        syncCycleState(false);
      }

      const finishBtn = findFinishPackButton();
      if (finishBtn) {
        forceClickElement(finishBtn);
        setTimeout(scheduleNextClick, 600);
        return;
      }

      scheduleNextClick();
    } catch (e) {
      console.error("Erreur startNewActiveSession :", e);
      scheduleNextClick();
    }
  }

  function executeBreak() {
    try {
      if (breakWatchdogTimeout) clearTimeout(breakWatchdogTimeout);
      isBreakPending = false;
      isPausedForBreak = true;
      isWaitingToOpenBooster = false;
      isProcessingCardInspection = false;
      isTransitioning = false;
      lastProcessedCardElement = null;
      lastProcessedCardText = '';
      lastCardProcessedTimestamp = 0;
      seenCardsInCurrentPack.clear();

      if (loopTimeout) clearTimeout(loopTimeout);

      const minBreakMs = config.minBreakMin * 60 * 1000;
      const maxBreakMs = config.maxBreakMin * 60 * 1000;
      const durationMs = Math.round(getRandomFloat(minBreakMs, maxBreakMs));

      if (durationMs <= 0) {
        startNewActiveSession(false);
        return;
      }

      currentSessionEnd = Date.now() + durationMs;
      breakCycleCount++;

      syncCycleState(true);
      sendSummary('pause');

      setBotLiveStatus(`☕ Pause café (${(durationMs / 60000).toFixed(1)} min)`);
      console.log(`☕ [Session] Booster terminé avec succès ! Pause de ${(durationMs / 60000).toFixed(1)}m.`);

      if (sessionTimeout) clearTimeout(sessionTimeout);
      sessionTimeout = setTimeout(() => startNewActiveSession(true), durationMs);
    } catch (e) {
      console.error("Erreur executeBreak :", e);
    }
  }

  function resumeSessionFromStorage(cycleInfo, isBreakStored) {
    try {
      const now = Date.now();
      const savedEnd = cycleInfo?.currentSessionEnd || 0;
      const remainingMs = savedEnd - now;

      if (isBreakStored) {
        if (remainingMs > 1000) {
          isPausedForBreak = true;
          isBreakPending = false;
          currentSessionEnd = savedEnd;
          nextBreakDurationMin = cycleInfo?.nextBreakDurationMin || 0;
          syncCycleState(true);
          setBotLiveStatus(`☕ Pause café (${(remainingMs / 60000).toFixed(1)} min restantes)`);
          console.log(`☕ [Reprise] Pause en cours : ${(remainingMs / 60000).toFixed(1)} min restantes.`);

          if (sessionTimeout) clearTimeout(sessionTimeout);
          sessionTimeout = setTimeout(() => startNewActiveSession(true), remainingMs);
        } else {
          console.log("☕ [Reprise] Pause écoulée pendant le rechargement. Relance.");
          startNewActiveSession(true);
        }
      } else {
        if (remainingMs > 1000 && config.humanCyclesEnabled) {
          isPausedForBreak = false;
          isBreakPending = false;
          currentSessionEnd = savedEnd;
          nextBreakDurationMin = cycleInfo?.nextBreakDurationMin || 0;
          syncCycleState(false);
          setBotLiveStatus("⚡ En attente de pack");
          console.log(`🟢 [Reprise] Farm en cours : ${(remainingMs / 60000).toFixed(1)} min restantes.`);

          if (sessionTimeout) clearTimeout(sessionTimeout);
          sessionTimeout = setTimeout(triggerBreakPending, remainingMs);

          scheduleNextClick();
        } else {
          startNewActiveSession(false);
        }
      }
    } catch (e) {
      console.error("Erreur resumeSessionFromStorage :", e);
      startNewActiveSession(false);
    }
  }

  // ==========================================================================
  // GESTIONNAIRE DE CAPTCHA / VÉRIFICATION RAPIDE (ANTI-BOT AUTO-SOLVER)
  // ==========================================================================

  let isResolvingCaptcha = false;
  let lastCaptchaAttemptTime = 0;

  function handleFastVerificationCaptcha() {
    try {
      // 1. Détection de la boîte de vérification rapide / Je ne suis pas un robot
      const captchaCheckbox = document.querySelector('input[type="checkbox"]');
      const captchaButton = Array.from(document.querySelectorAll('button')).find(el => {
        if (isZeventElement(el)) return false;
        const txt = (el.innerText || el.textContent || '').trim().toLowerCase();
        return txt.includes('continuer') || txt.includes('valider') || txt.includes('vérifier');
      });

      const hasCaptchaModal = Boolean(
        document.querySelector('div[class*="captcha"], div[class*="challenge"], [data-sitekey]') ||
        Array.from(document.querySelectorAll('div, form, p, h2, h3, span')).some(el => {
          if (el.children.length > 3) return false;
          const t = (el.innerText || el.textContent || '').toLowerCase();
          return t.includes('vérification rapide') || t.includes('verification rapide') || t.includes('je ne suis pas un robot');
        })
      );

      const isCaptchaPresent = (captchaCheckbox && captchaCheckbox.offsetParent !== null) || 
                               (captchaButton && hasCaptchaModal) || 
                               (captchaCheckbox && captchaButton);

      if (!isCaptchaPresent) {
        if (isHandlingCaptcha && !isResolvingCaptcha) {
          isHandlingCaptcha = false;
        }
        return false;
      }

      const now = Date.now();
      if (isResolvingCaptcha || (now - lastCaptchaAttemptTime < 800)) {
        return true;
      }

      lastCaptchaAttemptTime = now;
      isResolvingCaptcha = true;
      isHandlingCaptcha = true;

      markActivity("Résolution Vérification rapide / Captcha");
      setBotLiveStatus("🛡️ Résolution Vérification rapide...");
      playDynamicSound('super_rare');
      console.log("🛡️ [Captcha] Détection 'Vérification rapide' / 'Je ne suis pas un robot' en cours...");

      // 2. Cocher automatiquement la case à cocher si non cochée
      if (captchaCheckbox && !captchaCheckbox.checked) {
        captchaCheckbox.checked = true;
        if (typeof captchaCheckbox.click === 'function') {
          captchaCheckbox.click();
        }
        captchaCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
        captchaCheckbox.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // 3. Activation & Clic complet de pointeur et de souris sur le bouton "Continuer" après délai de 300ms
      setTimeout(() => {
        try {
          const btn = captchaButton || Array.from(document.querySelectorAll('button')).find(el => {
            if (isZeventElement(el)) return false;
            const txt = (el.innerText || el.textContent || '').trim().toLowerCase();
            return txt.includes('continuer') || txt.includes('valider') || txt.includes('vérifier');
          });

          if (btn) {
            // Force l'activation du bouton en retirant l'attribut disabled si nécessaire
            if (btn.disabled || btn.hasAttribute('disabled')) {
              btn.disabled = false;
              btn.removeAttribute('disabled');
              btn.classList.remove('disabled', 'opacity-50', 'cursor-not-allowed');
            }

            const rect = btn.getBoundingClientRect();
            const opts = {
              bubbles: true,
              cancelable: true,
              view: window,
              detail: 1,
              clientX: rect.x + (rect.width > 0 ? rect.width / 2 : 10),
              clientY: rect.y + (rect.height > 0 ? rect.height / 2 : 10),
              screenX: (window.screenX || 0) + rect.x + (rect.width > 0 ? rect.width / 2 : 10),
              screenY: (window.screenY || 0) + rect.y + (rect.height > 0 ? rect.height / 2 : 10),
              button: 0,
              buttons: 1
            };

            btn.dispatchEvent(new PointerEvent('pointerdown', opts));
            btn.dispatchEvent(new MouseEvent('mousedown', opts));
            btn.dispatchEvent(new PointerEvent('pointerup', opts));
            btn.dispatchEvent(new MouseEvent('mouseup', opts));
            btn.dispatchEvent(new MouseEvent('click', opts));
            if (typeof btn.click === 'function') {
              btn.click();
            }

            console.log("✅ [Captcha] Clic de validation envoyé sur le bouton Continuer.");
          }
        } catch (e) {
          console.warn("Notice: Erreur clic bouton captcha :", e);
        } finally {
          setTimeout(() => {
            isResolvingCaptcha = false;
            isHandlingCaptcha = false;
            if (isBotActive && !isPausedForBreak) {
              scheduleNextClick();
            }
          }, 600);
        }
      }, 300);

      return true;
    } catch (err) {
      console.error("Erreur dans handleFastVerificationCaptcha :", err);
      isResolvingCaptcha = false;
      isHandlingCaptcha = false;
      return false;
    }
  }

  // ==========================================================================
  // 12. BOUCLE PRINCIPALE DE CONTRÔLE BLINDÉE
  // ==========================================================================

  function runCycle() {
    try {
      if (!isBotActive || isPausedForBreak || isWaitingToOpenBooster || isProcessingCardInspection || isTransitioning) return;

      if (!isPullsPage()) {
        scheduleNextClick();
        return;
      }

      // 1. Détection & Traitement Captcha / Anti-Robot / Vérification rapide
      if (handleFastVerificationCaptcha()) {
        return;
      }

      // 2. Scan prioritaire de la carte visible actuelle (h3.text-base)
      if (seenCardsInCurrentPack.size < 5) {
        const visibleCard = getVisibleCardTitleElement();
        if (visibleCard) {
          const { element, text } = visibleCard;
          const now = Date.now();
          const lastSeen = recentCardFingerprints.get(text) || 0;

          // Si la carte n'est pas déjà dans le pack et n'a pas été traitée dans les 10s
          if (!seenCardsInCurrentPack.has(text) && (now - lastSeen >= 10000)) {
            processDetectedCard(element);
            return;
          }
        }
      }

      // 3. Navigation synchronisée vers la carte suivante (Cartes 1 à 4)
      if (seenCardsInCurrentPack.size > 0 && seenCardsInCurrentPack.size < 5) {
        performSynchronizedCardSwipe();
        return;
      }

      // 4. Détection du bouton de fin de paquet (Terminer / Valider / Continuer)
      const finishPackBtn = findFinishPackButton();
      if (finishPackBtn) {
        const elapsedSinceLastCard = Date.now() - lastCardProcessedTimestamp;
        if (lastCardProcessedTimestamp > 0 && elapsedSinceLastCard < 1500) {
          setTimeout(runCycle, 1500 - elapsedSinceLastCard + 100);
          return;
        }

        markActivity("Validation du pack");

        // Rechargement préventif différé (toutes les 1h30)
        if (isReloadPendingAfterPack) {
          isReloadPendingAfterPack = false;
          console.log("🔄 [Planificateur 1h30] Rechargement propre après validation du pack...");
          forceClickElement(finishPackBtn);
          setTimeout(() => location.reload(), 800);
          return;
        }

        if (isBreakPending) {
          if (breakWatchdogTimeout) clearTimeout(breakWatchdogTimeout);
          setBotLiveStatus("✨ Fin du pack, passage en pause");
          seenCardsInCurrentPack.clear();
          lastProcessedCardElement = null;
          lastProcessedCardText = '';
          lastCardProcessedTimestamp = 0;
          forceClickElement(finishPackBtn);
          setTimeout(executeBreak, 400);
          return;
        }

        setBotLiveStatus("✨ Validation du pack");
        seenCardsInCurrentPack.clear();
        lastProcessedCardElement = null;
        lastProcessedCardText = '';
        lastCardProcessedTimestamp = 0;
        forceClickElement(finishPackBtn);
        setTimeout(scheduleNextClick, 800);
        return;
      }

      // 5. Ouverture d'un booster (Inventaire central via card_pack.png)
      const openBoosterBtn = findOpenBoosterButton();
      if (openBoosterBtn) {
        if (isBreakPending) {
          executeBreak();
          return;
        }

        const now = Date.now();
        if (now - lastBoosterOpenedTime < 2500) {
          scheduleNextClick();
          return;
        }

        const waitSec = getRandomFloat(config.minBoosterWaitSec || 2.0, config.maxBoosterWaitSec || 4.0);
        const waitMs = Math.round(waitSec * 1000);

        markActivity(`Temporisation ouverture booster (${waitSec.toFixed(1)}s)`);
        setBotLiveStatus(`⏳ Temporisation (${waitSec.toFixed(1)}s)...`);
        isWaitingToOpenBooster = true;

        setTimeout(() => {
          isWaitingToOpenBooster = false;
          if (!isBotActive || isPausedForBreak) return;

          if (isBreakPending) {
            executeBreak();
            return;
          }

          lastBoosterOpenedTime = Date.now();
          recordPackOpened();
          lastProcessedCardElement = null;
          lastProcessedCardText = '';
          lastCardProcessedTimestamp = 0;
          markActivity("Clic ouverture booster");
          setBotLiveStatus("📦 Ouverture du booster...");

          forceClickElement(openBoosterBtn);
          setTimeout(scheduleNextClick, 800);
        }, waitMs);
        return;
      }

      setBotLiveStatus("⚡ En attente de pack");
      scheduleNextClick();
    } catch (err) {
      console.error("⚠️ [Bot Recoverable Error in runCycle] :", err);
      isProcessingCardInspection = false;
      isTransitioning = false;
      isWaitingToOpenBooster = false;
      scheduleNextClick();
    }
  }

  function scheduleNextClick() {
    if (loopTimeout) clearTimeout(loopTimeout);
    if (!isBotActive || isPausedForBreak || isWaitingToOpenBooster || isProcessingCardInspection || isTransitioning) return;

    try {
      const nextDelay = Math.max(1500, getRandomInt(config.minClickDelay || 1500, config.maxClickDelay || 2200));
      loopTimeout = setTimeout(runCycle, nextDelay);
    } catch (_) {}
  }

  // ==========================================================================
  // 13. MUTATION OBSERVER & GESTION DES CLICS MANUELS
  // ==========================================================================

  let isObserverFramePending = false;
  const domObserver = new MutationObserver(() => {
    neutralizeZeventElements();
    if (handleFastVerificationCaptcha()) return;

    const isAutoLoopActive = isBotActive && !isPausedForBreak && !isWaitingToOpenBooster;
    if (isAutoLoopActive || !isPullsPage() || isProcessingCardInspection || isHandlingCaptcha || isObserverFramePending) return;

    isObserverFramePending = true;
    requestAnimationFrame(() => {
      isObserverFramePending = false;
      const isAutoLoopNow = isBotActive && !isPausedForBreak && !isWaitingToOpenBooster;
      if (isAutoLoopNow || !isPullsPage() || isProcessingCardInspection || isHandlingCaptcha) return;

      checkAndProcessVisibleCard();
    });
  });

  domObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  document.addEventListener('click', (e) => {
    if (!isPullsPage() || isHandlingCaptcha) return;

    try {
      const target = e.target.closest('button, [role="button"], a, div');
      if (!target) return;

      if (isHeaderOrWalletElement(target) || isCurrencyOrShopElement(target) || isZeventElement(target)) return;

      const targetText = (target.innerText || target.textContent || '').trim().toLowerCase();
      if (targetText.includes('zevent')) return;

      const isRealOpenAction = (targetText.includes('ouvrir') || targetText.includes('booster')) &&
                               !targetText.includes('continuer') &&
                               !targetText.includes('valider') &&
                               !targetText.includes('marché') &&
                               !targetText.includes('boutique') &&
                               !targetText.includes('shop') &&
                               !targetText.includes('acheter');

      const isFinishAction = targetText.includes('terminer') || 
                             targetText.includes('fermer') || 
                             targetText.includes('valider') || 
                             targetText.includes('continuer');

      if (isRealOpenAction) {
        seenCardsInCurrentPack.clear();
        lastProcessedCardElement = null;
        lastProcessedCardText = '';
        lastCardProcessedTimestamp = 0;
        isTransitioning = false;
        setBotLiveStatus(isPausedForBreak ? "☕ En pause (Pack manuel ouvert)" : "Mode Manuel : Ouverture pack");
        if (!isBotActive || isPausedForBreak) {
          recordPackOpened();
        }
      } else if (isFinishAction) {
        seenCardsInCurrentPack.clear();
        lastProcessedCardElement = null;
        lastProcessedCardText = '';
        lastCardProcessedTimestamp = 0;
        isTransitioning = false;
        if (!isBotActive || isPausedForBreak) {
          setBotLiveStatus(isPausedForBreak ? "☕ En pause" : "Mode Manuel : Prêt");
        }
      } else {
        const isAutoLoopActive = isBotActive && !isPausedForBreak;
        if (!isAutoLoopActive && !isProcessingCardInspection) {
          requestAnimationFrame(() => {
            checkAndProcessVisibleCard();
          });
          setTimeout(() => {
            checkAndProcessVisibleCard();
          }, 150);
        }
      }
    } catch (err) {
      console.warn("Notice: Click listener error :", err);
    }
  }, true);

  // ==========================================================================
  // 14. INITIALISATION GLOBALE & ÉCOUTEURS DE STOCKAGE
  // ==========================================================================

  chrome.storage.local.get([
    'autoBoosterEnabled',
    'botConfig',
    'isPausedForBreak',
    'cycleInfo',
    'totalSessionStats',
    'totalPacksCount',
    'totalCardsCount',
    'rarityCounts',
    'pulledCardsHistory'
  ], (result) => {
    try {
      isBotActive = !!result.autoBoosterEnabled;
      if (result.botConfig) config = { ...config, ...result.botConfig };
      if (result.totalSessionStats) totalSessionStats = result.totalSessionStats;
      if (typeof result.totalPacksCount === 'number') totalPacksCountCache = result.totalPacksCount;
      if (typeof result.totalCardsCount === 'number') totalCardsCountCache = result.totalCardsCount;
      if (result.rarityCounts) rarityCountsCache = result.rarityCounts;
      if (result.pulledCardsHistory) pulledCardsHistoryCache = result.pulledCardsHistory;

      initGlobalWatchdog();
      initPeriodicReloadPlanner();

      if (isBotActive) {
        resumeSessionFromStorage(result.cycleInfo, !!result.isPausedForBreak);
      } else {
        setBotLiveStatus("Mode Manuel : Prêt");
      }
    } catch (err) {
      console.error("Erreur lors de l'initialisation storage :", err);
    }
  });

  chrome.storage.onChanged.addListener((changes) => {
    try {
      if (changes.totalPacksCount) totalPacksCountCache = changes.totalPacksCount.newValue || 0;
      if (changes.totalCardsCount) totalCardsCountCache = changes.totalCardsCount.newValue || 0;
      if (changes.rarityCounts) rarityCountsCache = changes.rarityCounts.newValue || rarityCountsCache;
      if (changes.pulledCardsHistory) pulledCardsHistoryCache = changes.pulledCardsHistory.newValue || [];

      if (changes.autoBoosterEnabled) {
        const nextState = changes.autoBoosterEnabled.newValue;
        if (isBotActive && !nextState && totalSessionStats.cardsPulled > 0) {
          sendSummary('stop');
        }
        isBotActive = nextState;
        if (isBotActive) {
          totalSessionStats = { packsOpened: 0, cardsPulled: 0, rarityCounts: {}, cards: [] };
          chrome.storage.local.remove('totalSessionStats');
          seenCardsInCurrentPack.clear();
          lastProcessedCardElement = null;
          lastProcessedCardText = '';
          lastCardProcessedTimestamp = 0;
          isTransitioning = false;
          markActivity("Démarrage du bot");
          setBotLiveStatus("⚡ En attente de pack");
          startNewActiveSession(false);
        } else {
          if (loopTimeout) clearTimeout(loopTimeout);
          if (sessionTimeout) clearTimeout(sessionTimeout);
          if (breakWatchdogTimeout) clearTimeout(breakWatchdogTimeout);
          if (inspectionWatchdog) clearTimeout(inspectionWatchdog);
          isPausedForBreak = false;
          isBreakPending = false;
          isWaitingToOpenBooster = false;
          isProcessingCardInspection = false;
          isHandlingCaptcha = false;
          isTransitioning = false;
          lastProcessedCardElement = null;
          lastProcessedCardText = '';
          lastCardProcessedTimestamp = 0;
          seenCardsInCurrentPack.clear();
          setBotLiveStatus("Mode Manuel : Prêt");
          syncCycleState(false);
        }
      }

      if (changes.botConfig) {
        config = { ...config, ...changes.botConfig.newValue };
        if (!config.humanCyclesEnabled && isPausedForBreak) {
          isPausedForBreak = false;
          isBreakPending = false;
          startNewActiveSession(false);
        }
      }
    } catch (err) {
      console.warn("Notice: Storage change error :", err);
    }
  });

})();