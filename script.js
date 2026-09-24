let allSpots = [];
let viewMode = "cards"; // Two way of showing options either as cards or list 
let userLocation = null; 
let map = null;
let mapVisible = false;

const activeFilters = {
  noise: new Set(),
  size: new Set(),
  lighting: new Set(),
  outlets: new Set(),
  food: new Set(),
  indoorOutdoor: new Set(),
  type: new Set(),
};

let hiddenGemOnly = false;
let searchTerm = "";
let sortField = "name";

// Noise 
const NOISE_BUCKET_KEYWORDS = {
  "Quiet": ["quiet"],
  "Moderate": ["moderate"],
  "Lively / Social": ["lively", "loud", "social"],
};
const NOISE_BUCKETS = Object.keys(NOISE_BUCKET_KEYWORDS);

// Space 
const TYPE_MAP = {
  "Library": "Library",
  "Main library": "Library",
  "Morrison Library": "Library",
  "Reading room": "Library",
  "Stacks": "Library",
  "Café": "Café",
  "Café/social study": "Café",
  "Community center": "Student center / lounge",
  "Community/study space": "Student center / lounge",
  "Lounge": "Student center / lounge",
  "Student activity/social space": "Student center / lounge",
  "Student center": "Student center / lounge",
  "Outdoor social/study": "Outdoor space",
  "Outdoor study": "Outdoor space",
  "Outdoor study/social": "Outdoor space",
  "Outdoor/social study": "Outdoor space",
  "Academic building study space": "Academic building space",
  "Hidden study spot": "Academic building space",
};

function typeCategory(rawType) {
  return TYPE_MAP[rawType] || rawType;
}

// Size, food, outlets, lighting and space type 
const CATEGORY_ORDER = {
  size: ["Large", "Medium", "Small"],
  food: ["Food friendly", "Snacks/drinks with lids", "Drinks with lids", "Food not allowed"],
  outlets: ["Many", "Good", "Limited"],
  lighting: ["Excellent", "Good", "Okay"],
  type: ["Library", "Café", "Student center / lounge", "Outdoor space", "Academic building space"],
};


// Approximate building coordinates (UC Berkeley campus).
// These are hand-estimated for demo purposes (nudge them in a mapping
// tool if you want pinpoint accuracy for a specific building entrance).
const BUILDING_COORDS = {
  "Doe Library": { lat: 37.8721, lng: -122.2600 },
  "VLSB": { lat: 37.8734, lng: -122.2603 },
  "Music Library": { lat: 37.8712, lng: -122.2589 },
  "Haas": { lat: 37.8698, lng: -122.2469 },
  "McCone Hall": { lat: 37.8749, lng: -122.2578 },
  "Haviland Hall": { lat: 37.8709, lng: -122.2610 },
  "Wurster Hall": { lat: 37.8698, lng: -122.2578 },
  "Stephens Hall": { lat: 37.8698, lng: -122.2597 },
  "Chemistry building": { lat: 37.8737, lng: -122.2591 },
  "MLK Student Union": { lat: 37.8686, lng: -122.2589 },
  "Cesar Chavez Student Center": { lat: 37.8690, lng: -122.2593 },
  "Bakar Gateway Building": { lat: 37.8721, lng: -122.2650 },
  "Campus": { lat: 37.8719, lng: -122.2585 },
  "Sproul Plaza": { lat: 37.8695, lng: -122.2590 },
  "Lower Sproul": { lat: 37.8686, lng: -122.2591 },
  "Kresge Hall": { lat: 37.8752, lng: -122.2585 },
};

// Init
async function init() {
  try {
    const res = await fetch("data/study-spots.json");
    allSpots = await res.json();
  } catch (err) {
    document.getElementById("cardGrid").innerHTML =
      "<p style='color:#5b564a;'>Could not load study spot data. Make sure data/study-spots.json is present.</p>";
    console.error(err);
    return;
  }

  buildFilterOptions();
  attachEvents();
  initTheme();
  fetchWeather();
  render();
}


// Dark mode
function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "dark") applyTheme("dark");

  document.getElementById("themeToggle").addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    applyTheme(isDark ? "light" : "dark");
  });
}

function applyTheme(theme) {
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    document.getElementById("themeIcon").textContent = "☀️";
  } else {
    document.documentElement.removeAttribute("data-theme");
    document.getElementById("themeIcon").textContent = "🌙";
  }
  localStorage.setItem("theme", theme);
  if (map) map.invalidateSize();
}


