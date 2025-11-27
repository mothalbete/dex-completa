// app.js - Lógica principal con búsqueda, filtros, favoritos (≤30) y equipo (≤6)
const API_BASE = "https://pokeapi.co/api/v2";
const PAGE_SIZE = 30;

import {
  renderLoadingGrid,
  renderPokemonCards,
  updatePaginationInfo,
  renderModal,
  closeModal,
  renderTeam,
  renderFavorites
} from "./ui.js";

// DOM
const grid = document.getElementById("grid");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const pageInfo = document.getElementById("pageInfo");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

const filtersForm = document.getElementById("filtersForm");
const typeSelect1 = document.getElementById("typeSelect1");
const typeSelect2 = document.getElementById("typeSelect2");
const abilityInput = document.getElementById("abilityInput");
const moveInput = document.getElementById("moveInput");
const evSelect = document.getElementById("evSelect");
const clearFiltersBtn = document.getElementById("clearFilters");

const modal = document.getElementById("modal");
const closeModalBtn = document.getElementById("closeModal");
const pokemonSprite = document.getElementById("pokemonSprite");
const pokemonNameEl = document.getElementById("pokemonName");
const typeListEl = document.getElementById("typeList");
const abilityListEl = document.getElementById("abilityList");
const statsContentEl = document.getElementById("statsContent");
const evYieldEl = document.getElementById("evYield");

const teamGrid = document.getElementById("teamGrid");
const clearTeamBtn = document.getElementById("clearTeam");
const favoritesGrid = document.getElementById("favoritesGrid");
const clearFavsBtn = document.getElementById("clearFavs");

// Estado
let currentPage = 1;
let totalCount = null;
let currentListIds = null;
let cache = new Map();

let favorites = new Set(JSON.parse(localStorage.getItem("favorites") || "[]"));
let team = JSON.parse(localStorage.getItem("team") || "[]");

init();

function init() {
  bindEvents();
  populateTypes()
    .then(() => loadDefaultPage())
    .catch((e) => showError(e.message));
  restoreFavoritesAndTeamUI();
}

function bindEvents() {
  prevBtn.addEventListener("click", () => { if (currentPage > 1) { currentPage--; loadPageFromIds(); } });
  nextBtn.addEventListener("click", () => { currentPage++; loadPageFromIds(); });

  searchBtn.addEventListener("click", () => {
    const q = searchInput.value.trim().toLowerCase();
    if (q) searchDirect(q);
  });
  searchInput.addEventListener("keydown", (e) => { if (e.key === "Enter") searchBtn.click(); });

  filtersForm.addEventListener("submit", (e) => { e.preventDefault(); applyFilters(); });
  clearFiltersBtn.addEventListener("click", () => { filtersForm.reset(); currentListIds = null; currentPage = 1; loadDefaultPage(); });

  // Modal
  closeModalBtn.addEventListener("click", () => closeModal(modal));
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(modal); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(modal); });

  // Equipo
  clearTeamBtn.addEventListener("click", () => {
    team = [];
    persistTeam();
    renderTeam(teamGrid, team);
  });
  teamGrid.addEventListener("removeTeam", (e) => {
    const idx = e.detail.index;
    team.splice(idx, 1);
    persistTeam();
    renderTeam(teamGrid, team);
  });

  // Favoritos
  clearFavsBtn.addEventListener("click", () => {
    favorites.clear();
    persistFavorites();
    refreshFavoritesUI();
  });
  favoritesGrid.addEventListener("removeFavorite", (e) => {
    const id = e.detail.id;
    favorites.delete(id);
    persistFavorites();
    refreshFavoritesUI();
  });
}

function fetchJSON(url) {
  return fetch(url).then((r) => {
    if (!r.ok) throw new Error(`Error: ${r.status}`);
    return r.json();
  });
}

