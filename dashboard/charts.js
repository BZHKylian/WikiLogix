/**
 * WikiMasters Web Dashboard - Moteur Graphique Natif HTML5 Canvas
 * Rendu Ultra-HD Retina Display (devicePixelRatio) & Animations 60 FPS
 * Graphiques : Area Chart (Évolution des gains), Donut Chart (Raretés), Horizontal Bars (Paliers de prix)
 */

import { OFFICIAL_RARITIES } from './mock-data.js';

/**
 * Configure un canvas pour le support Retina haute résolution
 */
function setupRetinaCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));

  const ctx = canvas.getContext('2d');
  ctx.resetTransform();
  ctx.scale(dpr, dpr);
  return { ctx, width: rect.width, height: rect.height, dpr };
}

/**
 * ============================================================================
 * 1. GRAPHIQUE D'ÉVOLUTION DES GAINS CUMULÉS (AREA CHART BÉZIER NÉON CYAN)
 * ============================================================================
 */
export class CumulativeGainsChart {
  constructor(canvasId, tooltipId) {
    this.canvas = document.getElementById(canvasId);
    this.tooltip = document.getElementById(tooltipId);
    this.dataPoints = [];
    this.hoverIndex = -1;
    this.animationProgress = 1;
    this.animationFrame = null;

    if (this.canvas) {
      this.initEvents();
      this.resizeObserver = new ResizeObserver(() => this.render());
      this.resizeObserver.observe(this.canvas.parentElement);
    }
  }

  setData(cards) {
    if (!Array.isArray(cards) || cards.length === 0) {
      this.dataPoints = [];
      this.render();
      return;
    }

    // Tri chronologique des cartes
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
    const duration = 650;

    const step = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      this.animationProgress = Math.min(1, elapsed / duration);
      // Easing cubic out
      const ease = 1 - Math.pow(1 - this.animationProgress, 3);
      this.render(ease);

      if (this.animationProgress < 1) {
        this.animationFrame = requestAnimationFrame(step);
      }
    };

    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = requestAnimationFrame(step);
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
    const dateStr = new Date(pt.timestamp).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
    
    // Positionnement intelligent
    const tooltipWidth = this.tooltip.offsetWidth || 190;
    let leftPos = posX;
    if (leftPos + tooltipWidth > rect.width - 20) {
      leftPos = posX - tooltipWidth - 10;
    } else {
      leftPos = posX + 15;
    }
    
    this.tooltip.style.left = `${leftPos}px`;
    this.tooltip.style.top = `30px`;
  }

  render(progress = 1) {
    if (!this.canvas) return;
    const { ctx, width, height } = setupRetinaCanvas(this.canvas);
    ctx.clearRect(0, 0, width, height);

    const padding = { top: 25, right: 30, bottom: 40, left: 65 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    if (this.dataPoints.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '14px "Inter", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Aucune donnée de tirage disponible', width / 2, height / 2);
      return;
    }

    const maxValue = Math.max(...this.dataPoints.map((d) => d.cumulativeValue), 100);
    const stepX = chartWidth / Math.max(1, this.dataPoints.length - 1);

    // 1. Grille et axes horizontaux
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

      ctx.fillText(`${Math.round(yVal).toLocaleString('fr-FR')} 🪙`, padding.left - 10, yPos + 4);
    }

    // Calcul des coordonnées des points
    const points = this.dataPoints.map((pt, i) => {
      const x = padding.left + i * stepX;
      const ratio = (pt.cumulativeValue / maxValue) * progress;
      const y = padding.top + chartHeight - (chartHeight * ratio);
      return { x, y, raw: pt };
    });

    if (points.length < 2) {
      // Point unique
      const p = points[0];
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#06b6d4';
      ctx.fill();
      return;
    }

    // 2. Dégradé lumineux sous la courbe (Area Neon Cyan/Gemstone)
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

    // 3. Courbe de Bézier Principale Fluo
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

    // 4. Ligne de réticule et point de focus au survol
    if (this.hoverIndex >= 0 && this.hoverIndex < points.length) {
      const p = points[this.hoverIndex];

      // Ligne verticale néon
      ctx.save();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(p.x, padding.top);
      ctx.lineTo(p.x, padding.top + chartHeight);
      ctx.stroke();
      ctx.restore();

      // Halo externe
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = `${p.raw.rarityColor}44`;
      ctx.fill();

      // Point central
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = p.raw.rarityColor;
      ctx.lineWidth = 3;
      ctx.fill();
      ctx.stroke();
    }

    // 5. Axe horizontal des cartes (Labels 1, 5, 10, ...)
    ctx.fillStyle = '#64748b';
    ctx.font = '10px "Inter", system-ui, sans-serif';
    ctx.textAlign = 'center';

    const maxLabels = Math.min(10, this.dataPoints.length);
    const labelStep = Math.max(1, Math.floor(this.dataPoints.length / maxLabels));

    for (let i = 0; i < this.dataPoints.length; i += labelStep) {
      const x = padding.left + i * stepX;
      ctx.fillText(`Carte #${i + 1}`, x, height - 15);
    }
  }
}

