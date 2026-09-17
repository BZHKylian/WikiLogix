/**
 * WikiLogix - Contrôleur de l'interface Popup (v1.4.3)
 * - Moteur Financier Réel : Cours officiels Wiki-Masters & Revente conseillée (50% - 75%)
 * - Interface épurée : affichage des vraies cartes sans tags superflus
 * - Couleurs officielles Wiki-Masters (L, UR, SR, R, PC, C)
 * - Actualisation instantanée via chrome.storage.onChanged
 */

import {
  STORAGE_KEYS,
  getStats,
  clearHistory,
  exportDataAsJSON,
  calculateCardPricing,
  normalizeRarity,
  isValidCardName,
  RARITY_CONFIG,
  getDiscordConfig,
  saveDiscordConfig
} from './modules/storage.js';

/**
 * Récupère les références fraîches des éléments du DOM
 */
function getDOM() {
  return {
    tabs: document.querySelectorAll('.tab-btn'),
    panes: document.querySelectorAll('.tab-pane'),
    btnOpenDashboard: document.getElementById('btn-open-dashboard'),

    // Section Financière
    valTotalAvg: document.getElementById('val-total-avg'),
    valAvgBooster: document.getElementById('val-avg-booster'),
    valTotalResale: document.getElementById('val-total-resale'),
    valResaleBooster: document.getElementById('val-resale-booster'),

    // KPIs
    kpiBoosters: document.getElementById('kpi-boosters'),
    kpiCards: document.getElementById('kpi-cards'),
    kpiLegendary: document.getElementById('kpi-legendary'),
    kpiUr: document.getElementById('kpi-ur'),
    badgeRateLegendary: document.getElementById('badge-rate-legendary'),
    badgeRateUr: document.getElementById('badge-rate-ur'),
    kpiLastPull: document.getElementById('kpi-last-pull'),

    // Sections Stats
    rarityContainer: document.getElementById('rarity-distribution-container'),
    recentList: document.getElementById('recent-pulls-list'),
    recentCountBadge: document.getElementById('recent-count-badge'),
    totalRatesCounter: document.getElementById('total-rates-counter'),

    // Configuration Discord & Filtres Multi-Fils
    discordEnabledToggle: document.getElementById('discord-enabled-toggle'),
    discordWebhookUrl: document.getElementById('discord-webhook-url'),
    btnTestDiscord: document.getElementById('btn-test-discord'),
    discordUserId: document.getElementById('discord-user-id'),
    discordRulesList: document.getElementById('discord-rules-list'),
    discordRulesCount: document.getElementById('discord-rules-count'),
    btnAddDiscordRule: document.getElementById('btn-add-discord-rule'),
    btnSaveDiscordConfig: document.getElementById('btn-save-discord-config'),

    // Onglet Config & Actions Données
    extensionIdDisplay: document.getElementById('extension-id-display'),
    btnCopyId: document.getElementById('btn-copy-id'),
    copyBtnText: document.getElementById('copy-btn-text'),
    btnRefreshStats: document.getElementById('btn-refresh-stats'),
    btnExportJson: document.getElementById('btn-export-json'),
    btnClearHistory: document.getElementById('btn-clear-history'),

    // Toast
    toast: document.getElementById('popup-toast')
  };
}

/**
 * Affiche un toast dans la popup
 */
function showToast(message, type = 'success') {
  const dom = getDOM();
  if (!dom.toast) return;
  dom.toast.textContent = message;
  dom.toast.style.background = type === 'danger' ? '#ef4444' : (type === 'info' ? '#6366f1' : '#10b981');
  dom.toast.classList.remove('hidden');

  setTimeout(() => {
    dom.toast.classList.add('hidden');
  }, 2500);
}

/**
 * Formate un timestamp relatif
 */
