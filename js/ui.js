// ui.js - Renderizado en el DOM usando imágenes oficiales de Pokémon Home

export function renderLoadingGrid(container, count = 30) {
  container.innerHTML = Array.from({ length: count })
    .map(() => `
      <div class="pokemon-card" aria-busy="true">
        <div style="width:80px;height:80px;background:#1b2335;border-radius:8px;"></div>
        <div style="width:70%;height:14px;margin-top:8px;background:#1b2335;border-radius:6px;"></div>
      </div>
    `)
    .join("");
}

export function renderPokemonCards(container, list, { onClick, onFavToggle, onAddTeam, favorites }) {
  container.innerHTML = "";
  list.forEach((data) => {
    const card = document.createElement("div");
    card.className = "pokemon-card";

    const img = document.createElement("img");
    img.className = "pokemon-sprite";
    img.alt = `Imagen de ${data.name}`;
    img.src =
      data?.sprites?.other?.["official-artwork"]?.front_default ||
      data?.sprites?.front_default ||
      "";

    const nameEl = document.createElement("div");
    nameEl.className = "pokemon-name";
    nameEl.textContent = data.name;

    const actions = document.createElement("div");
    actions.className = "card-actions";

    const openBtn = document.createElement("button");
    openBtn.textContent = "Detalles";
    openBtn.addEventListener("click", () => onClick(data));

    const favBtn = document.createElement("button");
    favBtn.textContent = favorites.has(data.id) ? "★ Favorito" : "☆ Favorito";
    favBtn.addEventListener("click", () => onFavToggle(data, favBtn));

    const teamBtn = document.createElement("button");
    teamBtn.textContent = "Equipo";
    teamBtn.addEventListener("click", () => onAddTeam(data));

    actions.append(openBtn, favBtn, teamBtn);

    card.append(img, nameEl, actions);
    container.appendChild(card);
  });
}

export function updatePaginationInfo(infoEl, page, hasNext) {
  infoEl.textContent = `Página ${page}${!hasNext ? " (última)" : ""}`;
}

export function renderModal(modalRefs, data, { onFavToggle, onAddTeam, favorites }) {
  const { modal, pokemonSprite, pokemonNameEl, typeListEl, abilityListEl, statsContentEl, evYieldEl } = modalRefs;

  pokemonSprite.src =
    data?.sprites?.other?.["official-artwork"]?.front_default ||
    data?.sprites?.front_default ||
    "";
  pokemonNameEl.textContent = data.name;
  typeListEl.textContent = "Tipos: " + data.types.map((t) => t.type.name).join(", ");
  abilityListEl.textContent = "Habilidades: " + data.abilities.map((a) => a.ability.name).join(", ");
  evYieldEl.textContent = evText(data);
  statsContentEl.textContent = data.stats.map((s) => `${s.stat.name}: ${s.base_stat}`).join(" | ");

  // Botones de acción dentro del modal
  const actions = document.createElement("div");
  actions.className = "modal-actions";

  const favBtn = document.createElement("button");
  favBtn.textContent = favorites.has(data.id) ? "★ Favorito" : "☆ Favorito";
  favBtn.addEventListener("click", () => onFavToggle(data, favBtn));

  const teamBtn = document.createElement("button");
  teamBtn.textContent = "Añadir al equipo";
  teamBtn.addEventListener("click", () => onAddTeam(data));

  actions.append(favBtn, teamBtn);
  modal.querySelector(".modal-content").appendChild(actions);

  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
}

export function closeModal(modalEl) {
  modalEl.classList.remove("show");
  modalEl.setAttribute("aria-hidden", "true");
  // Limpia botones duplicados
  const actions = modalEl.querySelector(".modal-actions");
  if (actions) actions.remove();
}

function evText(data) {
  const evs = data.stats.filter((s) => s.effort > 0);
  if (!evs.length) return "EVs al derrotarlo: 0";
  return "EVs al derrotarlo: " + evs.map((s) => `${s.stat.name} +${s.effort}`).join(", ");
}

export function renderTeam(container, team) {
  container.innerHTML = "";
  for (let i = 0; i < 6; i++) {
    const slot = document.createElement("div");
    slot.className = "slot";
    const member = team[i];
    if (member) {
      const img = document.createElement("img");
      img.src = member.sprites.other["official-artwork"].front_default;
      img.alt = member.name;
      const name = document.createElement("div");
      name.textContent = member.name;
      const btn = document.createElement("button");
      btn.textContent = "Quitar";
      btn.addEventListener("click", () =>
        container.dispatchEvent(new CustomEvent("removeTeam", { detail: { index: i } }))
      );
      slot.append(img, name, btn);
    } else {
      slot.textContent = "Vacío";
    }
    container.appendChild(slot);
  }
}

export function renderFavorites(container, favoritesList) {
  container.innerHTML = "";
  favoritesList.forEach((p) => {
    const card = document.createElement("div");
    card.className = "fav-card";
    const img = document.createElement("img");
    img.src = p.sprites.other["official-artwork"].front_default;
    img.alt = p.name;
    const name = document.createElement("div");
    name.textContent = p.name;
    const btn = document.createElement("button");
    btn.textContent = "Eliminar";
    btn.addEventListener("click", () =>
      container.dispatchEvent(new CustomEvent("removeFavorite", { detail: { id: p.id } }))
    );
    card.append(img, name, btn);
    container.appendChild(card);
  });
}