function fetchPokemonList(offset, limit) {
  return fetchJSON(`${API_BASE}/pokemon?offset=${offset}&limit=${limit}`);
}
function fetchPokemonByNameOrId(idOrName) {
  return fetchJSON(`${API_BASE}/pokemon/${idOrName}`);
}
function fetchAllTypes() {
  return fetchJSON(`${API_BASE}/type`).then((data) => data.results.filter((t) => !["unknown","shadow"].includes(t.name)));
}
function fetchType(typeName) {
  return fetchJSON(`${API_BASE}/type/${typeName}`);
}
function fetchAbility(abilityName) {
  return fetchJSON(`${API_BASE}/ability/${abilityName}`);
}
function fetchMove(moveName) {
  return fetchJSON(`${API_BASE}/move/${moveName}`);
}

function populateTypes() {
  return fetchAllTypes().then((types) => {
    const options = types.map((t) => `<option value="${t.name}">${t.name}</option>`).join("");
    typeSelect1.innerHTML += options;
    typeSelect2.innerHTML += options;
  });
}

function loadDefaultPage() {
  const offset = (currentPage - 1) * PAGE_SIZE;
  renderLoadingGrid(grid, PAGE_SIZE);
  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = true;

  return fetchPokemonList(offset, PAGE_SIZE)
    .then((list) => {
      totalCount = list.count;
      return Promise.all(list.results.map((p) => fetchPokemonByNameOrId(p.name).then((d) => { cache.set(d.id, d); return d; })));
    })
    .then((details) => {
      renderPokemonCards(grid, details, {
        onClick: openModalWithData,
        onFavToggle: toggleFavorite,
        onAddTeam: addToTeam,
        favorites
      });
      nextBtn.disabled = offset + PAGE_SIZE >= totalCount;
      updatePaginationInfo(pageInfo, currentPage, !nextBtn.disabled);
    })
    .catch((err) => showError(err.message));
}

function loadPageFromIds() {
  if (!currentListIds) return loadDefaultPage();
  const offset = (currentPage - 1) * PAGE_SIZE;
  const slice = currentListIds.slice(offset, offset + PAGE_SIZE);

  renderLoadingGrid(grid, slice.length || PAGE_SIZE);
  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = offset + PAGE_SIZE >= currentListIds.length;

  const detailPromises = slice.map((id) => cache.has(id) ? Promise.resolve(cache.get(id)) : fetchPokemonByNameOrId(id).then((d) => { cache.set(d.id, d); return d; }));
  Promise.all(detailPromises)
    .then((details) => {
      renderPokemonCards(grid, details, {
        onClick: openModalWithData,
        onFavToggle: toggleFavorite,
        onAddTeam: addToTeam,
        favorites
      });
      updatePaginationInfo(pageInfo, currentPage, !nextBtn.disabled);
    })
    .catch((err) => showError(err.message));
}

function searchDirect(query) {
  renderLoadingGrid(grid, 1);
  prevBtn.disabled = true; nextBtn.disabled = true;

  fetchPokemonByNameOrId(query)
    .then((data) => {
      currentListIds = [data.id];
      currentPage = 1;
      cache.set(data.id, data);
      renderPokemonCards(grid, [data], {
        onClick: openModalWithData,
        onFavToggle: toggleFavorite,
        onAddTeam: addToTeam,
        favorites
      });
      pageInfo.textContent = `Resultado: ${data.name}`;
    })
    .catch((err) => showError("❌ " + err.message));
}

function openModalWithData(data) {
  renderModal(
    {
      modal,
      pokemonSprite,
      pokemonNameEl,
      typeListEl,
      abilityListEl,
      statsContentEl,
      evYieldEl
    },
    data,
    {
      onFavToggle: toggleFavorite,
      onAddTeam: addToTeam,
      favorites
    }
  );
}

