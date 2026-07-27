// Budget calculator — persists to localStorage so it survives refreshes on your phone.

const STORAGE_KEY = "ukroadtrip2026_expenses";
const PEOPLE_KEY = "ukroadtrip2026_people";

const CATEGORY_ICON = {
    Lodging: "🏠",
    Food: "🍽️",
    Attractions: "🎟️",
    Transport: "🚗",
    Other: "📦"
};

function loadExpenses() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
        try {
            return JSON.parse(raw);
        } catch (e) {
            return defaultExpenses();
        }
    }
    return defaultExpenses();
}

// A few real costs already pinned down from the itinerary, so the page
// isn't empty on first load. Fully editable/deletable.
function defaultExpenses() {
    return [
        { id: 1, name: "Fallow dinner", category: "Food", cost: 50, split: 3 },
        { id: 2, name: "The Shard (advance)", category: "Attractions", cost: 24, split: 3 },
        { id: 3, name: "Chatsworth House", category: "Attractions", cost: 35, split: 3 }
    ];
}

function saveExpenses(expenses) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

function loadPeople() {
    const raw = localStorage.getItem(PEOPLE_KEY);
    return raw ? parseInt(raw, 10) : 3;
}

function savePeople(count) {
    localStorage.setItem(PEOPLE_KEY, String(count));
}

let expenses = loadExpenses();
let people = loadPeople();

function render() {
    const list = document.getElementById("expense-list");
    const peopleCountEl = document.getElementById("people-count");

    peopleCountEl.textContent = people;

    if (expenses.length === 0) {
        list.innerHTML = '<div class="empty-state">No expenses yet — add your first one above.</div>';
    } else {
        list.innerHTML = expenses
            .map((e) => {
                const perPersonForItem = (e.cost / e.split).toFixed(2);
                return `
                <div class="expense-row" data-id="${e.id}">
                    <div>${CATEGORY_ICON[e.category] || "📦"} ${escapeHtml(e.name)}</div>
                    <div><span class="cat-tag">${e.category}</span></div>
                    <div class="cost">£${Number(e.cost).toFixed(2)}</div>
                    <div class="per-person">£${perPersonForItem} / person (${e.split}-way)</div>
                    <button class="delete-btn" onclick="deleteExpense(${e.id})" title="Remove">✕</button>
                </div>`;
            })
            .join("");
    }

    const total = expenses.reduce((sum, e) => sum + Number(e.cost), 0);
    document.getElementById("total-cost").textContent = `£${total.toFixed(2)}`;
    document.getElementById("per-person-cost").textContent = `£${(total / people).toFixed(2)}`;
    document.getElementById("item-count").textContent = expenses.length;
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

function deleteExpense(id) {
    expenses = expenses.filter((e) => e.id !== id);
    saveExpenses(expenses);
    render();
}

document.getElementById("expense-form").addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("exp-name").value.trim();
    const category = document.getElementById("exp-category").value;
    const cost = parseFloat(document.getElementById("exp-cost").value);
    const split = parseInt(document.getElementById("exp-split").value, 10) || 1;

    if (!name || isNaN(cost)) return;

    expenses.push({ id: Date.now(), name, category, cost, split });
    saveExpenses(expenses);
    render();

    this.reset();
    document.getElementById("exp-split").value = people;
    document.getElementById("exp-name").focus();
});

document.getElementById("people-plus").addEventListener("click", function () {
    people += 1;
    savePeople(people);
    render();
});

document.getElementById("people-minus").addEventListener("click", function () {
    people = Math.max(1, people - 1);
    savePeople(people);
    render();
});

// initial paint
document.getElementById("exp-split").value = people;
render();
