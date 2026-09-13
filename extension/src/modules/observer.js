/**
 * WikiLogix - Module Observateur DOM Spécialisé Wiki-Masters (v1.4.8)
 * Conçu spécifiquement pour la structure exacte de https://www.wiki-masters.com/pulls :
 * - Détection du bouton "Ouvrir un paquet" (Booster)
 * - Extraction en temps réel du carrousel de cartes (Carte 1/5, 2/5, 3/5, 4/5, 5/5)
 * - Filtrage strict des badges de rareté pour garantir le vrai nom de la carte
 */

import { normalizeRarity, isValidCardName, RARITY_CONFIG } from './storage.js';

let currentSessionId = `booster_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
let lastDetectedCardSignature = '';

/**
 * Extrait le vrai titre de la carte sans attraper le badge de rareté
 */
function extractRealCardTitle(cardElement) {
  if (!cardElement) return '';

  const contentArea = cardElement.querySelector('div[class*="top-[45%]"], div.p-3, div.p-4');
  if (contentArea) {
    const h = contentArea.querySelector('h3, h2, h4, h1, [style*="font-family: var(--font-heading)"], .text-base.font-bold, .text-lg.font-bold, .text-xl.font-bold');
    if (h) {
      const txt = h.textContent.trim();
      if (isValidCardName(txt)) return txt;
    }
  }

  const headings = cardElement.querySelectorAll('h3, h2, h4, h1, [style*="font-family: var(--font-heading)"]');
  for (const h of headings) {
    if (h.closest('.top-2, .absolute.top-2, button, [aria-label]')) continue;
    const txt = h.textContent.trim();
    if (isValidCardName(txt)) return txt;
  }

  return '';
}

/**
 * Extrait les données complètes de la carte actuellement affichée dans le DOM.
 * @param {HTMLElement|Document} rootNode
 * @returns {Object|null}
 */
export function extractCurrentCardData(rootNode = document) {
  let cardName = '';
  let targetCardEl = null;

  const cardContainers = rootNode.querySelectorAll(
    'div.w-72.cursor-pointer, div[class*="w-72"][class*="glow-"], div[class*="glow-"].cursor-pointer, div[class*="w-72"].relative, .animate-card-flip div, .animate-card-flip'
  );

  for (const container of cardContainers) {
    if (container.closest('.card-frame, [class*="card-frame"], div[role="dialog"], div[data-protonpass-form]')) {
      continue;
    }

    const title = extractRealCardTitle(container);
    if (title && isValidCardName(title)) {
      cardName = title;
      targetCardEl = container;
      break;
    }
  }

  if (!cardName || !isValidCardName(cardName)) return null;

  // 2. Extraction de la rareté
  let rawRarity = '';

  const badgeTopLeft = targetCardEl?.querySelector('.absolute.top-2.left-2, div[style*="--color-rarity-"], span[style*="--color-rarity-"]');
  if (badgeTopLeft && badgeTopLeft.textContent.trim()) {
    rawRarity = badgeTopLeft.textContent.trim();
  }

  if (!rawRarity && targetCardEl) {
    const classStr = targetCardEl.className || '';
    const glowMatch = classStr.match(/\bglow-([a-z]+)\b/i);
    if (glowMatch && glowMatch[1]) {
      rawRarity = glowMatch[1];
    }
  }

  if (!rawRarity && targetCardEl) {
    const bgImg = targetCardEl.querySelector('img[src*="%2Fcommun"], img[src*="%2Frare"], img[src*="%2Flegendaire"], img[src*="%2Fultra"], img[src*="%2Fsuper"], img[src*="%2Fpeu"]');
    if (bgImg) {
      const src = bgImg.getAttribute('src') || '';
      if (src.includes('legendaire') || src.includes('legendary')) rawRarity = 'L';
      else if (src.includes('ultra')) rawRarity = 'UR';
      else if (src.includes('super_rare') || src.includes('super-rare')) rawRarity = 'SR';
      else if (src.includes('rare')) rawRarity = 'R';
      else if (src.includes('peu_commune') || src.includes('uncommon')) rawRarity = 'PC';
      else if (src.includes('commun')) rawRarity = 'C';
    }
  }

  const cleanRarity = normalizeRarity(rawRarity);

  // 3. Numéro de la carte dans le booster
  let cardIndex = 1;
  let totalInBooster = 5;

  const counterElements = rootNode.querySelectorAll('div, span, p');
  for (const el of counterElements) {
    if (el.children.length === 0) {
      const txt = (el.textContent || '').trim();
      const match = txt.match(/(?:Carte\s*)?(\d+)\s*\/\s*(\d+)/i);
      if (match && parseInt(match[2], 10) >= 3 && parseInt(match[2], 10) <= 10) {
        cardIndex = parseInt(match[1], 10);
        totalInBooster = parseInt(match[2], 10);
        break;
      }
    }
  }

  // 4. Description
  let description = '';
  const descEl = targetCardEl?.querySelector('p');
  if (descEl && descEl.textContent.trim()) {
    description = descEl.textContent.trim();
  }

  // 5. Statistiques Attaque / Défense
  let attack = null;
  let defense = null;

  const swordsIcon = targetCardEl?.querySelector('.lucide-swords, svg[class*="swords"]');
  if (swordsIcon && swordsIcon.parentElement) {
    const atkText = swordsIcon.parentElement.textContent.replace(/[^0-9]/g, '');
    if (atkText) attack = parseInt(atkText, 10);
  }

  const shieldIcon = targetCardEl?.querySelector('.lucide-shield, svg[class*="shield"]');
  if (shieldIcon && shieldIcon.parentElement) {
    const defText = shieldIcon.parentElement.textContent.replace(/[^0-9]/g, '');
    if (defText) defense = parseInt(defText, 10);
  }

  // 6. Image
  const logoImg = targetCardEl?.querySelector('img[alt="WikiMasters"], img');
  const imageUrl = logoImg ? (logoImg.getAttribute('src') || logoImg.src) : null;

  return {
    name: cardName,
    rarity: cleanRarity,
    description,
    attack,
    defense,
    cardIndex,
    totalInBooster,
    image: imageUrl,
    sessionId: currentSessionId
  };
}

/**
 * Configure la détection du clic sur le booster
 */
export function setupBoosterOpenListener() {
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const boosterBtn = target.closest('button');
    if (boosterBtn) {
      const hasPackImg = boosterBtn.querySelector('img[alt*="paquet"], img[src*="card_pack"]');
      const hasOpenText = boosterBtn.textContent.toLowerCase().includes('ouvrir');

      if (hasPackImg || hasOpenText) {
        currentSessionId = `booster_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        lastDetectedCardSignature = '';
        console.log('%c[WikiLogix Observer] Nouveau booster détecté ! Session démarrée :', 'color: #6366f1;', currentSessionId);
      }
    }
  }, true);
}