function applyFilters() {
  const type1 = typeSelect1.value;
  const type2 = typeSelect2.value;
  const ability = (abilityInput.value || "").trim().toLowerCase();
  const move = (moveInput.value || "").trim().toLowerCase();
  const evStat = evSelect.value;

  renderLoadingGrid(grid, 12);
  let candidates = null;
  const typePromises = [];
  if (type1) typePromises.push(fetchType(type1));
  if (type2) typePromises.push(fetchType(type2));

  Promise.all(typePromises)
    .then((typeDatas) => {
      typeDatas.forEach((td) => {
        const set = new Set(td.pokemon.map((p) => getIdFromUrl(p.pokemon.url)));
        candidates = candidates ? intersectSets(candidates, set) : set;
      });

      if (ability) {
        return fetchAbility(ability).then((a) => {
          const set = new Set(a.pokemon.map((p) => getIdFromUrl(p.pokemon.url)));
          candidates = candidates ? intersectSets(candidates, set) : set;
        }).catch(() => { candidates = candidates ? intersectSets(candidates, new Set()) : new Set(); });
      }
    })
    .then(() => {
      if (move) {
        return fetchMove(move).then((m) => {
          const set = new Set(m.learned_by_pokemon.map((p) => getIdFromUrl(p.url)));
          candidates = candidates ? intersectSets(candidates, set) : set;
        }).catch(() => { candidates = candidates ? intersectSets(candidates, new Set()) : new Set(); });
      }
    })
    .then(() => {
      if (!candidates) candidates = new Set(Array.from({ length: 1010 }, (_, i) => i + 1));

      if (evStat) {
        const ids = Array.from(candidates);
        return fetchDetailsInChunks(ids, 80).then((details) => {
          const filtered = details.filter((d) => {
            const evObj = d.stats.find((s) => s.stat.name === evStat);
            return evObj && evObj.effort > 0;
          }).map((d) => d.id);
          currentListIds = filtered;
          currentPage = 1;
          loadPageFromIds();
        });
      } else {
        currentListIds = Array.from(candidates);
        currentPage = 1;
        loadPageFromIds();
      }
    })
    .catch((err) => showError("❌ " + err.message));
}

function toggleFavorite(data, btnEl) {
  if (favorites.has(data.id)) {
    favorites.delete(data.id);
  } else {
    if (favorites.size >= 30) {
      alert("Máximo 30 favoritos");
      return;
    }
    favorites.add(data.id);
  }
  persistFavorites();
  if (btnEl) btnEl.textContent = favorites.has(data.id) ? "★ Favorito" : "☆ Favorito";
  refreshFavoritesUI();
}

function addToTeam(data) {
  if (team.length >= 6) {
    alert("Máximo 6 en el equipo");
    return;
  }
  team.push(data);
  persistTeam();
  renderTeam(teamGrid, team);
}

function restoreFavoritesAndTeamUI() {
  renderTeam(teamGrid, team);
  refreshFavoritesUI();
}

function refreshFavoritesUI() {
  const favIds = Array.from(favorites);
  const favDetailsPromises = favIds.map((id) => {
    if (cache.has(id)) return Promise.resolve(cache.get(id));
    return fetchPokemonByNameOrId(id).then((d) => { cache.set(d.id, d); return d; });
  });
  Promise.all(favDetailsPromises).then((favDetails) => {
    renderFavorites(favoritesGrid, favDetails);
  });
}

function persistFavorites() {
  localStorage.setItem("favorites", JSON.stringify(Array.from(favorites)));
}
function persistTeam() {
  localStorage.setItem("team", JSON.stringify(team));
}

function getIdFromUrl(url) {
  const m = url.match(/\/(\d+)\/?$/);
  return m ? parseInt(m[1], 10) : null;
}
function intersectSets(a, b) {
  const out = new Set();
  a.forEach((v) => { if (b.has(v)) out.add(v); });
  return out;
}
function fetchDetailsInChunks(ids, size) {
  const out = [];
  let chain = Promise.resolve();
  for (let i = 0; i < ids.length; i += size) {
    const slice = ids.slice(i, i + size);
    chain = chain.then(() =>
      Promise.all(slice.map((id) => cache.has(id) ? Promise.resolve(cache.get(id)) : fetchPokemonByNameOrId(id).then((d) => { cache.set(d.id, d); return d; })))
        .then((chunk) => out.push(...chunk))
    );
  }
  return chain.then(() => out);
}
function showError(msg) { grid.innerHTML = `<div class="error">${msg}</div>`; }

// Repetidas funciones fetchJSON y helpers ya están más arriba; evita duplicarlas si copias parcial.
