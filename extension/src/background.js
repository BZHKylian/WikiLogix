import {
  STORAGE_KEYS,
  getStorageData,
  setStorageData,
  recordCardInSession,
  updateCardMarketPrice,
  getStats,
  clearHistory,
  exportDataAsJSON,
  getDiscordConfig,
  saveDiscordConfig,
  matchesDiscordFilters,
  getMatchingDiscordRules,
  evaluateRuleMatch,
  normalizeRarity,
  RARITY_CONFIG
} from './modules/storage.js';

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log(`[WikiLogix Background] Service Worker initialisé (v1.6.0 - Raison: ${details.reason})`);

  const existingData = await getStorageData([
    STORAGE_KEYS.BOOSTERS,
    STORAGE_KEYS.CARDS,
    STORAGE_KEYS.MARKET_PRICES,
    STORAGE_KEYS.DISCORD_CONFIG
  ]);

  if (!existingData[STORAGE_KEYS.BOOSTERS]) {
    await setStorageData({
      [STORAGE_KEYS.BOOSTERS]: [],
      [STORAGE_KEYS.CARDS]: [],
      [STORAGE_KEYS.MARKET_PRICES]: {}
    });
  }

  await updateExtensionBadge();
});

/**
 * Met à jour le badge avec le nombre total de boosters
 */
async function updateExtensionBadge() {
  try {
    const stats = await getStats();
    const count = stats.totalBoosters;

    if (count > 0) {
      await chrome.action.setBadgeText({ text: String(count) });
      await chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });
    } else {
      await chrome.action.setBadgeText({ text: '' });
    }
  } catch (error) {
    console.warn('[WikiLogix Background] Erreur badge :', error);
  }
}

// Mise à jour automatique du badge lors des changements de stockage
if (chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      updateExtensionBadge();
    }
  });
}

const DISCORD_COLOR_MAP = {
  L: 0xffe144,
  UR: 0xfa9931,
  SR: 0xed6fa3,
  R: 0xc6a7f2,
  PC: 0xb1cff2,
  C: 0xb8f2d5
};

/**
 * Construit l'URL de Webhook en y ajoutant le thread_id s'il est présent
 */
function buildWebhookUrlWithThread(baseWebhookUrl, threadId) {
  if (!baseWebhookUrl) return '';
  const cleanUrl = baseWebhookUrl.trim();
  const cleanThread = (threadId || '').trim();
  if (!cleanThread) return cleanUrl;

  try {
    const parsed = new URL(cleanUrl);
    parsed.searchParams.set('thread_id', cleanThread);
    return parsed.toString();
  } catch (_) {
    return cleanUrl.includes('?')
      ? `${cleanUrl}&thread_id=${encodeURIComponent(cleanThread)}`
      : `${cleanUrl}?thread_id=${encodeURIComponent(cleanThread)}`;
  }
}

/**
 * Envoie une notification Discord formatée sous forme d'embed vers chaque fil/règle correspondant
 */