function formatRelativeTime(timestamp) {
  if (!timestamp) return 'Aucun tirage';
  const diffSeconds = Math.floor((Date.now() - timestamp) / 1000);

  if (diffSeconds < 60) return "À l'instant";
  if (diffSeconds < 3600) return `Il y a ${Math.floor(diffSeconds / 60)} min`;
  if (diffSeconds < 86400) return `Il y a ${Math.floor(diffSeconds / 3600)} h`;

  const date = new Date(timestamp);
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/**
 * Initialise le système d'onglets
 */
function initTabs() {
  const dom = getDOM();
  dom.tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetTabId = tab.getAttribute('data-tab');

      dom.tabs.forEach((t) => t.classList.remove('active'));
      dom.panes.forEach((p) => p.classList.remove('active'));

      tab.classList.add('active');
      const targetPane = document.getElementById(targetTabId);
      if (targetPane) {
        targetPane.classList.add('active');
      }
    });
  });
}

/**
 * Charge et affiche les statistiques globales et financières
 */
async function loadStatistics() {
  try {
    const dom = getDOM();
    const stats = await getStats();

    // 1. Indicateurs financiers
    if (dom.valTotalAvg) dom.valTotalAvg.textContent = `${stats.totalAverageValue.toLocaleString('fr-FR')} 🪙`;
    if (dom.valTotalResale) dom.valTotalResale.textContent = `${stats.totalSellValueMin.toLocaleString('fr-FR')} - ${stats.totalSellValueMax.toLocaleString('fr-FR')} 🪙`;
    if (dom.valAvgBooster) dom.valAvgBooster.textContent = `Moyenne : ${stats.avgBoosterValue.toLocaleString('fr-FR')} 🪙 / booster`;
    if (dom.valResaleBooster) dom.valResaleBooster.textContent = `Moyenne : ${stats.avgBoosterResaleMin.toLocaleString('fr-FR')} - ${stats.avgBoosterResaleMax.toLocaleString('fr-FR')} 🪙 / booster`;

    // 2. Compteurs de tirage
    if (dom.kpiBoosters) dom.kpiBoosters.textContent = stats.totalBoosters.toLocaleString('fr-FR');
    if (dom.kpiCards) dom.kpiCards.textContent = stats.totalCards.toLocaleString('fr-FR');
    if (dom.kpiLegendary) dom.kpiLegendary.textContent = stats.legendaryCount.toLocaleString('fr-FR');
    if (dom.kpiUr) dom.kpiUr.textContent = stats.urCount.toLocaleString('fr-FR');

    if (dom.badgeRateLegendary) dom.badgeRateLegendary.textContent = `${stats.legendaryRate.toFixed(2)}%`;
    if (dom.badgeRateUr) dom.badgeRateUr.textContent = `${stats.urRate.toFixed(2)}%`;

    if (dom.kpiLastPull) {
      if (stats.lastPullTimestamp) {
        dom.kpiLastPull.textContent = `Dernier : ${formatRelativeTime(stats.lastPullTimestamp)}`;
      } else {
        dom.kpiLastPull.textContent = 'En attente de tirage';
      }
    }

    if (dom.totalRatesCounter) {
      if (stats.realMarketCardsCount > 0) {
        dom.totalRatesCounter.textContent = `⚡ ${stats.realMarketCardsCount} prix réels du marché`;
        dom.totalRatesCounter.style.color = '#fa9931';
      } else {
        dom.totalRatesCounter.textContent = '100% analysé';
        dom.totalRatesCounter.style.color = '';
      }
    }

    // 3. Répartition par rareté & valeur
    renderRarityDistribution(stats.rarityBreakdown, stats.totalCards);

    // 4. Cartes récentes avec prix réels
    renderRecentCards(stats.recentCards);

  } catch (error) {
    console.error('[WikiLogix Popup] Erreur chargement statistiques :', error);
  }
}

/**
 * Construit les barres de progression avec valeur marchande par rareté
 */