// Weather banner (Open-Meteo)
async function fetchWeather() {
  const banner = document.getElementById("weatherBanner");
  try {
    const res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=37.8719&longitude=-122.2585&current=temperature_2m,precipitation,weather_code&temperature_unit=fahrenheit"
    );
    const data = await res.json();
    const { temperature_2m, precipitation, weather_code } = data.current;

    const isRainy = precipitation > 0 || [51, 53, 55, 61, 63, 65, 80, 81, 82, 95].includes(weather_code);
    const isSunny = [0, 1].includes(weather_code);

    let message, emoji;
    if (isRainy) {
      emoji = "🌧️";
      message = `It's rainy right now (${Math.round(temperature_2m)}°F)! Maybe skip the outdoor spots today.`;
    } else if (isSunny) {
      emoji = "☀️";
      message = `It's sunny and ${Math.round(temperature_2m)}°F! Great day to try an outdoor study spot!`;
    } else {
      emoji = "⛅";
      message = `Currently ${Math.round(temperature_2m)}°F on campus.`;
    }

    banner.innerHTML = `<span>${emoji}</span><span>${message}</span>`;
    banner.hidden = false;
    banner.dataset.rainy = isRainy ? "true" : "false";
    banner.dataset.sunny = isSunny ? "true" : "false";
  } catch (err) {
    console.error("Weather fetch failed:", err);
    banner.hidden = true;
  }
}


// Build filter checkboxes
function buildFilterOptions() {
  ["size", "lighting", "outlets", "food", "type"].forEach((field) => {
    renderOptionGroup(field, CATEGORY_ORDER[field]);
  });

  const indoorOutdoorValues = uniqueSorted(allSpots.map((s) => s.indoorOutdoor).filter(Boolean));
  renderOptionGroup("indoorOutdoor", indoorOutdoorValues);

 
  renderOptionGroup("noise", NOISE_BUCKETS);
}

function uniqueSorted(arr) {
  return [...new Set(arr)].sort((a, b) => a.localeCompare(b));
}

function renderOptionGroup(field, values) {
  const container = document.querySelector(`.filter-options[data-field="${field}"]`);
  container.innerHTML = values
    .map((val) => {
      const id = `filter-${field}-${slug(val)}`;
      return `
        <label class="filter-option" for="${id}">
          <input type="checkbox" id="${id}" data-field="${field}" value="${escapeAttr(val)}">
          <span>${escapeHtml(val)}</span>
        </label>`;
    })
    .join("");
}

function slug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function attachEvents() {
  document.querySelectorAll(".filter-options input[type=checkbox]").forEach((cb) => {
    cb.addEventListener("change", (e) => {
      const field = e.target.dataset.field;
      if (e.target.checked) activeFilters[field].add(e.target.value);
      else activeFilters[field].delete(e.target.value);
      render();
    });
  });

  document.getElementById("hiddenGemOnly").addEventListener("change", (e) => {
    hiddenGemOnly = e.target.checked;
    render();
  });

  document.getElementById("search").addEventListener("input", (e) => {
    searchTerm = e.target.value.trim().toLowerCase();
    render();
  });

  document.getElementById("sortBy").addEventListener("change", (e) => {
    sortField = e.target.value;
    render();
  });

  document.getElementById("clearFilters").addEventListener("click", clearAll);
  document.getElementById("emptyClear").addEventListener("click", clearAll);

  const toggle = document.getElementById("filterToggle");
  const panel = document.getElementById("filterPanel");
  toggle.addEventListener("click", () => {
    const isOpen = panel.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  // View (cards / list)
  document.getElementById("viewCardsBtn").addEventListener("click", () => setViewMode("cards"));
  document.getElementById("viewListBtn").addEventListener("click", () => setViewMode("list"));

  // Surprise me
  document.getElementById("surpriseBtn").addEventListener("click", surpriseMe);

  // Near me
  document.getElementById("nearMeBtn").addEventListener("click", useMyLocation);

  // Map 
  document.getElementById("mapToggleBtn").addEventListener("click", toggleMap);

  const shareBtn = document.getElementById("shareSpotBtn");
  if (shareBtn) {
    shareBtn.addEventListener("click", (e) => {
      const rect = shareBtn.getBoundingClientRect();
      fireConfetti(rect.left + rect.width / 2, rect.top + window.scrollY);
    });
  }
}

function clearAll() {
  Object.values(activeFilters).forEach((set) => set.clear());
  hiddenGemOnly = false;
  searchTerm = "";
  document.getElementById("search").value = "";
  document.getElementById("hiddenGemOnly").checked = false;
  document.querySelectorAll(".filter-options input[type=checkbox]").forEach((cb) => (cb.checked = false));
  render();
}


// View (cards / list)
function setViewMode(mode) {
  viewMode = mode;
  document.getElementById("viewCardsBtn").classList.toggle("active", mode === "cards");
  document.getElementById("viewListBtn").classList.toggle("active", mode === "list");
  document.getElementById("viewCardsBtn").setAttribute("aria-pressed", String(mode === "cards"));
  document.getElementById("viewListBtn").setAttribute("aria-pressed", String(mode === "list"));
  render();
}


// Surprise me
function surpriseMe() {
  const { spots: filtered } = getFiltered();
  if (filtered.length === 0) return;
  const pick = filtered[Math.floor(Math.random() * filtered.length)];
  const el = document.getElementById(`spot-${pick.id}`);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.add("spot-highlight");
  setTimeout(() => el.classList.remove("spot-highlight"), 1800);
}

// "near me"
function useMyLocation() {
  const btn = document.getElementById("nearMeBtn");
  if (!navigator.geolocation) {
    alert("Geolocation isn't supported in this browser.");
    return;
  }

  btn.textContent = "📍 Locating…";
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      btn.textContent = "📍 Near me ✓";
      document.getElementById("sortDistanceOption").hidden = false;
      document.getElementById("sortBy").value = "distance";
      sortField = "distance";
      render();
    },
    (err) => {
      console.error(err);
      btn.textContent = "📍 Near me";
      alert("Couldn't get your location. Check your browser's location permission and try again.");
    },
    { timeout: 10000 }
  );
}