async function sendCardToDiscord(cardData, customConfig = null) {
  try {
    const config = customConfig || await getDiscordConfig();
    if (!config || !config.enabled) return { success: false, reason: 'disabled' };

    const matchingRules = getMatchingDiscordRules(cardData, config);
    if (!matchingRules || matchingRules.length === 0) {
      return { success: false, reason: 'no_matching_rules' };
    }

    const normRarity = normalizeRarity(cardData.rarity);
    const meta = RARITY_CONFIG[normRarity] || RARITY_CONFIG.C;
    const avgPrice = Number(cardData.avgPrice) > 0 ? Number(cardData.avgPrice) : 0;
    const sellMin = Math.round(avgPrice * 0.50);
    const sellMax = Math.round(avgPrice * 0.75);

    const color = DISCORD_COLOR_MAP[normRarity] || 0x6366f1;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const fields = [
      {
        name: "Rareté",
        value: `\`[${meta.shortCode}] ${meta.label}\``,
        inline: true
      }
    ];

    if (cardData.attack || cardData.defense) {
      fields.push({
        name: "Combat",
        value: `⚔️ **${cardData.attack || '-'}** | 🛡️ **${cardData.defense || '-'}**`,
        inline: true
      });
    }

    if (avgPrice > 0) {
      const minP = cardData.minPrice ? Number(cardData.minPrice) : avgPrice;
      const maxP = cardData.maxPrice ? Number(cardData.maxPrice) : avgPrice;
      fields.push({
        name: "Marché & Revente 🪙",
        value: `• **Prix Moyen :** **${avgPrice.toLocaleString('fr-FR')} 🪙**\n• **Revente conseillée (50-75%) :** **${sellMin.toLocaleString('fr-FR')} - ${sellMax.toLocaleString('fr-FR')} 🪙**\n• Fourchette marché : ${minP.toLocaleString('fr-FR')} 🪙 - ${maxP.toLocaleString('fr-FR')} 🪙`,
        inline: false
      });
    } else {
      fields.push({
        name: "Marché 🪙",
        value: `• **Aucun cours récent** (0 vente enregistrée)`,
        inline: false
      });
    }

    const baseEmbed = {
      title: `🎴 ${cardData.name}`,
      description: cardData.description ? `*${cardData.description.slice(0, 300)}*` : undefined,
      color: color,
      fields: fields,
      footer: {
        text: `WikiLogix Tracker • Packé le ${timeStr}`,
        icon_url: "https://i.imgur.com/MUpcyUn.jpeg"
      },
      timestamp: now.toISOString()
    };

    if (cardData.imageUrl || cardData.image) {
      const img = cardData.imageUrl || cardData.image;
      if (typeof img === 'string' && (img.startsWith('http') || img.startsWith('//'))) {
        baseEmbed.image = { url: img.startsWith('//') ? `https:${img}` : img };
      }
    }

    const isMajor = normRarity === 'L' || normRarity === 'UR' || avgPrice >= 500;
    const results = [];

    // Envoi individuel pour chaque fil ciblé par les règles correspondantes
    for (const rule of matchingRules) {
      const targetBaseUrl = (rule.customWebhookUrl || config.webhookUrl || '').trim();
      if (!targetBaseUrl) continue;

      const targetFullUrl = buildWebhookUrlWithThread(targetBaseUrl, rule.threadId);

      let content = undefined;
      const effectivePing = (rule.pingUserId || config.discordUserId || '').trim();
      if (effectivePing && (isMajor || rule.pingUserId)) {
        content = effectivePing.startsWith('@') ? effectivePing : `<@${effectivePing}>`;
      }

      const payload = {
        username: "WikiLogix Alert",
        avatar_url: "https://i.imgur.com/MUpcyUn.jpeg",
        content: content,
        embeds: [
          {
            ...baseEmbed,
            footer: {
              text: `WikiLogix • ${rule.name || 'Filtre'} • ${timeStr}`,
              icon_url: "https://i.imgur.com/MUpcyUn.jpeg"
            }
          }
        ]
      };

      try {
        const resp = await fetch(targetFullUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        results.push({ ruleId: rule.id, ruleName: rule.name, success: resp.ok, status: resp.status });
      } catch (err) {
        console.error(`[WikiLogix Background] Erreur envoi Discord vers règle ${rule.name} :`, err);
        results.push({ ruleId: rule.id, ruleName: rule.name, success: false, error: err.message });
      }
    }

    return { success: results.some((r) => r.success), details: results };
  } catch (err) {
    console.error('[WikiLogix Background] Erreur envoi Discord :', err);
    return { success: false, error: err.message };
  }
}

/**
 * Envoie un embed de test interactif pour valider un webhook ou un fil spécifique
 */
async function sendDiscordTestWebhook({ webhookUrl, threadId, discordUserId, ruleName }) {
  if (!webhookUrl) throw new Error("URL de Webhook manquante");

  const targetFullUrl = buildWebhookUrlWithThread(webhookUrl, threadId);

  let content = undefined;
  if (discordUserId) {
    const cleanId = discordUserId.trim();
    content = cleanId.startsWith('@') ? cleanId : `<@${cleanId}>`;
  }

  const embed = {
    title: "🔔 Test de Connexion WikiLogix Réussi !",
    description: ruleName
      ? `Ce message confirme la bonne réception dans le fil : **${ruleName}**.`
      : "Votre Webhook Discord est parfaitement configuré et connecté à **WikiLogix**.",
    color: 0x10b981,
    fields: [
      {
        name: "Statut",
        value: "✅ Opérationnel",
        inline: true
      },
      {
        name: "Destination (Thread)",
        value: threadId ? `🧵 Fil : \`${threadId}\`` : "Salon principal",
        inline: true
      },
      {
        name: "Conseils de Revente",
        value: "Calculés automatiquement à 50% - 75%",
        inline: false
      }
    ],
    footer: {
      text: "WikiLogix • Alertes & Tracker Multi-Fils",
      icon_url: "https://i.imgur.com/MUpcyUn.jpeg"
    },
    timestamp: new Date().toISOString()
  };

  const payload = {
    username: "WikiLogix Alert",
    avatar_url: "https://i.imgur.com/MUpcyUn.jpeg",
    content: content,
    embeds: [embed]
  };

  const resp = await fetch(targetFullUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!resp.ok) {
    const errorText = await resp.text().catch(() => '');
    throw new Error(`Erreur Discord HTTP ${resp.status}${errorText ? ' : ' + errorText : ''}`);
  }

  return true;
}

// Réception des messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return false;

  (async () => {
    try {
      switch (message.type) {
        case 'UPDATE_BADGE': {
          await updateExtensionBadge();
          sendResponse({ success: true });
          break;
        }

        case 'RECORD_CARD': {
          const result = await recordCardInSession(message.payload, {
            url: sender.tab?.url || message.payload.url || 'https://www.wiki-masters.com/pulls'
          });
          await updateExtensionBadge();
          sendResponse({ success: true, result });
          break;
        }

        case 'UPDATE_CARD_MARKET_PRICE': {
          const { cardName, rarity } = message.payload;
          const result = await updateCardMarketPrice(cardName, rarity, message.payload);
          sendResponse({ success: true, result });
          break;
        }

        case 'SEND_DISCORD_NOTIFICATION': {
          const result = await sendCardToDiscord(message.payload);
          sendResponse({ success: true, result });
          break;
        }

        case 'TEST_DISCORD_WEBHOOK': {
          const { webhookUrl, threadId, discordUserId, ruleName } = message.payload;
          await sendDiscordTestWebhook({ webhookUrl, threadId, discordUserId, ruleName });
          sendResponse({ success: true });
          break;
        }

        case 'GET_DISCORD_CONFIG': {
          const config = await getDiscordConfig();
          sendResponse({ success: true, data: config });
          break;
        }

        case 'SAVE_DISCORD_CONFIG': {
          const saved = await saveDiscordConfig(message.payload);
          sendResponse({ success: true, data: saved });
          break;
        }

        case 'GET_STATS': {
          const stats = await getStats();
          sendResponse({ success: true, data: stats });
          break;
        }

        case 'GET_EXTENSION_ID': {
          sendResponse({ success: true, id: chrome.runtime.id });
          break;
        }

        case 'CLEAR_HISTORY': {
          await clearHistory();
          await updateExtensionBadge();
          sendResponse({ success: true });
          break;
        }

        case 'EXPORT_DATA': {
          const jsonString = await exportDataAsJSON();
          sendResponse({ success: true, data: jsonString });
          break;
        }

        default:
          sendResponse({ success: false, error: 'Type de message non reconnu' });
      }
    } catch (err) {
      console.error('[WikiLogix Background] Erreur :', err);
      sendResponse({ success: false, error: err.message });
    }
  })();

  return true;
});