/**
 * ============================================================================
 * 2. DIAGRAMME DONUT DE RÉPARTITION DES RARETÉS (DONUT CHART GEMS)
 * ============================================================================
 */
export class RarityDonutChart {
  constructor(canvasId, legendId, centerCountId, centerLabelId) {
    this.canvas = document.getElementById(canvasId);
    this.legendContainer = document.getElementById(legendId);
    this.centerCountEl = document.getElementById(centerCountId);
    this.centerLabelEl = document.getElementById(centerLabelId);
    this.slices = [];
    this.totalCards = 0;
    this.hoverSlice = -1;
    this.animationProgress = 1;
    this.animationFrame = null;

    if (this.canvas) {
      this.initEvents();
      this.resizeObserver = new ResizeObserver(() => this.render());
      this.resizeObserver.observe(this.canvas.parentElement);
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
    const duration = 700;

    const step = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      this.animationProgress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - this.animationProgress, 3);
      this.render(ease);

      if (this.animationProgress < 1) {
        this.animationFrame = requestAnimationFrame(step);
      }
    };

    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = requestAnimationFrame(step);
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
    // Décalage pour démarrer à -90 deg (haut)
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
      this.centerCountEl.textContent = `${slice.count}`;
      this.centerCountEl.style.color = slice.color;
      this.centerLabelEl.textContent = `${slice.label} (${slice.rate.toFixed(1)}%)`;
    } else {
      this.centerCountEl.textContent = `${this.totalCards}`;
      this.centerCountEl.style.color = '#ffffff';
      this.centerLabelEl.textContent = 'Cartes Totales';
    }
  }

  render(progress = 1) {
    if (!this.canvas) return;
    const { ctx, width, height } = setupRetinaCanvas(this.canvas);
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

      // Séparateur fin
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

/**
 * ============================================================================
 * 3. GRAPHIQUE DES PALIERS DE PRIX (HORIZONTAL ROUNDED BARS)
 * ============================================================================
 */
export class PriceTierBarChart {
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
    this.animationFrame = null;

    if (this.canvas) {
      this.initEvents();
      this.resizeObserver = new ResizeObserver(() => this.render());
      this.resizeObserver.observe(this.canvas.parentElement);
    }
  }

  setData(cards) {
    // Réinitialisation
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
    const duration = 650;

    const step = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      this.animationProgress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - this.animationProgress, 3);
      this.render(ease);

      if (this.animationProgress < 1) {
        this.animationFrame = requestAnimationFrame(step);
      }
    };

    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = requestAnimationFrame(step);
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
    if (idx >= 0 && idx < this.tiers.length) {
      this.hoverTier = idx;
    } else {
      this.hoverTier = -1;
    }
    this.render(1);
  }

  render(progress = 1) {
    if (!this.canvas) return;
    const { ctx, width, height } = setupRetinaCanvas(this.canvas);
    ctx.clearRect(0, 0, width, height);

    const padding = { top: 20, right: 110, bottom: 20, left: 110 };
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

      // 1. Label de gauche (Ex: +1000 🪙)
      ctx.fillStyle = isHovered ? '#ffffff' : '#94a3b8';
      ctx.font = `${isHovered ? 'bold ' : ''}12px "JetBrains Mono", monospace`;
      ctx.textAlign = 'right';
      ctx.fillText(tier.label, padding.left - 15, yCenter + 4);

      // 2. Fond de la barre (track)
      ctx.beginPath();
      ctx.roundRect(padding.left, yBar, chartWidth, barHeight, barHeight / 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.fill();

      // 3. Barre remplie colorée arrondie avec gradient
      if (tier.count > 0) {
        ctx.save();
        const grad = ctx.createLinearGradient(padding.left, 0, padding.left + currentWidth, 0);
        grad.addColorStop(0, `${tier.color}99`);
        grad.addColorStop(1, tier.color);

        ctx.beginPath();
        ctx.roundRect(padding.left, yBar, currentWidth, barHeight, barHeight / 2);
        ctx.fillStyle = grad;

        if (isHovered) {
          ctx.shadowColor = tier.color;
          ctx.shadowBlur = 12;
        }
        ctx.fill();
        ctx.restore();
      }

      // 4. Label de droite (Ex: 14 cartes • 35%)
      const rate = totalCards > 0 ? ((tier.count / totalCards) * 100).toFixed(0) : 0;
      ctx.fillStyle = isHovered ? tier.color : '#cbd5e1';
      ctx.font = '12px "Inter", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(
        `${tier.count} carte${tier.count > 1 ? 's' : ''} (${rate}%)`,
        padding.left + chartWidth + 15,
        yCenter + 4
      );
    });
  }
}

