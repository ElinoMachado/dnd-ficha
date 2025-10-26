/* ============================================================
   TOOLTIP SYSTEM - D&D PROJECT
   Controla exibição dinâmica e informativa dos tooltips globais
=============================================================== */

export const Tooltip = (() => {
  const tooltip = document.createElement("div");
  tooltip.classList.add("tooltip");
  document.body.appendChild(tooltip);

  let tooltipData = {}; // será preenchido com dados do dataService

  /* ============================================================
     Inicialização
  ============================================================ */
  function init(data) {
    tooltipData = data;
    bindEvents();
  }

  /* ============================================================
     Eventos Globais de Hover
  ============================================================ */
  function bindEvents() {
    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);
  }

  function handleMouseOver(e) {
    const target = e.target.closest("[data-tooltip]");
    if (!target) return;

    const key = target.getAttribute("data-tooltip");
    const content = getTooltipContent(key);

    if (content) showTooltip(e, content);
  }

  function handleMouseOut(e) {
    const target = e.target.closest("[data-tooltip]");
    if (!target) return;

    hideTooltip();
  }

  /* ============================================================
     Montagem de Conteúdo
  ============================================================ */
  function getTooltipContent(key) {
    // busca em todos os datasets carregados
    for (const category in tooltipData) {
      const item = tooltipData[category].find(
        (i) => i.name?.toLowerCase() === key.toLowerCase()
      );
      if (item) return buildTooltipHTML(item, category);
    }
    return null;
  }

  function buildTooltipHTML(item, category) {
    let html = `<div class="tooltip-title">${item.name}</div>`;

    if (item.type)
      html += `<div class="tooltip-category">${capitalize(item.type)}</div>`;

    if (item.description)
      html += `<div class="tooltip-content">${item.description}</div>`;

    // se houver atributos específicos (como nível de magia, duração, etc)
    const specialKeys = [
      "level",
      "range",
      "duration",
      "casting_time",
      "damage",
      "bonus",
      "cost",
    ];
    let specialContent = "";

    specialKeys.forEach((k) => {
      if (item[k]) {
        specialContent += `
          <li><strong>${formatLabel(k)}:</strong> ${item[k]}</li>
        `;
      }
    });

    if (specialContent) {
      html += `
        <div class="tooltip-section">
          <ul class="tooltip-list">${specialContent}</ul>
        </div>
      `;
    }

    return html;
  }

  /* ============================================================
     Exibição e Ocultação
  ============================================================ */
  function showTooltip(e, content) {
    tooltip.innerHTML = content;
    tooltip.classList.add("show");

    const rect = tooltip.getBoundingClientRect();
    const { clientX: x, clientY: y } = e;

    // posicionamento adaptável
    let left = x + 15;
    let top = y + 15;

    if (left + rect.width > window.innerWidth - 20) {
      left = x - rect.width - 15;
    }

    if (top + rect.height > window.innerHeight - 20) {
      top = y - rect.height - 15;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  function hideTooltip() {
    tooltip.classList.remove("show");
  }

  /* ============================================================
     Funções Utilitárias
  ============================================================ */
  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function formatLabel(key) {
    const map = {
      level: "Nível",
      range: "Alcance",
      duration: "Duração",
      casting_time: "Tempo de Conjuração",
      damage: "Dano",
      bonus: "Bônus",
      cost: "Custo",
    };
    return map[key] || capitalize(key);
  }

  /* ============================================================
     Interface Pública
  ============================================================ */
  return {
    init,
  };
})();
