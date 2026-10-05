const STORAGE_KEY = "goal-tracker-state-v1";

const initialState = {
  categories: ["Health", "Career", "Learning", "Personal"],
  goals: [],
  settings: {
    theme: "light",
    accent: "#2563eb",
    density: "normal",
    filters: { status: "all", category: "all", priority: "all", search: "" },
    sort: "created-desc"
  }
};

const state = loadState();

const goalForm = document.getElementById("goal-form");
const goalTitle = document.getElementById("goal-title");
const goalCategory = document.getElementById("goal-category");
const newCategory = document.getElementById("new-category");
const addCategoryButton = document.getElementById("add-category");
const goalPriority = document.getElementById("goal-priority");
const goalDueDate = document.getElementById("goal-due-date");
const goalDetails = document.getElementById("goal-details");

const themeMode = document.getElementById("theme-mode");
const accentColor = document.getElementById("accent-color");
const density = document.getElementById("density");

const filterStatus = document.getElementById("filter-status");
const filterCategory = document.getElementById("filter-category");
const filterPriority = document.getElementById("filter-priority");
const sortGoals = document.getElementById("sort-goals");
const searchGoals = document.getElementById("search-goals");

const goalList = document.getElementById("goal-list");
const emptyState = document.getElementById("empty-state");

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return structuredClone(initialState);
    }
    const parsed = JSON.parse(raw);
    return {
      categories: Array.isArray(parsed.categories) && parsed.categories.length ? parsed.categories : [...initialState.categories],
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      settings: {
        ...initialState.settings,
        ...(parsed.settings || {}),
        filters: { ...initialState.settings.filters, ...(parsed.settings?.filters || {}) }
      }
    };
  } catch {
    return structuredClone(initialState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function renderCategoryOptions() {
  goalCategory.innerHTML = state.categories
    .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
    .join("");

  const selectedFilterCategory = state.settings.filters.category;
  filterCategory.innerHTML = ['<option value="all">All</option>']
    .concat(state.categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`))
    .join("");

  if (state.categories.includes(selectedFilterCategory)) {
    filterCategory.value = selectedFilterCategory;
  }
}

function applyAppearance() {
  document.body.classList.toggle("dark", state.settings.theme === "dark");
  document.body.classList.toggle("compact", state.settings.density === "compact");
  document.documentElement.style.setProperty("--accent", state.settings.accent);

  themeMode.value = state.settings.theme;
  accentColor.value = state.settings.accent;
  density.value = state.settings.density;
}

function renderGoals() {
  const filters = state.settings.filters;
  const term = filters.search.trim().toLowerCase();

  let filtered = state.goals.filter((goal) => {
    if (filters.status === "active" && goal.completed) return false;
    if (filters.status === "completed" && !goal.completed) return false;
    if (filters.category !== "all" && goal.category !== filters.category) return false;
    if (filters.priority !== "all" && goal.priority !== filters.priority) return false;
    if (term && !(`${goal.title} ${goal.details}`.toLowerCase().includes(term))) return false;
    return true;
  });

  filtered.sort(compareBySort(state.settings.sort));

  goalList.innerHTML = filtered.map((goal) => goalCard(goal)).join("");
  emptyState.style.display = filtered.length ? "none" : "block";

  goalList.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", handleGoalAction);
  });

  goalList.querySelectorAll("[data-progress]").forEach((slider) => {
    slider.addEventListener("input", handleProgressInput);
  });
}

function compareBySort(sort) {
  const priorities = { low: 1, medium: 2, high: 3 };
  switch (sort) {
    case "created-asc":
      return (a, b) => a.createdAt - b.createdAt;
    case "due-asc":
      return (a, b) => {
        const ad = a.dueDate ? Date.parse(a.dueDate) : Number.MAX_SAFE_INTEGER;
        const bd = b.dueDate ? Date.parse(b.dueDate) : Number.MAX_SAFE_INTEGER;
        return ad - bd;
      };
    case "priority-desc":
      return (a, b) => priorities[b.priority] - priorities[a.priority];
    case "title-asc":
      return (a, b) => a.title.localeCompare(b.title);
    case "created-desc":
    default:
      return (a, b) => b.createdAt - a.createdAt;
  }
}

function goalCard(goal) {
  const dueText = goal.dueDate ? `Due ${goal.dueDate}` : "No due date";
  const completedClass = goal.completed ? "completed" : "";

  return `
    <article class="goal-card ${completedClass}" data-goal-id="${goal.id}">
      <div class="goal-head">
        <h3 class="goal-title">${escapeHtml(goal.title)}</h3>
        <div class="badges">
          <span class="badge">${escapeHtml(goal.category)}</span>
          <span class="badge">${escapeHtml(goal.priority)}</span>
          <span class="badge">${goal.completed ? "completed" : "active"}</span>
        </div>
      </div>
      <p class="goal-meta">${escapeHtml(dueText)}</p>
      <p class="goal-details">${escapeHtml(goal.details || "No details")}</p>
      <div class="progress-wrap">
        <input data-progress="${goal.id}" type="range" min="0" max="100" value="${goal.progress}" />
        <progress max="100" value="${goal.progress}"></progress>
        <span>${goal.progress}%</span>
      </div>
      <div class="actions">
        <button data-action="toggle" data-id="${goal.id}">${goal.completed ? "Mark Active" : "Mark Completed"}</button>
        <button class="secondary" data-action="edit" data-id="${goal.id}">Edit</button>
        <button class="danger" data-action="delete" data-id="${goal.id}">Delete</button>
      </div>
    </article>
  `;
}

function handleGoalAction(event) {
  const { action, id } = event.target.dataset;
  const goal = state.goals.find((item) => item.id === id);
  if (!goal) return;

  if (action === "toggle") {
    goal.completed = !goal.completed;
    if (goal.completed && goal.progress < 100) {
      goal.progress = 100;
    }
  }

  if (action === "edit") {
    const title = prompt("Goal title", goal.title);
    if (title === null) return;
    const details = prompt("Goal details", goal.details || "");
    if (details === null) return;
    goal.title = title.trim() || goal.title;
    goal.details = details.trim();
  }

  if (action === "delete") {
    state.goals = state.goals.filter((item) => item.id !== id);
  }

  saveState();
  renderGoals();
}

function handleProgressInput(event) {
  const id = event.target.dataset.progress;
  const goal = state.goals.find((item) => item.id === id);
  if (!goal) return;

  goal.progress = Number(event.target.value);
  goal.completed = goal.progress === 100;
  saveState();
  renderGoals();
}

function addCategory() {
  const category = newCategory.value.trim();
  if (!category) return;
  if (state.categories.includes(category)) {
    newCategory.value = "";
    return;
  }

  state.categories.push(category);
  newCategory.value = "";
  goalCategory.value = category;
  saveState();
  renderCategoryOptions();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

goalForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = goalTitle.value.trim();
  if (!title) return;

  const goal = {
    id: crypto.randomUUID(),
    title,
    category: goalCategory.value,
    priority: goalPriority.value,
    dueDate: goalDueDate.value,
    details: goalDetails.value.trim(),
    completed: false,
    progress: 0,
    createdAt: Date.now()
  };

  state.goals.push(goal);
  goalForm.reset();
  goalPriority.value = "medium";
  saveState();
  renderGoals();
});

addCategoryButton.addEventListener("click", addCategory);
newCategory.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addCategory();
  }
});

themeMode.addEventListener("change", () => {
  state.settings.theme = themeMode.value;
  saveState();
  applyAppearance();
});

accentColor.addEventListener("change", () => {
  state.settings.accent = accentColor.value;
  saveState();
  applyAppearance();
});

density.addEventListener("change", () => {
  state.settings.density = density.value;
  saveState();
  applyAppearance();
});

filterStatus.addEventListener("change", () => {
  state.settings.filters.status = filterStatus.value;
  saveState();
  renderGoals();
});

filterCategory.addEventListener("change", () => {
  state.settings.filters.category = filterCategory.value;
  saveState();
  renderGoals();
});

filterPriority.addEventListener("change", () => {
  state.settings.filters.priority = filterPriority.value;
  saveState();
  renderGoals();
});

sortGoals.addEventListener("change", () => {
  state.settings.sort = sortGoals.value;
  saveState();
  renderGoals();
});

searchGoals.addEventListener("input", () => {
  state.settings.filters.search = searchGoals.value;
  saveState();
  renderGoals();
});

function hydrateControls() {
  filterStatus.value = state.settings.filters.status;
  filterPriority.value = state.settings.filters.priority;
  sortGoals.value = state.settings.sort;
  searchGoals.value = state.settings.filters.search;
}

renderCategoryOptions();
applyAppearance();
hydrateControls();
renderGoals();