function renderRarityDistribution(breakdown, totalCards) {
  const dom = getDOM();
  if (!dom.rarityContainer) return;
  dom.rarityContainer.innerHTML = '';

  const orderedCodes = ['L', 'UR', 'SR', 'R', 'PC', 'C'];

  orderedCodes.forEach((code) => {
    const fallbackConfig = RARITY_CONFIG[code] || RARITY_CONFIG.C;
    const item = (breakdown && breakdown[code]) ? breakdown[code] : {
      label: fallbackConfig.label,
      shortCode: fallbackConfig.shortCode,
      count: 0,
      rate: 0,
      totalValue: 0,
      color: fallbackConfig.color
    };

    const row = document.createElement('div');
    row.className = 'rarity-row';
    row.innerHTML = `
      <div class="rarity-info">
        <div class="rarity-label-group">
          <span class="rarity-indicator" style="background-color: ${item.color}; box-shadow: 0 0 6px ${item.color};"></span>
          <span style="color: ${item.color}; font-weight: 700;">[${item.shortCode}] ${item.label}</span>
        </div>
        <div class="rarity-count-rate">
          <strong style="color: #ffffff;">${item.count}</strong> (${item.rate.toFixed(1)}%) &bull; <span style="color: #ffe144; font-weight: 600;">${(item.totalValue || 0).toLocaleString('fr-FR')} 🪙</span>
        </div>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width: ${Math.min(item.rate, 100)}%; background-color: ${item.color}; box-shadow: 0 0 8px ${item.color}66;"></div>
      </div>
    `;

    dom.rarityContainer.appendChild(row);
  });
}

/**
 * Affiche les cartes récentes épurées de tout tag parasite
 */
