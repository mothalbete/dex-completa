// api.js - Fetch con then y utilidades
const API_BASE = "https://pokeapi.co/api/v2";
export const PAGE_SIZE = 30;

export function fetchPokemonList(offset = 0, limit = PAGE_SIZE) {
  return fetch(`${API_BASE}/pokemon?offset=${offset}&limit=${limit}`)
    .then((res) => {
      if (!res.ok) throw new Error("Error al listar Pokémon");
      return res.json();
    });
}

export function fetchPokemonByNameOrId(idOrName) {
  return fetch(`${API_BASE}/pokemon/${idOrName}`)
    .then((res) => {
      if (!res.ok) throw new Error("Pokémon no encontrado");
      return res.json();
    });
}

export function fetchType(typeName) {
  return fetch(`${API_BASE}/type/${typeName}`)
    .then((res) => {
      if (!res.ok) throw new Error("Tipo no encontrado");
      return res.json();
    });
}

export function fetchAbility(abilityName) {
  return fetch(`${API_BASE}/ability/${abilityName}`)
    .then((res) => {
      if (!res.ok) throw new Error("Habilidad no encontrada");
      return res.json();
    });
}

export function fetchMove(moveName) {
  return fetch(`${API_BASE}/move/${moveName}`)
    .then((res) => {
      if (!res.ok) throw new Error("Movimiento no encontrado");
      return res.json();
    });
}

export function fetchAllTypes() {
  return fetch(`${API_BASE}/type`)
    .then((res) => {
      if (!res.ok) throw new Error("Error al cargar tipos");
      return res.json();
    })
    .then((data) => data.results.filter((t) => !["unknown", "shadow"].includes(t.name)));
}

export function getAnimatedSprite(sprites) {
  const v = sprites && sprites.versions && sprites.versions["generation-v"] && sprites.versions["generation-v"]["black-white"] && sprites.versions["generation-v"]["black-white"].animated;
  return v && v.front_default ? v.front_default : null;
}

export function getIdFromUrl(url) {
  const m = url.match(/\/(\d+)\/?$/);
  return m ? parseInt(m[1], 10) : null;
}
