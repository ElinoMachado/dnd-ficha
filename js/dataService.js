/* ============================================================
   DATASERVICE - D&D PROJECT
   Responsável por carregar e gerenciar os arquivos JSON
=============================================================== */

export const DataService = (() => {
  const DATA_PATH = "./assets/data/";
  const CATEGORIES = [
    "racas",
    "classes",
    "equipamentos-aventura",
    "armas",
    "armaduras",
  ];

  const cache = {}; // para armazenar os dados carregados

  /* ============================================================
     Carrega todos os arquivos JSON em paralelo
  ============================================================ */
  async function loadAllData() {
    const promises = CATEGORIES.map(async (category) => {
      try {
        const response = await fetch(`${DATA_PATH}${category}.json`);
        if (!response.ok) throw new Error(`Erro ao carregar ${category}.json`);
        const json = await response.json();
        cache[category] = json;
      } catch (error) {
        console.warn(`[DataService] Falha ao carregar ${category}.json`, error);
        cache[category] = []; // evita erro de acesso
      }
    });

    await Promise.all(promises);
    console.info("[DataService] Todos os dados foram carregados com sucesso.");
    return cache;
  }

  /* ============================================================
     Busca por nome (case-insensitive)
  ============================================================ */
  function findByName(name) {
    const lower = name.toLowerCase();
    for (const category in cache) {
      const item = cache[category].find((i) => i.name?.toLowerCase() === lower);
      if (item) return { ...item, category };
    }
    return null;
  }

  /* ============================================================
     Busca por tipo (ex: "Magia", "Classe", "Raça")
  ============================================================ */
  function findByType(type) {
    const results = [];
    for (const category in cache) {
      cache[category].forEach((item) => {
        if (item.type?.toLowerCase() === type.toLowerCase()) {
          results.push(item);
        }
      });
    }
    return results;
  }

  /* ============================================================
     Busca genérica por chave/valor (ex: "raridade", "nível")
  ============================================================ */
  function searchBy(key, value) {
    const results = [];
    for (const category in cache) {
      cache[category].forEach((item) => {
        if (
          item[key]?.toString().toLowerCase() === value.toString().toLowerCase()
        ) {
          results.push(item);
        }
      });
    }
    return results;
  }

  /* ============================================================
     Retorna todos os dados carregados
  ============================================================ */
  function getAll() {
    return cache;
  }

  /* ============================================================
     Interface pública
  ============================================================ */
  return {
    loadAllData,
    findByName,
    findByType,
    searchBy,
    getAll,
  };
})();