// Écoute externe pour Dashboard
if (chrome.runtime.onMessageExternal) {
  chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
    (async () => {
      try {
        if (!message) return;
        if (message.type === 'PING' || message.action === 'ping') {
          sendResponse({ success: true, version: '1.6.0', extensionId: chrome.runtime.id });
        } else if (message.type === 'FETCH_STATS' || message.type === 'GET_STATS' || message.action === 'getWikiMastersData') {
          const stats = await getStats();
          const rawCards = (await getStorageData([STORAGE_KEYS.CARDS]))[STORAGE_KEYS.CARDS] || [];
          const rawBoosters = (await getStorageData([STORAGE_KEYS.BOOSTERS]))[STORAGE_KEYS.BOOSTERS] || [];
          const marketPrices = (await getStorageData([STORAGE_KEYS.MARKET_PRICES]))[STORAGE_KEYS.MARKET_PRICES] || {};
          const discordConfig = await getDiscordConfig();

          sendResponse({
            success: true,
            data: {
              stats,
              cards: rawCards,
              boosters: rawBoosters,
              marketPrices,
              discordConfig
            }
          });
        } else if (message.action === 'saveWikiMastersConfig' || message.type === 'SAVE_DISCORD_CONFIG') {
          const saved = await saveDiscordConfig(message.config || message.payload);
          sendResponse({ success: true, data: saved });
        } else {
          sendResponse({ success: false, error: 'Action inconnue' });
        }
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  });
}

