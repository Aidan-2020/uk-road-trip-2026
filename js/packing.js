// Packing checklist — personal, so this stays in localStorage rather than
// Firestore. Everyone packs their own bag; there's nothing to sync.

const STORAGE_KEY = "ukroadtrip2026_packing";

const categories = [
    {
        name: "Clothing (layers matter more than anything)",
        items: [
            "Waterproof jacket (real one, not fashion-waterproof)",
            "Insulating mid-layer (fleece or down)",
            "Base layers x2",
            "Warm hat + gloves",
            "Waterproof hiking boots, broken in",
            "Wool hiking socks x4",
            "Regular socks & underwear",
            "Jeans/trousers x2",
            "One nicer outfit (Fallow, a show with Daniel)",
            "Comfortable walking shoes for city days"
        ]
    },
    {
        name: "Hiking gear",
        items: [
            "Daypack (20-30L)",
            "Water bottle / bladder",
            "Trekking poles (Mam Tor, Ben Macdui)",
            "Headlamp (early Day 8 start, before sunrise)",
            "Extra layers for summit weather (Cairngorms)",
            "Basic first aid kit",
            "Portable phone charger"
        ]
    },
    {
        name: "Documents & money",
        items: [
            "Passport",
            "Driver's license (for rental car)",
            "Rental car confirmation",
            "Cottage/hotel booking confirmations",
            "Travel insurance details",
            "Debit/credit cards that work internationally",
            "Some cash (small shops, chip shops, tips)"
        ]
    },
    {
        name: "Electronics",
        items: [
            "Phone + charger",
            "UK plug adapter (Type G) x2+",
            "Portable battery pack",
            "Camera (if not just using phone)",
            "Offline maps downloaded for the Highlands"
        ]
    },
    {
        name: "Toiletries & health",
        items: [
            "Toothbrush/toothpaste",
            "Any prescriptions (enough for full trip)",
            "Pain reliever / blister care",
            "Sunscreen (yes, even in November)",
            "Lip balm (wind + cold = chapped lips)"
        ]
    }
];

function loadChecked() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
}

function saveChecked(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let checkedState = loadChecked();

function itemId(catIndex, itemIndex) {
    return `cat${catIndex}-item${itemIndex}`;
}

function render() {
    const container = document.getElementById("checklist-container");

    container.innerHTML = categories
        .map((cat, ci) => {
            const itemsHtml = cat.items
                .map((item, ii) => {
                    const id = itemId(ci, ii);
                    const isChecked = !!checkedState[id];
                    return `
                    <label class="checklist-item ${isChecked ? "checked" : ""}" for="${id}">
                        <input type="checkbox" id="${id}" data-id="${id}" ${isChecked ? "checked" : ""}>
                        <span>${item}</span>
                    </label>`;
                })
                .join("");

            return `
            <div class="checklist-category">
                <h3>${cat.name}</h3>
                ${itemsHtml}
            </div>`;
        })
        .join("");

    container.querySelectorAll("input[type=checkbox]").forEach((box) => {
        box.addEventListener("change", (e) => {
            const id = e.target.dataset.id;
            checkedState[id] = e.target.checked;
            saveChecked(checkedState);
            render();
        });
    });

    updateProgress();
}

function updateProgress() {
    const totalItems = categories.reduce((sum, c) => sum + c.items.length, 0);
    const checkedCount = Object.values(checkedState).filter(Boolean).length;

    document.getElementById("progress-label").textContent = `${checkedCount} / ${totalItems}`;
    document.getElementById("progress-fill").style.width =
        totalItems ? `${(checkedCount / totalItems) * 100}%` : "0%";
}

render();