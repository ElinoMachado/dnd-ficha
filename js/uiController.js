/* ============================================================
   UICONTROLLER - D&D PROJECT
   UI Heroica: Destaques Equipados + Ícones Temáticos
=============================================================== */
import { DataService } from "./dataService.js";
import { Tooltip } from "./tooltip.js";
import { FichaBuilder } from "./fichaBuilder_v2.js";

export const UIController = (() => {
  const selectors = {
    sidebar: "#sidebar",
    categoriesContainer: "#categories",
  };

  const TABS = [
    { key: "racas", label: "Raças" },
    { key: "classes", label: "Classes" },
    { key: "armas", label: "Armas" },
    { key: "armaduras", label: "Armaduras" },
    { key: "equipamentos", label: "Equipamentos" },
    { key: "magias", label: "Magias" },
    { key: "talentos", label: "Talentos" },
    { key: "antecedentes", label: "Antecedentes" },
  ];

  let allData = {};
  let activeTab = "racas";

  async function init() {
    console.info("[UIController] Inicializando interface...");
    allData = await DataService.loadAllData();

    window.UIControllerData = {
      classes: allData.classes,
      racas: allData.racas,
      armas: allData.armas,
      armaduras: allData.armaduras,
    };

    renderSidebarFrame();
    renderTabs();
    renderListByCategory(activeTab);
    Tooltip.init(allData);
    bindSearch();
  }

  function renderSidebarFrame() {
    const sidebar = document.querySelector("#sidebar");
    sidebar.innerHTML = `
      <div class="sidebar-tabs" id="sidebar-tabs"></div>
      <div class="sidebar-search">
        <input id="searchInput" type="text" placeholder="🔍 Buscar..." />
      </div>
      <div id="categories" class="categories"></div>
    `;
  }

  function renderTabs() {
    const tabsEl = document.querySelector("#sidebar-tabs");
    tabsEl.innerHTML = "";
    TABS.forEach((tab) => {
      const el = document.createElement("div");
      el.className = "sidebar-tab" + (tab.key === activeTab ? " active" : "");
      el.textContent = tab.label;
      el.addEventListener("click", () => {
        activeTab = tab.key;
        document
          .querySelectorAll(".sidebar-tab")
          .forEach((t) => t.classList.remove("active"));
        el.classList.add("active");
        renderListByCategory(activeTab);
      });
      tabsEl.appendChild(el);
    });
  }

  function renderListByCategory(category) {
    const container = document.querySelector(selectors.categoriesContainer);
    container.innerHTML = "";

    const listWrap = document.createElement("div");
    listWrap.className = "category-list";

    const items = allData[category] || [];
    if (!items.length) {
      listWrap.innerHTML = `<p class="empty-msg">Nenhum dado disponível.</p>`;
    } else {
      items.forEach((item) =>
        listWrap.appendChild(renderItemEntry(item, category))
      );
    }
    container.appendChild(listWrap);
  }

  function renderItemEntry(item, category) {
    const el = document.createElement("div");
    el.className = "item-entry medieval-entry";
    el.setAttribute("data-category", category);
    el.setAttribute("data-tooltip", item.name);

    /* Ícone */
    const icon = document.createElement("img");
    icon.className = "item-icon";
    icon.src = iconForCategory(category, item);
    el.appendChild(icon);

    /* Nome */
    const spanName = document.createElement("span");
    spanName.textContent = item.name;
    el.appendChild(spanName);

    /* Símbolo ⭐ se equipado */
    let star = document.createElement("span");
    star.className = "equip-star";
    el.appendChild(star);

    /* Estado do item na ficha */
    try {
      const fs = window.__FichaState?._equip;

      if (category === "racas" && window.__FichaState?.raca === item.name) {
        el.classList.add("selected-race");
        star.textContent = "⭐";
      }
      if (category === "classes" && window.__FichaState?.classe === item.name) {
        el.classList.add("selected-class");
        star.textContent = "⭐";
      }
      if (
        category === "armas" &&
        fs?.armas.some((w, i) => {
          const eq = w.name === item.name;
          if (eq && fs?.armaPrincipal === i) {
            star.textContent = "⭐";
          }
          return eq;
        })
      ) {
        el.classList.add("equipped");
      }
      if (category === "armaduras") {
        if (fs?.armadura && fs.armadura.name === item.name) {
          el.classList.add("equipped");
          star.textContent = "⭐";
        }
        if (item.categoria?.toLowerCase() === "escudo" && fs?.escudo) {
          el.classList.add("equipped");
          star.textContent = "⭐";
        }
      }
    } catch (e) {}

    /* Evento de clique */
    el.addEventListener("click", () => {
      FichaBuilder.addItem(item, category);
      renderListByCategory(activeTab);
    });

    return el;
  }

  function iconForCategory(cat, item) {
    if (cat === "armas") {
      const name = (item.name || "").toLowerCase();
      if (name.includes("arco")) return "assets/icons/bow.svg";
      if (name.includes("machado")) return "assets/icons/axe.svg";
      if (name.includes("martelo")) return "assets/icons/hammer.svg";
      return "assets/icons/sword.svg";
    }
    if (cat === "armaduras") {
      if ((item.categoria || "").toLowerCase() === "escudo")
        return "assets/icons/shield.svg";
      return "assets/icons/armor.svg";
    }
    if (cat === "racas") return "assets/icons/race.svg";
    if (cat === "classes") return "assets/icons/class.svg";
    if (cat === "magias") return "assets/icons/magic.svg";
    if (cat === "talentos") return "assets/icons/star.svg";

    return "assets/icons/default.svg";
  }

  function bindSearch() {
    const input = document.querySelector("#searchInput");
    input.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase();
      const entries = document.querySelectorAll(".item-entry");
      entries.forEach((el) => {
        const nm = el.querySelector("span")?.textContent.toLowerCase();
        el.style.display = nm.includes(q) ? "flex" : "none";
      });
    });
  }

  return { init };
})();
