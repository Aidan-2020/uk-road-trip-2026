// Budget calculator — v2
// - Manual expenses + the shared "people" count live in Firestore, so everyone
//   with the site link sees the same live totals.
// - Priced items already tagged in itinerary.html (data-budget-name /
//   data-budget-per-person) are pulled in automatically and shown as
//   read-only rows, so a price only ever needs to be entered once.

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    deleteDoc,
    doc,
    onSnapshot,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBTMXBuGcPly9ZrFlQ9WrZejIOaIBiQqTY",
    authDomain: "uk-road-trip-2026.firebaseapp.com",
    projectId: "uk-road-trip-2026",
    storageBucket: "uk-road-trip-2026.firebasestorage.app",
    messagingSenderId: "618594962635",
    appId: "1:618594962635:web:eb3eaeb86173d018871f4e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const CATEGORY_ICON = {
    Lodging: "🏠",
    Food: "🍽️",
    Attractions: "🎟️",
    Transport: "🚗",
    Other: "📦"
};

let manualExpenses = []; // synced from Firestore "expenses" collection
let itineraryItems = []; // pulled from itinerary.html, read-only
let excludedNames = []; // itinerary item names someone has marked "skip" — synced
let people = 3; // synced from Firestore "settings/people"

// ---------- Pull priced items straight from itinerary.html ----------

async function loadItineraryItems() {
    try {
        const res = await fetch("itinerary.html");
        const html = await res.text();
        const parsed = new DOMParser().parseFromString(html, "text/html");
        const tagged = parsed.querySelectorAll("[data-budget-name]");

        itineraryItems = Array.from(tagged).map((el) => ({
            name: el.getAttribute("data-budget-name"),
            perPerson: parseFloat(el.getAttribute("data-budget-per-person")) || 0
        }));
    } catch (e) {
        console.error("Couldn't load itinerary items:", e);
        itineraryItems = [];
    }
    render();
}

// ---------- Firestore: manual expenses ----------

const expensesRef = collection(db, "expenses");

onSnapshot(expensesRef, (snapshot) => {
    manualExpenses = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    render();
});

// ---------- Firestore: shared people count ----------

const peopleDocRef = doc(db, "settings", "people");

onSnapshot(peopleDocRef, (snap) => {
    if (snap.exists()) {
        people = snap.data().count || 3;
        render();
    }
});

async function ensurePeopleDocExists() {
    const snap = await getDoc(peopleDocRef);
    if (!snap.exists()) {
        await setDoc(peopleDocRef, { count: 3 });
    }
}

// ---------- Firestore: excluded itinerary items (shared "skip this" toggle) ----------

const excludedDocRef = doc(db, "settings", "excludedItineraryItems");

onSnapshot(excludedDocRef, (snap) => {
    excludedNames = snap.exists() ? snap.data().names || [] : [];
    render();
});

async function ensureExcludedDocExists() {
    const snap = await getDoc(excludedDocRef);
    if (!snap.exists()) {
        await setDoc(excludedDocRef, { names: [] });
    }
}

window.toggleItineraryItem = async function (name) {
    const isExcluded = excludedNames.includes(name);
    const updated = isExcluded
        ? excludedNames.filter((n) => n !== name)
        : [...excludedNames, name];
    await setDoc(excludedDocRef, { names: updated });
};

// ---------- Rendering ----------

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

function render() {
    const list = document.getElementById("expense-list");
    document.getElementById("people-count").textContent = people;

    const itineraryRows = itineraryItems.map((item) => {
        const isSkipped = excludedNames.includes(item.name);
        const total = item.perPerson * people;
        return `
        <div class="expense-row ${isSkipped ? "skipped" : ""}">
            <div>🗓️ ${escapeHtml(item.name)}</div>
            <div><span class="cat-tag">${isSkipped ? "Skipped" : "From itinerary"}</span></div>
            <div class="cost">£${total.toFixed(2)}</div>
            <div class="per-person">£${item.perPerson.toFixed(2)} / person</div>
            <button class="delete-btn" onclick="window.toggleItineraryItem('${item.name.replace(/'/g, "\\'")}')" title="${isSkipped ? "Include again" : "Skip this — we're not doing it"}">${isSkipped ? "↺" : "✕"}</button>
        </div>`;
    });

    const manualRows = manualExpenses.map((e) => {
        const perPersonForItem = (e.cost / (e.split || people)).toFixed(2);
        return `
        <div class="expense-row">
            <div>${CATEGORY_ICON[e.category] || "📦"} ${escapeHtml(e.name)}</div>
            <div><span class="cat-tag">${e.category}</span></div>
            <div class="cost">£${Number(e.cost).toFixed(2)}</div>
            <div class="per-person">£${perPersonForItem} / person (${e.split || people}-way)</div>
            <button class="delete-btn" onclick="window.deleteExpense('${e.id}')" title="Remove">✕</button>
        </div>`;
    });

    const allRows = [...itineraryRows, ...manualRows];

    list.innerHTML = allRows.length
        ? allRows.join("")
        : '<div class="empty-state">No expenses yet — add your first one above.</div>';

    const itineraryTotal = itineraryItems
        .filter((i) => !excludedNames.includes(i.name))
        .reduce((sum, i) => sum + i.perPerson * people, 0);
    const manualTotal = manualExpenses.reduce((sum, e) => sum + Number(e.cost), 0);
    const total = itineraryTotal + manualTotal;

    document.getElementById("total-cost").textContent = `£${total.toFixed(2)}`;
    document.getElementById("per-person-cost").textContent = `£${(total / people).toFixed(2)}`;
    document.getElementById("item-count").textContent = allRows.length;
}

// ---------- Actions ----------

window.deleteExpense = async function (id) {
    await deleteDoc(doc(db, "expenses", id));
};

document.getElementById("expense-form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("exp-name").value.trim();
    const category = document.getElementById("exp-category").value;
    const cost = parseFloat(document.getElementById("exp-cost").value);
    const split = parseInt(document.getElementById("exp-split").value, 10) || people;

    if (!name || isNaN(cost)) return;

    await addDoc(expensesRef, { name, category, cost, split });

    this.reset();
    document.getElementById("exp-split").value = people;
    document.getElementById("exp-name").focus();
});

document.getElementById("people-plus").addEventListener("click", async function () {
    await setDoc(peopleDocRef, { count: people + 1 });
});

document.getElementById("people-minus").addEventListener("click", async function () {
    await setDoc(peopleDocRef, { count: Math.max(1, people - 1) });
});

// ---------- Init ----------

document.getElementById("exp-split").value = people;
ensurePeopleDocExists();
ensureExcludedDocExists();
loadItineraryItems();