/**
 * ============================================================================
 * 4. GRAPHIQUE TEMPOREL : RENDEMENT DES BOOSTERS (TIMERS GRATUITS)
 * Double échelle : 'hourly' (24h intra-jour) & 'daily' (historique par jour)
 * Double courbe : Valeur Brute Cumulée (Or) & Rendement Net Estimé (Émeraude)
 * Barres de drops par créneau (Cyan) pour visualiser les pics d'ouverture
 * ============================================================================
 */
export class BoosterYieldTemporalChart {
  constructor(canvasId, tooltipId) {
    this.canvas = document.getElementById(canvasId);
    this.tooltip = document.getElementById(tooltipId);
    this.cards = [];
    this.currentView = 'daily'; // 'daily' | 'hourly'
    this.aggregatedData = [];
    this.hoverIndex = -1;
    this.animationProgress = 1;
    this.animationFrame = null;

    if (this.canvas) {
      this.initEvents();
      this.resizeObserver = new ResizeObserver(() => this.render(1));
      this.resizeObserver.observe(this.canvas.parentElement);
    }
  }

  setView(viewMode) {
    if (this.currentView === viewMode) return;
    this.currentView = viewMode;
    this.hoverIndex = -1;
    if (this.tooltip) this.tooltip.style.opacity = '0';
    this.processData();
    this.animate();
  }

  setData(cards) {
    this.cards = Array.isArray(cards) ? cards : [];
    this.processData();
    this.animate();
  }

  processData() {
    if (!this.cards || this.cards.length === 0) {
      this.aggregatedData = [];
      this.updateIndicators(0, 0, 0);
      return;
    }

    // Normalisation des timestamps et des valeurs
    const parsedCards = this.cards.map((c) => {
      let ts = c.timestamp;
      if (typeof ts === 'string') {
        ts = new Date(ts).getTime();
      } else if (!ts || isNaN(ts)) {
        ts = Date.now();
      }
      const gross = Number(c.avgPrice || c.suggestedPrice || 0);
      let net = 0;
      if (c.sellPriceMin && c.sellPriceMax) {
        net = Math.round((Number(c.sellPriceMin) + Number(c.sellPriceMax)) / 2);
      } else if (c.suggestedPrice && Number(c.suggestedPrice) < gross) {
        net = Number(c.suggestedPrice);
      } else {
        net = Math.round(gross * 0.625);
      }
      return {
        ...c,
        ts,
        grossPrice: gross,
        netPrice: net
      };
    }).sort((a, b) => a.ts - b.ts);

    if (this.currentView === 'hourly') {
      this.aggregateHourly(parsedCards);
    } else {
      this.aggregateDaily(parsedCards);
    }
  }

