/* ============================================================
   FICHABUILDER V2 - D&D PROJECT
   (validações + page tabs + combate com histórico)
=============================================================== */
export const FichaBuilder = (() => {
  let ficha = null;
  let currentPage = 1;
  const container = document.querySelector("#ficha-content");

  /* --------------------------- init --------------------------- */
  function init() {
    initFicha().then(() => {
      exposeState();
      render();
      setupPageTabs();
    });
  }

  async function initFicha() {
    const tpl = await fetch("./assets/data/fichaTemplate.json").then((r) =>
      r.json()
    );
    ficha =
      typeof structuredClone === "function"
        ? structuredClone(tpl)
        : JSON.parse(JSON.stringify(tpl));

    ficha._equip = {
      armas: [],
      armadura: null,
      escudo: false,
      armaPrincipal: null,
    };

    // deslocamento base (atualizado ao aplicar raça)
    ficha._base_deslocamento = 9;

    // histórico de combate
    ficha._combatLog = [];
    ficha._alvoCA = 12; // valor padrão que o usuário pode alterar no UI
  }

  function exposeState() {
    window.__FichaState = ficha;
  }

  /* ----------------------- navegação tabs ---------------------- */
  function setupPageTabs() {
    const tabs = document.querySelector("#page-tabs");
    if (!tabs) return;
    const labels = ["Página 1", "Página 2", "Magias"];
    tabs.innerHTML = "";
    labels.forEach((lb, i) => {
      const el = document.createElement("div");
      el.className = "page-tab" + (i + 1 === currentPage ? " active" : "");
      el.textContent = lb;
      el.addEventListener("click", () => {
        currentPage = i + 1;
        render();
      });
      tabs.appendChild(el);
    });
  }

  function markActivePageTab() {
    const tabs = document.querySelectorAll(".page-tab");
    tabs.forEach((t, idx) => {
      t.classList.toggle("active", idx + 1 === currentPage);
    });
  }

  function nextPage() {
    if (currentPage < 3) {
      currentPage++;
      render();
    }
  }

  function prevPage() {
    if (currentPage > 1) {
      currentPage--;
      render();
    }
  }

  /* --------------------------- render -------------------------- */
  function render() {
    container.innerHTML = "";
    if (currentPage === 1) renderPage1();
    if (currentPage === 2) renderPage2();
    if (currentPage === 3) renderPage3();
    markActivePageTab();
  }

  function renderPage1() {
    const html = `
      <div class="page page-1">
        <div class="turn-left" onclick="window.FichaBuilder.prevPage()"></div>
        <div class="turn-right" onclick="window.FichaBuilder.nextPage()"></div>

        <div class="top-info">
          <label>Nome do Personagem:
            <input type="text" id="nome-personagem" value="${safe(ficha.nome)}">
          </label>
          <div class="class-info">
            <span>Classe & Nível:</span>
            <strong id="classe-nivel">${ficha.classe || "—"} ${
      ficha.nivel
    }</strong>
          </div>
          <div class="race-info">
            <span>Raça:</span>
            <strong id="raca-view">${ficha.raca || "—"}</strong>
          </div>
        </div>

        <div class="attributes">
          ${Object.entries(ficha.atributos)
            .map(([k, v]) => attrBox(k, v))
            .join("")}
        </div>


        <<div class="attr-tools">
  <button id="btn-roll-attributes" class="btn-roller">🎲 Rolagem Aleatória</button>
</div>


        <div class="combat-band">
          <div class="combat-box"><div>Classe de Armadura</div><div id="ca-view" style="font-size:1.4rem;font-weight:bold;">${
            ficha.classe_armadura
          }</div></div>
          <div class="combat-box"><div>Iniciativa</div><div id="ini-view" style="font-size:1.4rem;font-weight:bold;">${calcMod(
            ficha.atributos.destreza
          )}</div></div>
          <div class="combat-box"><div>Deslocamento</div><div id="mov-view" style="font-size:1.1rem;font-weight:bold;">${
            ficha.deslocamento
          }</div></div>
        </div>

        <div class="pv-grid">
          <div class="combat-box"><div>Pontos de Vida (Total)</div><input id="pv-total" type="number" value="${
            ficha.pv.total
          }" disabled /></div>
          <div class="combat-box"><div>Pontos de Vida (Atual)</div><input id="pv-atual" type="number" value="${
            ficha.pv.atual
          }" /></div>
          <div class="combat-box"><div>Pontos de Vida Temporários</div><input id="pv-temp" type="number" value="${
            ficha.pv.temporario
          }" /></div>
        </div>

        <div class="ataques-equip">
          <div class="table-box">
            <div class="section-title">Ataques & Magia</div>
            <table>
              <thead>
                <tr>
                  <th style="width:28px;"></th>
                  <th>Nome</th>
                  <th>Cálculo</th>
                  <th>Dano/Tipo</th>
                  <th style="width:64px;">Principal</th>
                  <th style="width:56px;">Atacar</th>
                </tr>
              </thead>
              <tbody id="ataques-body">${renderAtaques()}</tbody>
            </table>
          </div>

          <div class="table-box">
            <div class="section-title">Armadura & Itens</div>
            <div style="display:flex; gap:8px; align-items:center;">
              <img src="assets/icons/armor.svg" width="20" height="20" alt="">
              <span id="armadura-view">${
                ficha._equip.armadura ? ficha._equip.armadura.name : "—"
              }</span>
              <img src="assets/icons/shield.svg" width="20" height="20" alt="">
              <span id="escudo-view">${
                ficha._equip.escudo ? "Escudo Empunhado" : "Sem Escudo"
              }</span>
            </div>
          </div>
        </div>

        <div class="table-box">
          <div class="section-title">Histórico de Combate</div>
          <div style="display:flex; gap:8px; align-items:center; margin-bottom:8px;">
            <label>CA do Alvo: <input id="alvo-ca" type="number" min="1" value="${
              Number(ficha._alvoCA) || 12
            }" style="width:70px"></label>
            <button id="btn-clear-log">🧹 Limpar Histórico</button>
          </div>
          <div id="combat-log" class="combat-log"></div>
        </div>
      </div>
    `;
    container.insertAdjacentHTML("beforeend", html);
    bindPage1();
    renderCombatLog();
    recalcAll();
  }

  function renderPage2() {
    const html = `
      <div class="page page-2">
        <div class="turn-left" onclick="window.FichaBuilder.prevPage()"></div>
        <div class="turn-right" onclick="window.FichaBuilder.nextPage()"></div>
        <div class="table-box"><div class="section-title">História</div><textarea id="historia">${safe(
          ficha.historia
        )}</textarea></div>
        <div class="table-box"><div class="section-title">Aliados & Organizações</div><textarea id="aliados">${safe(
          ficha.aliados
        )}</textarea></div>
        <div class="table-box"><div class="section-title">Tesouros</div><textarea id="tesouros">${safe(
          ficha.tesouros
        )}</textarea></div>
      </div>
    `;
    container.insertAdjacentHTML("beforeend", html);
  }

  function renderPage3() {
    const html = `
      <div class="page page-3">
        <div class="turn-left" onclick="window.FichaBuilder.prevPage()"></div>
        <div class="turn-right" onclick="window.FichaBuilder.nextPage()"></div>
        <div class="table-box">
          <div class="section-title">Magias</div>
          <div>CD das Magias: <strong id="cd-magias">${
            ficha.magias.cd || "—"
          }</strong>
          | Mod. de Ataque: <strong id="atk-magias">${
            ficha.magias.mod_ataque || "—"
          }</strong></div>
        </div>
      </div>
    `;
    container.insertAdjacentHTML("beforeend", html);
  }

  function bindPage1() {
    const nome = document.querySelector("#nome-personagem");
    if (nome) nome.addEventListener("input", () => (ficha.nome = nome.value));

    document.querySelectorAll(".attr-value").forEach((inp) => {
      inp.addEventListener("input", () => {
        const k = inp.dataset.attr;
        const v = parseInt(inp.value || 10, 10);
        ficha.atributos[k] = isNaN(v) ? 10 : v;
        recalcAll();
      });
    });

    ["pv-atual", "pv-temp"].forEach((id) => {
      const el = document.querySelector("#" + id);
      if (!el) return;
      el.addEventListener("input", () => {
        const n = parseInt(el.value || 0, 10);
        if (id === "pv-atual") ficha.pv.atual = isNaN(n) ? 0 : n;
        if (id === "pv-temp") ficha.pv.temporario = isNaN(n) ? 0 : n;
      });
    });

    const alvo = qs("#alvo-ca");
    if (alvo)
      alvo.addEventListener("change", () => {
        const v = parseInt(alvo.value || 12, 10);
        ficha._alvoCA = Number.isFinite(v) ? v : 12;
      });

    const clearBtn = qs("#btn-clear-log");
    if (clearBtn) clearBtn.addEventListener("click", clearCombatLog);

    // ✅ Liga o botão (agora existente) ao randomizador
    const btnRoll = qs("#btn-roll-attributes");
    if (btnRoll) btnRoll.addEventListener("click", rollRandomAttributes);
  }

  /* ------------------ lista de ataques/tabela ------------------ */
  function renderAtaques() {
    if (!ficha._equip.armas.length) return `<tr><td colspan="6">—</td></tr>`;
    return ficha._equip.armas
      .map((w, idx) => {
        const icon = weaponIcon(w);
        const calc = calcAtaque(w);
        const star = ficha._equip.armaPrincipal === idx ? "⭐" : "☆";
        const desvBadge = calc.desvantagem
          ? ` <span title="${calc.motivoDesv}" style="color:#b00;font-weight:bold">🛑DESV</span>`
          : "";
        const calcStr = `${signed(calc.bruto)} → ${signed(
          calc.final
        )}${desvBadge}`;
        const danoStr = buildDanoString(w, calc.modAtrib);
        return `<tr>
          <td>${icon}</td>
          <td>${escapeHTML(w.name)}</td>
          <td>${calcStr}</td>
          <td>${danoStr}</td>
          <td><button onclick="window.FichaBuilder.setArmaPrincipal(${idx})" title="Definir como principal">${star}</button></td>
          <td><button onclick="window.FichaBuilder.attackWithWeapon(${idx})" title="Atacar">🎯</button></td>
        </tr>`;
      })
      .join("");
  }

  function setArmaPrincipal(idx) {
    if (idx >= 0 && idx < ficha._equip.armas.length) {
      ficha._equip.armaPrincipal = idx;
      render();
    }
  }

  function weaponIcon(w) {
    let src = "assets/icons/sword.svg";
    const nm = (w.name || "").toLowerCase();
    const tp = (w.tipo || "").toLowerCase();
    if (tp.includes("dist") || nm.includes("arco"))
      src = "assets/icons/bow.svg";
    return `<img src="${src}" width="20" height="20" alt="icon">`;
  }

  /* --------------------------- addItem -------------------------- */
  function addItem(item, category) {
    const catRaw = String(category || "").toLowerCase();

    // detectores robustos
    const isRaca = /\braca(s)?\b/.test(catRaw);
    const isClasse = /\bclasse(s)?\b/.test(catRaw);
    const isArmadura =
      /\barmadura(s)?\b/.test(catRaw) || /\bescudo(s)?\b/.test(catRaw);
    const isArma = /\barma(s)?\b/.test(catRaw) && !isArmadura;

    if (isRaca) {
      applyRace(item);
      showToast("Raça aplicada", `Você agora é ${item.name}.`, true);
      exposeState();
      render();
      return;
    }

    if (isClasse) {
      applyClass(item);
      showToast("Classe aplicada", `Classe definida: ${item.name}.`, true);
      exposeState();
      render();
      return;
    }

    if (isArmadura) {
      const catArm = String(item.categoria || "").toLowerCase();
      const req = item.requisito_for || 0;
      const forAtual = ficha.atributos.forca || 10;

      if (!hasArmorProficiency(catArm)) {
        showToastPergaminho(
          "Sem proficiência",
          `Você não é proficiente com ${item.name}. Penalidades podem se aplicar.`
        );
      }
      if (catArm === "pesada" && req && forAtual < req) {
        showToastPergaminho(
          "Requisito de Força",
          `${item.name}: Força ${req}+ recomendada. Deslocamento reduzido.`
        );
      }

      if (catArm === "escudo") {
        ficha._equip.escudo = true;
      } else {
        ficha._equip.armadura = item;
      }
      exposeState();
      recalcAll();
      render();
      return;
    }

    if (isArma) {
      const props = (item.propriedades || []).map((p) =>
        String(p).toLowerCase()
      );
      const pesada = props.includes("pesada");

      if (pesada && String(ficha.tamanho || "").toLowerCase() === "pequeno") {
        showToastPergaminho(
          "Ineficiente",
          `${item.name}: arma pesada para criaturas Pequenas. (Desvantagem e -2 no ataque)`
        );
      }
      if (!hasWeaponProficiency(item)) {
        showToastPergaminho(
          "Sem proficiência",
          `Você não é proficiente com ${item.name}. Ataques terão DESVANTAGEM.`
        );
      }

      ficha._equip.armas.push(item);
      if (ficha._equip.armaPrincipal === null) ficha._equip.armaPrincipal = 0;

      exposeState();
      recalcAll();
      render();
      return;
    }

    // demais itens
    showToast("Item adicionado", `${item.name} adicionado.`, true);
    exposeState();
    render();
  }

  /* ------------------------- verificações ----------------------- */
  function hasWeaponProficiency(w) {
    const cls = classData();
    console.log(cls, w);
    if (!cls) return true;
    const profs = cls.proficiencias?.armas || [];
    const name = String(w.name || "").toLowerCase();
    const cat = String(w.proficiencia || w.categoria || "").toLowerCase();
    return profs.some(
      (p) =>
        name.includes(String(p).toLowerCase()) ||
        cat.includes(String(p).toLowerCase())
    );
  }

  function hasArmorProficiency(tipo) {
    const cls = classData();
    if (!cls) return true;
    const arm = cls.proficiencias?.armaduras || [];
    const norm = (t) => String(t || "").toLowerCase();
    const t = norm(tipo);
    return arm.some(
      (p) => norm(p) === t || (t === "escudos" && norm(p) === "escudo")
    );
  }

  /* ---------------------------- combate ------------------------- */

  // calcula bônus bruto/final e flags
  function calcAtaque(w) {
    const dex = calcMod(ficha.atributos.destreza);
    const str = calcMod(ficha.atributos.forca);
    const props = (w.propriedades || []).map((p) => String(p).toLowerCase());

    const isDist = /dist/i.test(String(w.tipo || ""));
    const isPesada = props.includes("pesada");
    const hasAcuidade = props.includes("acuidade");

    let modAtrib = isDist ? dex : str;
    if (hasAcuidade) modAtrib = Math.max(dex, str);

    const proficiente = hasWeaponProficiency(w);
    const prof = proficiente ? ficha.proficiencia : 0;

    // Penalidades
    let desvantagem = false;
    let motivoDesv = "";
    let penalFix = 0;

    if (!proficiente) {
      desvantagem = true;
      motivoDesv = appendReason(motivoDesv, "Sem proficiência");
    }

    if (String(ficha.tamanho || "").toLowerCase() === "pequeno" && isPesada) {
      desvantagem = true; // mantém desvantagem
      penalFix -= 2; // adicional -2
      motivoDesv = appendReason(motivoDesv, "Arma pesada para Pequeno (-2)");
    }

    const bruto = prof + modAtrib; // antes das penalidades
    const final = bruto + penalFix; // após penalidade fixa

    return { bruto, final, desvantagem, motivoDesv, modAtrib };
  }

  function appendReason(cur, add) {
    return cur ? `${cur}; ${add}` : add;
  }

  // botão de ataque
  function attackWithWeapon(idx) {
    const w = ficha._equip.armas[idx];
    if (!w) return;

    const calc = calcAtaque(w);

    // rolagem de ataque
    const d20a = rollD(1, 20)[0];
    let d20b = null;
    let d20Used = d20a;
    if (calc.desvantagem) {
      d20b = rollD(1, 20)[0];
      d20Used = Math.min(d20a, d20b);
    }

    const totalAtaque = d20Used + calc.final;

    // crítico/falha
    const critico = d20Used === 20;
    const falha = d20Used === 1;

    // rolagem de dano (sempre rola, mesmo em erro — sua escolha)
    const dano = rollDamageFromString(w.dano, calc.modAtrib);
    const tipo = (w.tipo_dano || "").trim();

    // verificar acerto se CA presente
    const alvoCA = Number(ficha._alvoCA) || 12;
    const acertou = totalAtaque >= alvoCA && !falha;

    // registrar histórico
    const entry = {
      when: new Date().toLocaleTimeString(),
      nome: w.name,
      d20a,
      d20b,
      usado: d20Used,
      bruto: calc.bruto,
      finalBonus: calc.final,
      total: totalAtaque,
      desvantagem: calc.desvantagem,
      motivoDesv: calc.motivoDesv,
      critico,
      falha,
      dano,
      tipo,
      alvoCA,
      acertou,
    };

    logCombat(entry);
  }

  function buildDanoString(w, modAtrib) {
    const base = w.dano || "1d4";
    const bonusStr =
      modAtrib === 0 ? "" : modAtrib > 0 ? `+${modAtrib}` : `${modAtrib}`;
    const tipo = (w.tipo_dano || "").trim();
    return `${base}${bonusStr} ${tipo}`.trim();
  }

  function rollD(n, faces) {
    const arr = [];
    for (let i = 0; i < n; i++) {
      arr.push(1 + Math.floor(Math.random() * faces));
    }
    return arr;
  }

  function parseDice(diceStr) {
    // "2d6", "1d8", etc
    const m = String(diceStr || "1d4")
      .trim()
      .match(/^(\d+)d(\d+)$/i);
    if (!m) return { n: 1, f: 4 };
    return { n: parseInt(m[1], 10), f: parseInt(m[2], 10) };
  }

  function rollDamageFromString(diceStr, mod) {
    const { n, f } = parseDice(diceStr);
    const rolls = rollD(n, f);
    const sum = rolls.reduce((a, b) => a + b, 0);
    return sum + (mod || 0);
  }

  function logCombat(entry) {
    ficha._combatLog.unshift(entry);
    if (ficha._combatLog.length > 30) ficha._combatLog.pop();
    renderCombatLog();
  }

  function clearCombatLog() {
    ficha._combatLog = [];
    renderCombatLog();
  }

  function renderCombatLog() {
    const wrap = qs("#combat-log");
    if (!wrap) return;
    if (!ficha._combatLog.length) {
      wrap.innerHTML = `<div class="empty-msg">Nenhuma rolagem registrada ainda.</div>`;
      return;
    }
    wrap.innerHTML = ficha._combatLog
      .map((e) => {
        const d20Info = e.desvantagem
          ? `Rolagens: <strong>${e.d20a}</strong> e <strong>${e.d20b}</strong> → usado: <strong>${e.usado}</strong> 🛑DESV`
          : `d20: <strong>${e.usado}</strong>`;

        const crit = e.critico
          ? ` <span style="color:#0b0;font-weight:bold">💥 CRÍTICO</span>`
          : "";
        const f1 = e.falha
          ? ` <span style="color:#b00;font-weight:bold">❌ Falha Crítica</span>`
          : "";

        const motivo = e.motivoDesv
          ? `<div class="log-sub">Motivo: ${escapeHTML(e.motivoDesv)}</div>`
          : "";

        const hitTxt = e.acertou
          ? `<span style="color:#0b0;font-weight:bold">ACERTOU</span>`
          : `<span style="color:#b00;font-weight:bold">ERROU</span>`;

        return `
          <div class="log-entry">
            <div class="log-top">
              <span class="log-time">${e.when}</span>
              <span class="log-name">${escapeHTML(e.nome)}</span>
            </div>
            <div class="log-line">${d20Info}${crit}${f1}</div>
            <div class="log-line">Bônus: ${signed(e.bruto)} → <strong>${signed(
          e.finalBonus
        )}</strong> | CA alvo: ${e.alvoCA} → Resultado: <strong>${
          e.total
        }</strong> → ${hitTxt}</div>
            <div class="log-line">Dano: <strong>${e.dano}</strong> ${escapeHTML(
          e.tipo || ""
        )}</div>
            ${motivo}
          </div>
        `;
      })
      .join("");
  }

  /* ---------------------------- cálculos ------------------------ */
  function recalcAll() {
    // proficiência por nível
    ficha.proficiencia = calcProficiencia(ficha.nivel);

    // iniciativa
    const ini = calcMod(ficha.atributos.destreza);
    if (qs("#ini-view")) qs("#ini-view").textContent = signed(ini);

    // CA
    if (qs("#ca-view")) qs("#ca-view").textContent = calcCA();

    // PV total
    const modCon = calcMod(ficha.atributos.constituicao);
    ficha.pv.total = Math.max((classData()?.pv_nivel_1 || 0) + modCon, 1);
    if (qs("#pv-total")) qs("#pv-total").value = ficha.pv.total;

    // deslocamento com penalidades
    const baseMov = Number.isFinite(ficha._base_deslocamento)
      ? ficha._base_deslocamento
      : 9;
    let mov = baseMov;

    const a = ficha._equip.armadura;
    const reqFor = a?.requisito_for || 0;
    const forAtual = ficha.atributos.forca || 10;
    const catArm = String(a?.categoria || "").toLowerCase();

    if (a && catArm === "pesada" && reqFor && forAtual < reqFor) {
      mov = Math.max(3, mov - 3);
    }

    ficha.deslocamento = `${mov}m`;
    if (qs("#mov-view")) qs("#mov-view").textContent = ficha.deslocamento;

    // magias (somente exibição básica)
    const cls = classData();
    if (cls?.progresso_conjuracao && cls.progresso_conjuracao !== "nenhum") {
      const chave = cls.atributo_conjuracao || "inteligencia";
      const mod = calcMod(ficha.atributos[chave] || 10);
      ficha.magias.cd = 8 + ficha.proficiencia + mod;
      ficha.magias.mod_ataque = ficha.proficiencia + mod;
      if (qs("#cd-magias")) qs("#cd-magias").textContent = ficha.magias.cd;
      if (qs("#atk-magias"))
        qs("#atk-magias").textContent = signed(ficha.magias.mod_ataque);
    } else {
      if (qs("#cd-magias")) qs("#cd-magias").textContent = "—";
      if (qs("#atk-magias")) qs("#atk-magias").textContent = "—";
    }
  }

  function calcCA() {
    const dexMod = calcMod(ficha.atributos.destreza);
    const a = ficha._equip.armadura;
    let ca = 10 + dexMod;

    if (a) {
      let dexCap = a.dex_max !== undefined ? a.dex_max : 99;
      let dexApplied = Math.min(dexMod, dexCap);
      if (a.categoria === "pesada") dexApplied = 0; // pesada nunca soma DEX
      ca = a.ca_base + dexApplied;
    }

    if (ficha._equip.escudo) ca += 2;
    return (ficha.classe_armadura = ca);
  }

  /* -------------------------- aplicadores ---------------------- */
  function applyRace(raca) {
    // remover bônus anteriores se houver
    if (ficha._lastRace && ficha._lastRace.atributos) {
      Object.entries(ficha._lastRace.atributos).forEach(([k, bonus]) => {
        ficha.atributos[k] -= bonus;
      });
    }
    ficha._lastRace = raca;

    ficha.raca = raca.name;
    ficha.tamanho = raca.tamanho || "Médio";

    // deslocamento base da raça
    ficha._base_deslocamento =
      parseInt(String(raca.deslocamento || "9m").replace(/[^\d]/g, ""), 10) ||
      9;
    ficha.deslocamento = `${ficha._base_deslocamento}m`;

    const rv = qs("#raca-view");
    if (rv) rv.textContent = ficha.raca;

    ficha.idiomas = raca.idiomas || [];
    ficha.caracteristicas = raca.caracteristicas || [];

    if (raca.atributos) {
      Object.entries(raca.atributos).forEach(([k, bonus]) => {
        ficha.atributos[k] = (ficha.atributos[k] || 10) + bonus;
      });
    }
    recalcAll();
  }

  function applyClass(cls) {
    ficha.classe = cls.name;
    const cn = qs("#classe-nivel");
    if (cn) cn.textContent = `${ficha.classe} ${ficha.nivel}`;
    recalcAll();
  }

  /* ----------------------- random atributos -------------------- */
  function roll4d6DropLowest() {
    const rolls = [];
    for (let i = 0; i < 4; i++) rolls.push(Math.floor(Math.random() * 6) + 1);
    rolls.sort((a, b) => a - b);
    rolls.shift();
    return rolls.reduce((a, b) => a + b, 0);
  }

  function rollRandomAttributes() {
    const keys = Object.keys(ficha.atributos);
    keys.forEach((k) => {
      ficha.atributos[k] = roll4d6DropLowest();
    });
    recalcAll();
    render();
    showToast("Atributos rolados!", "4d6 (remove o menor) 🎲", true);
  }

  /* ---------------------------- helpers ------------------------ */
  function qs(sel) {
    return document.querySelector(sel);
  }
  function safe(s) {
    return (s ?? "")
      .toString()
      .replace(
        /[<>&]/g,
        (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c])
      );
  }
  function escapeHTML(s) {
    return safe(s);
  }
  function classData() {
    const list = window.UIControllerData?.classes || [];
    return (
      list.find(
        (c) =>
          (c.name || "").toLowerCase() === (ficha.classe || "").toLowerCase()
      ) || null
    );
  }
  function calcMod(v) {
    return Math.floor((v - 10) / 2);
  }
  function signed(n) {
    return n >= 0 ? "+" + n : "" + n;
  }
  function calcProficiencia(nivel) {
    return nivel >= 17
      ? 6
      : nivel >= 13
      ? 5
      : nivel >= 9
      ? 4
      : nivel >= 5
      ? 3
      : 2;
  }
  function attrBox(k, v) {
    return `
      <div class="atributo">
        <span class="attr-name">${labelAttr(k)}</span>
        <input type="number" class="attr-value" value="${v}" data-attr="${k}">
        <span class="attr-mod">${signed(calcMod(v))}</span>
      </div>
    `;
  }
  function labelAttr(k) {
    const map = {
      forca: "Força",
      destreza: "Destreza",
      constituicao: "Constituição",
      inteligencia: "Inteligência",
      sabedoria: "Sabedoria",
      carisma: "Carisma",
    };
    return map[k] || k;
  }

  /* ----------------------------- toasts ------------------------ */
  function showToastPergaminho(titulo, mensagem) {
    const old = document.querySelector(".toast-pergaminho");
    if (old) old.remove();
    const box = document.createElement("div");
    box.className = "toast-pergaminho";
    box.innerHTML = `<div class="toast-title">${escapeHTML(
      titulo
    )}</div><div class="toast-msg">${escapeHTML(mensagem)}</div>`;
    document.body.appendChild(box);
    setTimeout(() => {
      box.classList.add("fade-out");
      setTimeout(() => box.remove(), 900);
    }, 3000);
  }

  function showToast(title, msg, ok = false) {
    const old = document.querySelector(".toast");
    if (old) old.remove();
    const el = document.createElement("div");
    el.className = "toast" + (ok ? " ok" : "");
    el.innerHTML = `<div class="title">${escapeHTML(
      title
    )}</div><div>${escapeHTML(msg)}</div>`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  /* ----------------------- export público ---------------------- */
  window.FichaBuilder = {
    init,
    addItem,
    nextPage,
    prevPage,
    setArmaPrincipal,
    attackWithWeapon,
  };
  return {
    init,
    addItem,
    nextPage,
    prevPage,
    setArmaPrincipal,
    attackWithWeapon,
  };
})();