function haversineDistanceMiles(lat1, lng1, lat2, lng2) {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getSpotDistance(spot) {
  if (!userLocation) return null;
  const coords = BUILDING_COORDS[spot.building];
  if (!coords) return null;
  return haversineDistanceMiles(userLocation.lat, userLocation.lng, coords.lat, coords.lng);
}


// Lightweight confetti burst, no library.
// Uses the Web Animations API (element.animate()) instead of a CSS
// @keyframes + custom properties, since each piece needs its own
// randomized direction/rotation and plain CSS keyframes can't take
// per-element values without a --custom-property.
function fireConfetti(x, y) {
  const colors = ["#FDB515", "#003262", "#5C6B4E", "#F5F1E6"];
  const count = 26;

  for (let i = 0; i < count; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = `${x}px`;
    piece.style.top = `${y}px`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];

    const angle = Math.random() * Math.PI * 2;
    const distance = 80 + Math.random() * 120;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance - 60;
    const rotate = Math.random() * 720 - 360;

    document.body.appendChild(piece);

    const animation = piece.animate(
      [
        { transform: "translate(0px, 0px) rotate(0deg)", opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) rotate(${rotate}deg)`, opacity: 0 },
      ],
      { duration: 900, easing: "ease-out", fill: "forwards" }
    );

    animation.onfinish = () => piece.remove();
    // Fallback in case onfinish doesn't fire in some browser edge case.
    setTimeout(() => piece.remove(), 1000);
  }
}


// Map
function toggleMap() {
  mapVisible = !mapVisible;
  const container = document.getElementById("mapContainer");
  const btn = document.getElementById("mapToggleBtn");
  container.hidden = !mapVisible;
  btn.textContent = mapVisible ? "🗺️ Hide campus map" : "🗺️ Show campus map";

  if (mapVisible && !map) {
    initMap();
  } else if (mapVisible && map) {
    setTimeout(() => map.invalidateSize(), 50);
  }
}

function initMap() {
  map = L.map("mapContainer").setView([37.8719, -122.2585], 16);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19,
  }).addTo(map);

  // Group spots by building so each building gets one pin
  const byBuilding = {};
  allSpots.forEach((spot) => {
    if (!byBuilding[spot.building]) byBuilding[spot.building] = [];
    byBuilding[spot.building].push(spot);
  });

  Object.entries(byBuilding).forEach(([building, spots]) => {
    const coords = BUILDING_COORDS[building];
    if (!coords) return;

    const marker = L.marker([coords.lat, coords.lng]).addTo(map);
    const listHtml = spots
      .map((s) => `<li><a href="#spot-${s.id}" class="map-popup-link" data-id="${s.id}">${escapeHtml(s.name)}</a></li>`)
      .join("");
    marker.bindPopup(`<strong>${escapeHtml(building)}</strong><ul class="map-popup-list">${listHtml}</ul>`);

    marker.on("popupopen", () => {
      document.querySelectorAll(".map-popup-link").forEach((link) => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          const id = link.dataset.id;
          const el = document.getElementById(`spot-${id}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("spot-highlight");
            setTimeout(() => el.classList.remove("spot-highlight"), 1800);
          }
        });
      });
    });
  });
}