function renderRecentCards(recentCards) {
  const dom = getDOM();
  if (!dom.recentList) return;
  dom.recentList.innerHTML = '';

  const validCards = (recentCards || []).filter((c) => isValidCardName(c.name));

  if (dom.recentCountBadge) dom.recentCountBadge.textContent = validCards.length;

  if (validCards.length === 0) {
    dom.recentList.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🎲</span>
        <p>Aucun tirage détecté pour le moment.</p>
        <span class="empty-hint">Ouvrez un booster sur /pulls pour démarrer l'enregistrement !</span>
      </div>
    `;
    return;
  }

  validCards.forEach((card) => {
    const norm = normalizeRarity(card.rarity);
    const rarityInfo = RARITY_CONFIG[norm] || RARITY_CONFIG.C;

    const avgP = Number(card.avgPrice) > 0
      ? Number(card.avgPrice)
      : (Number(card.suggestedPrice) > 0 ? Math.round(Number(card.suggestedPrice) / 0.625) : (Number(card.minPrice) || Number(card.lastPrice) || 0));

    const minP = avgP > 0 ? (Number(card.sellPriceMin) || Math.round(avgP * 0.50)) : (Number(card.suggestedPrice) || 0);
    const maxP = avgP > 0 ? (Number(card.sellPriceMax) || Math.round(avgP * 0.75)) : (Number(card.suggestedPrice) || 0);

    const statsDetail = (card.attack && card.defense && Number(card.attack) > 0 && Number(card.defense) > 0)
      ? `<span style="color:#94a3b8;font-size:10px;margin-left:5px;font-weight:600;">(⚔️ ${card.attack} / 🛡️ ${card.defense})</span>`
      : '';

    const pricePillText = avgP > 0
      ? `Moy : ${avgP.toLocaleString('fr-FR')} 🪙`
      : (card.suggestedPrice ? `Prix : ${Number(card.suggestedPrice).toLocaleString('fr-FR')} 🪙` : `Moy : 0 🪙`);

    const resalePillText = (minP > 0 && maxP > 0 && minP !== maxP)
      ? `Revente : ${minP.toLocaleString('fr-FR')} - ${maxP.toLocaleString('fr-FR')} 🪙`
      : (minP > 0 ? `Revente : ${minP.toLocaleString('fr-FR')} 🪙` : `Revente : 0 🪙`);

    const statusBadgeHtml = card.status === 'sold'
      ? `<span style="background:rgba(239,68,68,0.15);color:#f87171;border:1px solid rgba(239,68,68,0.35);padding:1px 6px;border-radius:4px;font-size:10px;font-weight:600;margin-left:6px;">🏷️ Vendu</span>`
      : card.status === 'traded'
        ? `<span style="background:rgba(14,165,233,0.15);color:#38bdf8;border:1px solid rgba(14,165,233,0.35);padding:1px 6px;border-radius:4px;font-size:10px;font-weight:600;margin-left:6px;">🔄 Échangé</span>`
        : '';

    const itemEl = document.createElement('div');
    itemEl.className = 'recent-item';
    itemEl.innerHTML = `
      <div class="recent-card-info">
        <div class="recent-card-name" title="${card.name}">
          <span>${card.name}</span>
          ${statusBadgeHtml}
          ${statsDetail}
        </div>
        <div class="recent-card-prices">
          <span class="price-pill-avg" title="Prix moyen du marché Wiki-Masters">${pricePillText}</span>
          <span class="price-pill-sell" title="Prix conseillé de vente (50% à 75%)">${resalePillText}</span>
        </div>
        <span class="recent-card-time">Carte ${card.cardIndex || '1'}/${card.totalInBooster || '5'} &bull; ${formatRelativeTime(card.timestamp)}</span>
      </div>
      <span class="recent-rarity-tag" style="background-color: ${rarityInfo.color}; color: ${rarityInfo.textColor}; box-shadow: 0 0 6px ${rarityInfo.color}88;">
        ${rarityInfo.shortCode}
      </span>
    `;

    dom.recentList.appendChild(itemEl);
  });
}

let cachedDiscordConfig = {
  enabled: false,
  webhookUrl: '',
  discordUserId: '',
  rules: []
};

/**
 * Charge les paramètres Discord depuis le stockage
 */
async function loadDiscordSettings() {
  try {
    cachedDiscordConfig = await getDiscordConfig();
    const dom = getDOM();

    if (dom.discordEnabledToggle) dom.discordEnabledToggle.checked = Boolean(cachedDiscordConfig.enabled);
    if (dom.discordWebhookUrl) dom.discordWebhookUrl.value = cachedDiscordConfig.webhookUrl || '';
    if (dom.discordUserId) dom.discordUserId.value = cachedDiscordConfig.discordUserId || '';

    renderDiscordRules();
  } catch (error) {
    console.error('[WikiLogix Popup] Erreur chargement config Discord :', error);
  }
}

/**
 * Affiche la liste des règles et filtres Discord dans le DOM
 */
function renderDiscordRules() {
  const dom = getDOM();
  if (!dom.discordRulesList) return;

  const rules = cachedDiscordConfig.rules || [];
  if (dom.discordRulesCount) {
    dom.discordRulesCount.textContent = `${rules.length} règle${rules.length > 1 ? 's' : ''}`;
  }

  dom.discordRulesList.innerHTML = '';

  if (rules.length === 0) {
    dom.discordRulesList.innerHTML = `
      <div class="rule-empty-state">
        <span>Aucun filtre configuré.</span>
        <span>Cliquez sur <strong>+ Ajouter un Filtre</strong> pour créer une règle avec un fil Discord spécifique.</span>
      </div>
    `;
    return;
  }

  const rarityDefinitions = [
    { code: 'L', label: '[L] Légendaire' },
    { code: 'UR', label: '[UR] Ultra Rare' },
    { code: 'SR', label: '[SR] Super Rare' },
    { code: 'R', label: '[R] Rare' },
    { code: 'PC', label: '[PC] Peu Commune' },
    { code: 'C', label: '[C] Commune' }
  ];

  rules.forEach((rule, index) => {
    const card = document.createElement('div');
    card.className = `discord-rule-card ${rule.enabled === false ? 'rule-disabled' : ''}`;
    card.setAttribute('data-rule-id', rule.id);

    const raritiesHtml = rarityDefinitions.map(r => {
      const isChecked = rule.rarities ? Boolean(rule.rarities[r.code]) : true;
      return `
        <label class="rarity-filter-chip chip-${r.code.toLowerCase()}">
          <input type="checkbox" class="rule-rarity-checkbox" data-rule-id="${rule.id}" data-rarity="${r.code}" ${isChecked ? 'checked' : ''}>
          <span class="chip-dot"></span>
          <span class="chip-label">${r.label}</span>
        </label>
      `;
    }).join('');

    card.innerHTML = `
      <div class="rule-header-actions">
        <input type="text" class="rule-name-input" data-rule-id="${rule.id}" value="${rule.name || `Filtre #${index + 1}`}" placeholder="Nom du filtre / fil">
        <div class="rule-actions-group">
          <label class="switch-toggle" title="Activer ou désactiver ce filtre" style="transform: scale(0.85); margin-right: 2px;">
            <input type="checkbox" class="rule-enable-toggle" data-rule-id="${rule.id}" ${rule.enabled !== false ? 'checked' : ''}>
            <span class="slider-round"></span>
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
        <div class="form-field">
          <label>ID du Fil Discord (Thread ID)</label>
          <input type="text" class="text-input rule-thread-input" data-rule-id="${rule.id}" value="${rule.threadId || ''}" placeholder="Ex: 119482938491823901 (Optionnel si salon principal)">
        </div>
      </div>

      <div class="filter-section">
        <div class="filter-section-header">
          <span class="filter-section-title">Raretés cibles</span>
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
          <div class="input-with-currency flex-1">
            <input type="number" class="text-input rule-min-price-input" data-rule-id="${rule.id}" min="0" step="10" value="${rule.minPrice > 0 ? rule.minPrice : ''}" placeholder="Min (0)">
            <span class="currency-addon">🪙</span>
          </div>
          <span class="price-range-separator">à</span>
          <div class="input-with-currency flex-1">
            <input type="number" class="text-input rule-max-price-input" data-rule-id="${rule.id}" min="0" step="10" value="${(rule.maxPrice !== null && rule.maxPrice !== undefined && rule.maxPrice !== '') ? rule.maxPrice : ''}" placeholder="Max (∞)">
            <span class="currency-addon">🪙</span>
          </div>
        </div>
      </div>
    `;

    dom.discordRulesList.appendChild(card);
  });
}

let isSelfDiscordSaving = false;
let discordSaveTimeout = null;

/**
 * Sauvegarde avec temporisation (debounce) pour ne pas spammer le stockage lors de la frappe
 */
function debouncedSaveDiscordSettings(showNotification = false, delayMs = 600) {
  if (discordSaveTimeout) {
    clearTimeout(discordSaveTimeout);
  }
  discordSaveTimeout = setTimeout(() => {
    saveDiscordSettings(showNotification);
  }, delayMs);
}

/**
 * Enregistre la configuration Discord
 */
async function saveDiscordSettings(showNotification = true) {
  try {
    const dom = getDOM();
    if (dom.discordEnabledToggle) cachedDiscordConfig.enabled = Boolean(dom.discordEnabledToggle.checked);
    if (dom.discordWebhookUrl) cachedDiscordConfig.webhookUrl = (dom.discordWebhookUrl.value || '').trim();
    if (dom.discordUserId) cachedDiscordConfig.discordUserId = (dom.discordUserId.value || '').trim();

    isSelfDiscordSaving = true;
    await saveDiscordConfig(cachedDiscordConfig);
    if (showNotification) {
      showToast('Configuration Discord enregistrée !', 'success');
    }
  } catch (error) {
    console.error('[WikiLogix Popup] Erreur sauvegarde config Discord :', error);
    if (showNotification) {
      showToast('Erreur lors de la sauvegarde', 'danger');
    }
  }
}

/**
 * Initialise les écouteurs de la section Discord
 */
function initDiscordSection() {
  const dom = getDOM();

  // Bouton Enregistrer
  if (dom.btnSaveDiscordConfig) {
    dom.btnSaveDiscordConfig.addEventListener('click', async () => {
      if (discordSaveTimeout) clearTimeout(discordSaveTimeout);
      await saveDiscordSettings(true);
    });
  }

  // Interrupteur ON/OFF Discord
  if (dom.discordEnabledToggle) {
    dom.discordEnabledToggle.addEventListener('change', async () => {
      await saveDiscordSettings(false);
      if (dom.discordEnabledToggle.checked) {
        showToast('Alertes Discord activées');
      } else {
        showToast('Alertes Discord désactivées', 'info');
      }
    });
  }

  // Sauvegarde discrète et debouncée des champs globaux
  if (dom.discordWebhookUrl) {
    dom.discordWebhookUrl.addEventListener('input', () => {
      cachedDiscordConfig.webhookUrl = dom.discordWebhookUrl.value.trim();
      debouncedSaveDiscordSettings(false);
    });
  }
  if (dom.discordUserId) {
    dom.discordUserId.addEventListener('input', () => {
      cachedDiscordConfig.discordUserId = dom.discordUserId.value.trim();
      debouncedSaveDiscordSettings(false);
    });
  }

  // Bouton "+ Ajouter un Filtre"
  if (dom.btnAddDiscordRule) {
    dom.btnAddDiscordRule.addEventListener('click', () => {
      const nextIndex = (cachedDiscordConfig.rules || []).length + 1;
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
      if (!Array.isArray(cachedDiscordConfig.rules)) cachedDiscordConfig.rules = [];
      cachedDiscordConfig.rules.push(newRule);
      renderDiscordRules();
      debouncedSaveDiscordSettings(false, 200);
      showToast(`Filtre #${nextIndex} ajouté !`);
    });
  }

  // Écouteurs délégués sur le conteneur des règles
  if (dom.discordRulesList) {
    // Modifications des champs textuels & numériques (sans recréer le DOM pour préserver le focus)
    dom.discordRulesList.addEventListener('input', (e) => {
      const target = e.target;
      const ruleId = target.getAttribute('data-rule-id');
      if (!ruleId) return;

      const rule = (cachedDiscordConfig.rules || []).find((r) => r.id === ruleId);
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

      debouncedSaveDiscordSettings(false);
    });

    // Modifications des cases à cocher & toggles
    dom.discordRulesList.addEventListener('change', (e) => {
      const target = e.target;
      const ruleId = target.getAttribute('data-rule-id');
      if (!ruleId) return;

      const rule = (cachedDiscordConfig.rules || []).find((r) => r.id === ruleId);
      if (!rule) return;

      if (target.classList.contains('rule-enable-toggle')) {
        rule.enabled = target.checked;
        const card = dom.discordRulesList.querySelector(`.discord-rule-card[data-rule-id="${ruleId}"]`);
        if (card) {
          card.classList.toggle('rule-disabled', !rule.enabled);
        }
      } else if (target.classList.contains('rule-rarity-checkbox')) {
        const rarity = target.getAttribute('data-rarity');
        if (!rule.rarities) rule.rarities = {};
        rule.rarities[rarity] = target.checked;
      }

      debouncedSaveDiscordSettings(false, 300);
    });

    // Actions Clic (Supprimer & Tester fil)
    dom.discordRulesList.addEventListener('click', async (e) => {
      const btnDelete = e.target.closest('.btn-delete-rule');
      const btnTest = e.target.closest('.btn-test-rule');

      if (btnDelete) {
        const ruleId = btnDelete.getAttribute('data-rule-id');
        const rule = (cachedDiscordConfig.rules || []).find((r) => r.id === ruleId);
        const confirmDelete = window.confirm(`Supprimer le filtre "${rule?.name || 'ce filtre'}" ?`);
        if (confirmDelete) {
          cachedDiscordConfig.rules = cachedDiscordConfig.rules.filter((r) => r.id !== ruleId);
          renderDiscordRules();
          saveDiscordSettings(false);
          showToast('Filtre supprimé.', 'info');
        }
        return;
      }

      if (btnTest) {
        const ruleId = btnTest.getAttribute('data-rule-id');
        const rule = (cachedDiscordConfig.rules || []).find((r) => r.id === ruleId);
        if (!rule) return;

        const webhookUrl = (rule.customWebhookUrl || cachedDiscordConfig.webhookUrl || dom.discordWebhookUrl?.value || '').trim();
        const discordUserId = (rule.pingUserId || cachedDiscordConfig.discordUserId || dom.discordUserId?.value || '').trim();

        if (!webhookUrl) {
          showToast('Veuillez saisir une URL de Webhook Discord valide', 'danger');
          dom.discordWebhookUrl?.focus();
          return;
        }

        const origHtml = btnTest.innerHTML;
        btnTest.disabled = true;
        btnTest.style.opacity = '0.7';
        btnTest.innerHTML = `<span>...</span>`;

        try {
          await saveDiscordSettings(false);

          const response = await new Promise((resolve) => {
            chrome.runtime.sendMessage(
              {
                type: 'TEST_DISCORD_WEBHOOK',
                payload: {
                  webhookUrl,
                  threadId: rule.threadId,
                  discordUserId,
                  ruleName: rule.name
                }
              },
              (resp) => {
                if (chrome.runtime.lastError) {
                  resolve({ success: false, error: chrome.runtime.lastError.message });
                } else {
                  resolve(resp || { success: false, error: 'Réponse vide' });
                }
              }
            );
          });

          if (response && response.success) {
            showToast(`✅ Test envoyé dans "${rule.name}" !`, 'success');
          } else {
            showToast(`❌ Échec envoi : ${response?.error || 'Erreur webhook'}`, 'danger');
          }
        } catch (err) {
          showToast(`❌ Erreur : ${err.message}`, 'danger');
        } finally {
          btnTest.disabled = false;
          btnTest.style.opacity = '1';
          btnTest.innerHTML = origHtml;
        }
      }
    });
  }

  // Bouton Tester le Webhook Principal (sans fil)
  if (dom.btnTestDiscord) {
    dom.btnTestDiscord.addEventListener('click', async () => {
      const webhookUrl = (dom.discordWebhookUrl?.value || '').trim();
      const discordUserId = (dom.discordUserId?.value || '').trim();

      if (!webhookUrl) {
        showToast('Veuillez saisir une URL de Webhook Discord valide', 'danger');
        dom.discordWebhookUrl?.focus();
        return;
      }

      if (!webhookUrl.startsWith('https://discord.com/api/webhooks/') && !webhookUrl.startsWith('https://discordapp.com/api/webhooks/')) {
        showToast("L'URL doit commencer par https://discord.com/api/webhooks/", 'danger');
        return;
      }

      const originalHtml = dom.btnTestDiscord.innerHTML;
      dom.btnTestDiscord.disabled = true;
      dom.btnTestDiscord.style.opacity = '0.7';
      dom.btnTestDiscord.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin-icon">
          <line x1="12" y1="2" x2="12" y2="6"></line>
          <line x1="12" y1="18" x2="12" y2="22"></line>
          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
          <line x1="2" y1="12" x2="6" y2="12"></line>
          <line x1="18" y1="12" x2="22" y2="12"></line>
          <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
          <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
        </svg>
        <span>Envoi...</span>
      `;

      try {
        await saveDiscordSettings(false);

        const response = await new Promise((resolve) => {
          chrome.runtime.sendMessage(
            {
              type: 'TEST_DISCORD_WEBHOOK',
              payload: { webhookUrl, discordUserId }
            },
            (resp) => {
              if (chrome.runtime.lastError) {
                resolve({ success: false, error: chrome.runtime.lastError.message });
              } else {
                resolve(resp || { success: false, error: 'Réponse vide' });
              }
            }
          );
        });

        if (response && response.success) {
          showToast('✅ Embed de test envoyé sur le salon principal !', 'success');
        } else {
          showToast(`❌ Échec envoi : ${response?.error || 'Erreur webhook'}`, 'danger');
        }
      } catch (err) {
        console.error('Erreur test webhook :', err);
        showToast(`❌ Erreur : ${err.message}`, 'danger');
      } finally {
        dom.btnTestDiscord.disabled = false;
        dom.btnTestDiscord.style.opacity = '1';
        dom.btnTestDiscord.innerHTML = originalHtml;
      }
    });
  }
}

/**
 * Initialise l'onglet de configuration
 */
function initConfigSection() {
  const dom = getDOM();
  const extensionId = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id)
    ? chrome.runtime.id
    : 'extension_id_indisponible';

  if (dom.extensionIdDisplay) dom.extensionIdDisplay.textContent = extensionId;

  if (dom.btnCopyId) {
    dom.btnCopyId.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(extensionId);
        if (dom.copyBtnText) dom.copyBtnText.textContent = 'Copié !';
        dom.btnCopyId.style.background = '#10b981';
        showToast('ID copié dans le presse-papier !');

        setTimeout(() => {
          if (dom.copyBtnText) dom.copyBtnText.textContent = 'Copier';
          dom.btnCopyId.style.background = '';
        }, 2000);
      } catch (err) {
        console.error('Erreur copie ID :', err);
        showToast('Erreur lors de la copie', 'danger');
      }
    });
  }

  if (dom.btnOpenDashboard) {
    dom.btnOpenDashboard.addEventListener('click', () => {
      const targetDashboardUrl = 'https://bzhkylian.github.io/WikiLogix/dashboard';
      showToast('Redirection vers la plateforme...', 'info');

      setTimeout(() => {
        if (typeof chrome !== 'undefined' && chrome.tabs) {
          chrome.tabs.create({ url: targetDashboardUrl });
        } else {
          window.open(targetDashboardUrl, '_blank');
        }
      }, 300);
    });
  }

  const btnOpenDiscord = document.getElementById('btn-open-discord');
  if (btnOpenDiscord) {
    btnOpenDiscord.addEventListener('click', (e) => {
      e.preventDefault();
      const discordUrl = 'https://discord.gg/wikilogix';
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.create({ url: discordUrl });
      } else {
        window.open(discordUrl, '_blank');
      }
    });
  }

  const footerDiscordLink = document.getElementById('footer-discord-link');
  if (footerDiscordLink) {
    footerDiscordLink.addEventListener('click', (e) => {
      e.preventDefault();
      const discordUrl = 'https://discord.gg/wikilogix';
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.create({ url: discordUrl });
      } else {
        window.open(discordUrl, '_blank');
      }
    });
  }

  if (dom.btnRefreshStats) {
    dom.btnRefreshStats.addEventListener('click', async () => {
      dom.btnRefreshStats.style.opacity = '0.6';
      await loadStatistics();
      dom.btnRefreshStats.style.opacity = '1';
      showToast('Statistiques & Prix actualisés !');
    });
  }

  if (dom.btnExportJson) {
    dom.btnExportJson.addEventListener('click', async () => {
      try {
        const jsonString = await exportDataAsJSON();
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const filename = `wikilogix_export_${new Date().toISOString().split('T')[0]}.json`;

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('Exportation terminée (.JSON) !');
      } catch (err) {
        console.error('Erreur export :', err);
        showToast('Échec de l\'exportation', 'danger');
      }
    });
  }

  if (dom.btnClearHistory) {
    dom.btnClearHistory.addEventListener('click', async () => {
      const confirmDelete = window.confirm(
        '⚠️ Êtes-vous certain de vouloir réinitialiser l\'ensemble de vos statistiques, prix et historique de tirages ?'
      );

      if (confirmDelete) {
        try {
          if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            await new Promise((resolve) => {
              chrome.runtime.sendMessage({ type: 'CLEAR_HISTORY' }, resolve);
            });
          }
          await clearHistory();
          await loadStatistics();
          showToast('Historique intégralement effacé.', 'danger');
        } catch (err) {
          console.error('Erreur suppression :', err);
          await clearHistory();
          await loadStatistics();
          showToast('Historique effacé.', 'danger');
        }
      }
    });
  }
}

/**
 * Initialisation immédiate et sécurisée
 */
function initPopup() {
  initTabs();
  initConfigSection();
  initDiscordSection();
  loadDiscordSettings();
  loadStatistics();

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local') {
        loadStatistics();
        if (changes[STORAGE_KEYS?.DISCORD_CONFIG || 'wikilogix_discord_config']) {
          // Si la modification provient de la popup elle-même ou que l'utilisateur est en train de taper dans un champ, ne pas écraser le DOM
          if (isSelfDiscordSaving) {
            isSelfDiscordSaving = false;
            return;
          }
          const activeEl = document.activeElement;
          const isUserTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT');
          if (!isUserTyping) {
            loadDiscordSettings();
          }
        }
      }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPopup);
} else {
  initPopup();
}