  aggregateHourly(cards) {
    // Détermination du jour cible : aujourd'hui, ou la date du dernier tirage
    const now = new Date();
    const todayY = now.getFullYear();
    const todayM = now.getMonth();
    const todayD = now.getDate();

    let targetY = todayY;
    let targetM = todayM;
    let targetD = todayD;

    // Vérifier si des cartes datent d'aujourd'hui
    const hasTodayCards = cards.some((c) => {
      const d = new Date(c.ts);
      return d.getFullYear() === todayY && d.getMonth() === todayM && d.getDate() === todayD;
    });

    if (!hasTodayCards && cards.length > 0) {
      // Repli sur le jour de la dernière carte pour ne pas laisser un graphique vide
      const lastDate = new Date(cards[cards.length - 1].ts);
      targetY = lastDate.getFullYear();
      targetM = lastDate.getMonth();
      targetD = lastDate.getDate();
    }

    const targetDateObj = new Date(targetY, targetM, targetD);
    const dateLabel = targetDateObj.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });

    // 24 slots d'heures (00h à 23h)
    const slots = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      label: `${String(h).padStart(2, '0')}h`,
      periodName: `${String(h).padStart(2, '0')}h00 - ${String(h).padStart(2, '0')}h59`,
      grossDelta: 0,
      netDelta: 0,
      cardCount: 0,
      boostersCount: 0,
      cards: [],
      dateText: dateLabel
    }));

    // Remplissage des slots
    cards.forEach((card) => {
      const d = new Date(card.ts);
      if (d.getFullYear() === targetY && d.getMonth() === targetM && d.getDate() === targetD) {
        const h = d.getHours();
        slots[h].grossDelta += card.grossPrice;
        slots[h].netDelta += card.netPrice;
        slots[h].cardCount++;
        slots[h].cards.push(card);
      }
    });

    // Calcul des cumuls
    let cumGross = 0;
    let cumNet = 0;
    this.aggregatedData = slots.map((slot, idx) => {
      cumGross += slot.grossDelta;
      cumNet += slot.netDelta;
      slot.boostersCount = slot.cardCount > 0 ? Math.max(1, Math.ceil(slot.cardCount / 5)) : 0;
      return {
        ...slot,
        index: idx,
        cumulativeGross: cumGross,
        cumulativeNet: cumNet
      };
    });

    const maxDrop = Math.max(...this.aggregatedData.map((d) => d.grossDelta), 0);
    this.updateIndicators(cumGross, cumNet, maxDrop, `Session : ${dateLabel}`);
  }

  aggregateDaily(cards) {
    const dayMap = new Map();

    cards.forEach((card) => {
      const d = new Date(card.ts);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!dayMap.has(key)) {
        dayMap.set(key, {
          key,
          dObj: d,
          label: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
          periodName: d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
          grossDelta: 0,
          netDelta: 0,
          cardCount: 0,
          cards: []
        });
      }
      const item = dayMap.get(key);
      item.grossDelta += card.grossPrice;
      item.netDelta += card.netPrice;
      item.cardCount++;
      item.cards.push(card);
    });

    const sortedDays = Array.from(dayMap.values()).sort((a, b) => a.dObj - b.dObj);

    let cumGross = 0;
    let cumNet = 0;
    this.aggregatedData = sortedDays.map((day, idx) => {
      cumGross += day.grossDelta;
      cumNet += day.netDelta;
      day.boostersCount = day.cardCount > 0 ? Math.max(1, Math.ceil(day.cardCount / 5)) : 0;
      return {
        ...day,
        index: idx,
        cumulativeGross: cumGross,
        cumulativeNet: cumNet
      };
    });

    const maxDrop = Math.max(...this.aggregatedData.map((d) => d.grossDelta), 0);
    this.updateIndicators(cumGross, cumNet, maxDrop, `${this.aggregatedData.length} jour${this.aggregatedData.length > 1 ? 's' : ''} enregistrés`);
  }

  updateIndicators(totalGross, totalNet, maxDrop, sessionInfo = '') {
    const elGross = document.getElementById('yield-stat-gross');
    const elNet = document.getElementById('yield-stat-net');
    const elDrop = document.getElementById('yield-stat-drop');
    const elViewLabel = document.getElementById('yield-current-view-label');

    if (elGross) elGross.textContent = `${totalGross.toLocaleString('fr-FR')} 🪙`;
    if (elNet) elNet.textContent = `${totalNet.toLocaleString('fr-FR')} 🪙`;
    if (elDrop) {
      elDrop.textContent = maxDrop > 0 ? `Max : +${maxDrop.toLocaleString('fr-FR')} 🪙` : 'Aucun pic';
    }
    if (elViewLabel) {
      if (sessionInfo) {
        elViewLabel.textContent = `${this.currentView === 'hourly' ? 'Vue 24h' : 'Vue Globale'} • ${sessionInfo}`;
      } else {
        elViewLabel.textContent = this.currentView === 'hourly' ? 'Vue 24h Intra-journalière' : 'Historique Quotidien';
      }
    }
  }

  animate() {
    let start = null;
    const duration = 600;

    const step = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      this.animationProgress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - this.animationProgress, 3);
      this.render(ease);

      if (this.animationProgress < 1) {
        this.animationFrame = requestAnimationFrame(step);
      }
    };

    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = requestAnimationFrame(step);
  }

  initEvents() {
    this.canvas.addEventListener('mousemove', (e) => {
      if (this.aggregatedData.length === 0) return;
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
    const padding = { top: 30, right: 35, bottom: 42, left: 70 };
    const chartWidth = rect.width - padding.left - padding.right;

    if (mouseX < padding.left || mouseX > rect.width - padding.right) {
      this.hoverIndex = -1;
      if (this.tooltip) this.tooltip.style.opacity = '0';
      this.render(1);
      return;
    }

    const n = this.aggregatedData.length;
    const stepX = chartWidth / Math.max(1, n - 1);
    const closestIndex = Math.min(
      n - 1,
      Math.max(0, Math.round((mouseX - padding.left) / stepX))
    );

    this.hoverIndex = closestIndex;
    this.render(1);
    this.updateTooltip(rect, padding, stepX);
  }

  updateTooltip(rect, padding, stepX) {
    if (!this.tooltip || this.hoverIndex === -1) return;
    const item = this.aggregatedData[this.hoverIndex];
    if (!item) return;

    const posX = padding.left + this.hoverIndex * stepX;
    const hasActivity = item.cardCount > 0;

    this.tooltip.innerHTML = `
      <div class="chart-tooltip-header" style="border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 6px; margin-bottom: 8px;">
        <span class="tooltip-badge" style="background: rgba(6, 182, 212, 0.15); color: #06b6d4; border: 1px solid rgba(6, 182, 212, 0.4);">
          ⏱️ ${item.label}
        </span>
        <span class="tooltip-title" style="font-size: 11px; color: #94a3b8;">${item.periodName}</span>
      </div>
      <div class="chart-tooltip-body" style="gap: 5px;">
        <div class="tooltip-row" style="color: #94a3b8;">
          <span>Activité Booster :</span>
          <strong style="color: ${hasActivity ? '#38bdf8' : '#64748b'};">
            ${hasActivity ? `~${item.boostersCount} booster(s) • ${item.cardCount} cartes` : 'Aucun tirage'}
          </strong>
        </div>
        ${hasActivity ? `
        <div class="tooltip-row" style="color: #cbd5e1;">
          <span>Drop instantané :</span>
          <strong style="color: #ffe144;">+${item.grossDelta.toLocaleString('fr-FR')} 🪙</strong>
        </div>
        ` : ''}
        <div class="tooltip-row highlight" style="background: rgba(255, 225, 68, 0.08); padding: 4px 6px; border-radius: 4px; border-left: 2px solid #ffe144;">
          <span style="color: #ffe144;">Cumul Brut Total :</span>
          <strong style="color: #ffe144;">${item.cumulativeGross.toLocaleString('fr-FR')} 🪙</strong>
        </div>
        <div class="tooltip-row" style="background: rgba(16, 185, 129, 0.08); padding: 4px 6px; border-radius: 4px; border-left: 2px solid #10b981;">
          <span style="color: #10b981;">Revente Nette (62.5%) :</span>
          <strong style="color: #10b981;">${item.cumulativeNet.toLocaleString('fr-FR')} 🪙</strong>
        </div>
      </div>
    `;

    this.tooltip.style.opacity = '1';

    const tooltipWidth = this.tooltip.offsetWidth || 210;
    let leftPos = posX;
    if (leftPos + tooltipWidth > rect.width - 20) {
      leftPos = posX - tooltipWidth - 12;
    } else {
      leftPos = posX + 14;
    }

    this.tooltip.style.left = `${leftPos}px`;
    this.tooltip.style.top = `24px`;
  }

  render(progress = 1) {
    if (!this.canvas) return;
    const { ctx, width, height } = setupRetinaCanvas(this.canvas);
    ctx.clearRect(0, 0, width, height);

    const padding = { top: 30, right: 35, bottom: 42, left: 70 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    if (this.aggregatedData.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '14px "Inter", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Aucune donnée temporelle disponible', width / 2, height / 2);
      return;
    }

    const n = this.aggregatedData.length;
    const stepX = chartWidth / Math.max(1, n - 1);

    // Valeur maximale pour l'axe Y (arrondie au millier supérieur)
    const maxCumGross = Math.max(...this.aggregatedData.map((d) => d.cumulativeGross), 10);
    const maxY = Math.ceil(maxCumGross * 1.12);
    const maxDropDelta = Math.max(...this.aggregatedData.map((d) => d.grossDelta), 1);

    // 1. Grille horizontale & graduations (axe Y)
    const gridLines = 5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';

    for (let i = 0; i <= gridLines; i++) {
      const val = (maxY / gridLines) * i;
      const y = padding.top + chartHeight - (chartHeight * (i / gridLines));

      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      ctx.fillText(`${Math.round(val).toLocaleString('fr-FR')} 🪙`, padding.left - 10, y + 4);
    }

    // 2. Barres de drop instantané par intervalle (en arrière-plan)
    const barWidth = Math.max(4, Math.min(18, stepX * 0.42));
    this.aggregatedData.forEach((item, i) => {
      if (item.grossDelta <= 0) return;
      const x = padding.left + i * stepX;
      const barH = (item.grossDelta / maxDropDelta) * (chartHeight * 0.45) * progress;
      const y = padding.top + chartHeight - barH;

      const isHovered = this.hoverIndex === i;

      ctx.save();
      const grad = ctx.createLinearGradient(0, y, 0, padding.top + chartHeight);
      grad.addColorStop(0, isHovered ? 'rgba(6, 182, 212, 0.9)' : 'rgba(6, 182, 212, 0.55)');
      grad.addColorStop(1, 'rgba(6, 182, 212, 0.05)');

      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x - barWidth / 2, y, barWidth, barH, [4, 4, 0, 0]);
      } else {
        ctx.rect(x - barWidth / 2, y, barWidth, barH);
      }
      ctx.fillStyle = grad;
      ctx.fill();

      if (isHovered) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();
    });

    // Coordonnées des points pour les courbes cumulées
    const grossPoints = this.aggregatedData.map((d, i) => {
      const x = padding.left + i * stepX;
      const ratio = (d.cumulativeGross / maxY) * progress;
      const y = padding.top + chartHeight - (chartHeight * ratio);
      return { x, y, raw: d };
    });

    const netPoints = this.aggregatedData.map((d, i) => {
      const x = padding.left + i * stepX;
      const ratio = (d.cumulativeNet / maxY) * progress;
      const y = padding.top + chartHeight - (chartHeight * ratio);
      return { x, y, raw: d };
    });

    // 3. Dégradé sous la courbe principale Valeur Brute (Or Fluo)
    if (grossPoints.length >= 2) {
      const areaGrad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
      areaGrad.addColorStop(0, 'rgba(255, 225, 68, 0.22)');
      areaGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.08)');
      areaGrad.addColorStop(1, 'rgba(255, 225, 68, 0.0)');

      ctx.beginPath();
      ctx.moveTo(grossPoints[0].x, padding.top + chartHeight);
      ctx.lineTo(grossPoints[0].x, grossPoints[0].y);

      for (let i = 0; i < grossPoints.length - 1; i++) {
        const curr = grossPoints[i];
        const next = grossPoints[i + 1];
        const xc = (curr.x + next.x) / 2;
        const yc = (curr.y + next.y) / 2;
        ctx.quadraticCurveTo(curr.x, curr.y, xc, yc);
      }
      const lastG = grossPoints[grossPoints.length - 1];
      ctx.lineTo(lastG.x, lastG.y);
      ctx.lineTo(lastG.x, padding.top + chartHeight);
      ctx.closePath();
      ctx.fillStyle = areaGrad;
      ctx.fill();
    }

    // 4. Courbe secondaire : Rendement Net Estimé à la Revente (Vert Émeraude)
    if (netPoints.length >= 2) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(netPoints[0].x, netPoints[0].y);
      for (let i = 0; i < netPoints.length - 1; i++) {
        const curr = netPoints[i];
        const next = netPoints[i + 1];
        const xc = (curr.x + next.x) / 2;
        const yc = (curr.y + next.y) / 2;
        ctx.quadraticCurveTo(curr.x, curr.y, xc, yc);
      }
      const lastN = netPoints[netPoints.length - 1];
      ctx.lineTo(lastN.x, lastN.y);

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.2;
      ctx.shadowColor = 'rgba(16, 185, 129, 0.65)';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.restore();
    }

    // 5. Courbe principale : Valeur Brute Cumulée (Or Néon)
    if (grossPoints.length >= 2) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(grossPoints[0].x, grossPoints[0].y);
      for (let i = 0; i < grossPoints.length - 1; i++) {
        const curr = grossPoints[i];
        const next = grossPoints[i + 1];
        const xc = (curr.x + next.x) / 2;
        const yc = (curr.y + next.y) / 2;
        ctx.quadraticCurveTo(curr.x, curr.y, xc, yc);
      }
      const lastG = grossPoints[grossPoints.length - 1];
      ctx.lineTo(lastG.x, lastG.y);

      ctx.strokeStyle = '#ffe144';
      ctx.lineWidth = 2.8;
      ctx.shadowColor = 'rgba(255, 225, 68, 0.85)';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.restore();
    }

    // 6. Réticule vertical & points illuminés au survol
    if (this.hoverIndex >= 0 && this.hoverIndex < this.aggregatedData.length) {
      const gp = grossPoints[this.hoverIndex];
      const np = netPoints[this.hoverIndex];

      // Ligne verticale néon
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(gp.x, padding.top);
      ctx.lineTo(gp.x, padding.top + chartHeight);
      ctx.stroke();
      ctx.restore();

      // Point Net (Émeraude)
      ctx.beginPath();
      ctx.arc(np.x, np.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(np.x, np.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.fill();
      ctx.stroke();

      // Point Brut (Or)
      ctx.beginPath();
      ctx.arc(gp.x, gp.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 225, 68, 0.4)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(gp.x, gp.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#07090e';
      ctx.strokeStyle = '#ffe144';
      ctx.lineWidth = 3;
      ctx.fill();
      ctx.stroke();
    }

    // 7. Axe horizontal X (Labels temporels)
    ctx.fillStyle = '#64748b';
    ctx.font = '10px "Inter", system-ui, sans-serif';
    ctx.textAlign = 'center';

    // Déterminer le pas d'affichage pour que les labels ne se chevauchent pas
    const maxLabels = Math.min(12, n);
    const labelStep = Math.max(1, Math.ceil(n / maxLabels));

    for (let i = 0; i < n; i++) {
      // Toujours afficher le premier, le dernier et les multiples du pas
      if (i === 0 || i === n - 1 || i % labelStep === 0) {
        const x = padding.left + i * stepX;
        const isHovered = this.hoverIndex === i;
        ctx.fillStyle = isHovered ? '#38bdf8' : '#64748b';
        ctx.font = isHovered ? 'bold 10px "Inter", sans-serif' : '10px "Inter", sans-serif';
        ctx.fillText(this.aggregatedData[i].label, x, height - 16);
      }
    }
  }
}