// Filtering logic
const FIELD_LABELS = {
  size: "Size",
  lighting: "Lighting",
  outlets: "Outlets",
  food: "Food & drink",
  indoorOutdoor: "Setting",
  type: "Space type",
  noise: "Noise level",
};

// "closest match" candidates when no spot satisfies every filter.
const FIELD_MATCHERS = {
  size: (spot) => activeFilters.size.size === 0 || activeFilters.size.has(spot.size),
  lighting: (spot) => activeFilters.lighting.size === 0 || activeFilters.lighting.has(spot.lighting),
  outlets: (spot) => activeFilters.outlets.size === 0 || activeFilters.outlets.has(spot.outlets),
  food: (spot) => activeFilters.food.size === 0 || activeFilters.food.has(spot.food),
  type: (spot) => activeFilters.type.size === 0 || activeFilters.type.has(typeCategory(spot.type)),
  indoorOutdoor: (spot) => activeFilters.indoorOutdoor.size === 0 || activeFilters.indoorOutdoor.has(spot.indoorOutdoor),
  noise: (spot) => {
    if (activeFilters.noise.size === 0) return true;
    const value = (spot.noise || "").toLowerCase();
    return [...activeFilters.noise].some((bucket) =>
      NOISE_BUCKET_KEYWORDS[bucket].some((kw) => value.includes(kw))
    );
  },
};

function passesHardFilters(spot) {
  if (hiddenGemOnly && !spot.hiddenGem) return false;
  if (searchTerm) {
    const haystack = `${spot.name} ${spot.building} ${spot.nearby}`.toLowerCase();
    if (!haystack.includes(searchTerm)) return false;
  }
  return true;
}

function matchesSpot(spot) {
  if (!passesHardFilters(spot)) return false;
  return Object.values(FIELD_MATCHERS).every((fn) => fn(spot));
}

function activeFieldNames() {
  return Object.keys(FIELD_MATCHERS).filter((f) => activeFilters[f].size > 0);
}

function countMatchingFields(spot, fields) {
  return fields.filter((f) => FIELD_MATCHERS[f](spot)).length;
}

function sortSpots(spots) {
  if (sortField === "distance" && userLocation) {
    return spots.sort((a, b) => {
      const da = getSpotDistance(a);
      const db = getSpotDistance(b);
      if (da === null && db === null) return 0;
      if (da === null) return 1;
      if (db === null) return -1;
      return da - db;
    });
  }
  return spots.sort((a, b) => (a[sortField] || "").localeCompare(b[sortField] || ""));
}


function getFiltered() {
  const candidates = allSpots.filter(passesHardFilters);
  const exact = candidates.filter((spot) => Object.values(FIELD_MATCHERS).every((fn) => fn(spot)));

  if (exact.length > 0) {
    return { spots: sortSpots(exact), isFallback: false, matches: {} };
  }

  const fields = activeFieldNames();
  if (fields.length === 0 || candidates.length === 0) {
    return { spots: [], isFallback: false, matches: {} };
  }

  const scored = candidates.map((spot) => ({ spot, score: countMatchingFields(spot, fields) }));
  const maxScore = Math.max(...scored.map((s) => s.score));
  const closest = scored.filter((s) => s.score === maxScore).map((s) => s.spot);

  const matches = {};
  closest.forEach((spot) => {
    matches[spot.id] = fields.filter((f) => FIELD_MATCHERS[f](spot)).map((f) => FIELD_LABELS[f]);
  });

  return { spots: sortSpots(closest), isFallback: true, matches };
}


function noiseColor(noise) {
  const v = (noise || "").toLowerCase();
  if (v.includes("very quiet")) return "#003262";
  if (v.includes("quiet")) return "#2f5d8a";
  if (v.includes("social")) return "#5C6B4E";
  if (v.includes("loud") || v.includes("lively")) return "#A9820C";
  return "#A98F5A";
}


function render() {
  const { spots: filtered, isFallback, matches } = getFiltered();
  const grid = document.getElementById("cardGrid");
  const empty = document.getElementById("emptyState");
  const countEl = document.getElementById("resultCount");
  const fallbackBanner = document.getElementById("fallbackBanner");

  updateFilterBadge();
  grid.classList.toggle("list-view", viewMode === "list");

  if (filtered.length === 0) {
    grid.innerHTML = "";
    empty.hidden = false;
    fallbackBanner.hidden = true;
    countEl.textContent = "0 spots";
    return;
  }
  empty.hidden = true;

  if (isFallback) {
    fallbackBanner.hidden = false;
    fallbackBanner.textContent = `Showing the ${filtered.length} closest option${filtered.length === 1 ? "" : "s"}.`;
    countEl.textContent = `${filtered.length} closest match${filtered.length === 1 ? "" : "es"}`;
  } else {
    fallbackBanner.hidden = true;
    countEl.textContent = `${filtered.length} spot${filtered.length === 1 ? "" : "s"}`;
  }

  grid.innerHTML = filtered
    .map((spot) =>
      viewMode === "list" ? listItemTemplate(spot, matches[spot.id]) : cardTemplate(spot, matches[spot.id])
    )
    .join("");
}

function distanceTag(spot) {
  const dist = getSpotDistance(spot);
  if (dist === null) return "";
  return `<span class="tag distance-tag">📍 ${dist.toFixed(1)} mi</span>`;
}

function matchNote(matchedFields) {
  if (!matchedFields || matchedFields.length === 0) return "";
  return `<p class="match-note">✓ Close enough — matches: ${matchedFields.map(escapeHtml).join(", ")}</p>`;
}

// NOTE: the noise color used to be passed down via a --noise-color
// custom property on the card, inherited by the .tag.noise child.
// Without custom properties, we set the real CSS properties
// (border-left-color on the card, border-color/color on the tag)
// directly and individually instead.
function cardTemplate(spot, matchedFields) {
  const color = noiseColor(spot.noise);
  return `
    <article class="spot-card" id="spot-${spot.id}" style="border-left-color:${color}">
      <div class="spot-card-head">
        <h3 class="spot-name">${escapeHtml(spot.name)}</h3>
        ${spot.hiddenGem ? `<span class="gem-mark">Hidden gem</span>` : ""}
      </div>
      <p class="spot-building">${escapeHtml(spot.building)} &middot; ${escapeHtml(spot.type || "")}</p>
      <div class="tag-row">
        <span class="tag noise" style="border-color:${color};color:${color}">${escapeHtml(spot.noise || "")}</span>
        <span class="tag">${escapeHtml(spot.size || "")}</span>
        <span class="tag">${escapeHtml(spot.lighting || "")} lighting</span>
        <span class="tag">Outlets: ${escapeHtml(spot.outlets || "")}</span>
        <span class="tag">${escapeHtml(spot.food || "")}</span>
        <span class="tag">${escapeHtml(spot.indoorOutdoor || "")}</span>
        ${distanceTag(spot)}
      </div>
      <p class="spot-best-for"><strong>Best for:</strong> ${escapeHtml(spot.bestFor || "")}</p>
      ${matchNote(matchedFields)}
      ${spot.notes ? `<p class="spot-notes">${escapeHtml(spot.notes)}</p>` : ""}
    </article>`;
}

function listItemTemplate(spot, matchedFields) {
  const color = noiseColor(spot.noise);
  return `
    <article class="spot-list-item" id="spot-${spot.id}" style="border-left-color:${color}">
      <div class="list-item-main">
        <h3 class="spot-name">${escapeHtml(spot.name)} ${spot.hiddenGem ? `<span class="gem-mark">Hidden gem</span>` : ""}</h3>
        <p class="spot-building">${escapeHtml(spot.building)} &middot; ${escapeHtml(spot.type || "")}</p>
        ${matchNote(matchedFields)}
      </div>
      <div class="tag-row list-item-tags">
        <span class="tag noise" style="border-color:${color};color:${color}">${escapeHtml(spot.noise || "")}</span>
        <span class="tag">${escapeHtml(spot.size || "")}</span>
        <span class="tag">${escapeHtml(spot.outlets || "")} outlets</span>
        <span class="tag">${escapeHtml(spot.indoorOutdoor || "")}</span>
        ${distanceTag(spot)}
      </div>
    </article>`;
}

function updateFilterBadge() {
  const total = Object.values(activeFilters).reduce((sum, set) => sum + set.size, 0) + (hiddenGemOnly ? 1 : 0);
  const badge = document.getElementById("filterCount");
  if (total > 0) {
    badge.hidden = false;
    badge.textContent = total;
  } else {
    badge.hidden = true;
  }
}


function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, "&quot;");
}

init();