// Route map — Leaflet + free OpenStreetMap tiles, no API key required.

const stops = [
    { name: "London", day: "Days 1–2", coords: [51.5074, -0.1278], note: "Arrival, museums, Daniel, Fallow" },
    { name: "Greenwich", day: "Day 3 AM", coords: [51.4826, -0.0077], note: "Prime Meridian, Royal Observatory" },
    { name: "Warwick", day: "Day 3", coords: [52.2823, -1.5849], note: "Warwick Castle, Binley Mega Chippy" },
    { name: "Tideswell", day: "Days 3–5", coords: [53.2739, -1.7729], note: "Peak District base — Mam Tor, Chatsworth, Bakewell" },
    { name: "Settle", day: "Day 6", coords: [54.0730, -2.2778], note: "Coffee stop + Ribblehead Viaduct nearby" },
    { name: "Kirkmichael", day: "Days 6–9", coords: [56.7275, -3.5090], note: "Highlands base — Glenshee, Ben Macdui" },
    { name: "Edinburgh", day: "Day 10", coords: [55.9533, -3.1883], note: "Rental return, flight home" }
];

const map = L.map("route-map", { scrollWheelZoom: false }).setView([54.0, -2.5], 6);

L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19
}).addTo(map);

const routeLine = L.polyline(
    stops.map((s) => s.coords),
    { color: "#559cff", weight: 3, opacity: 0.8, dashArray: "6 8" }
).addTo(map);

stops.forEach((stop, i) => {
    const marker = L.circleMarker(stop.coords, {
        radius: 8,
        color: "#2f81f7",
        fillColor: "#559cff",
        fillOpacity: 1,
        weight: 2
    }).addTo(map);

    marker.bindPopup(
        `<strong>${i + 1}. ${stop.name}</strong><br>${stop.day}<br>${stop.note}`
    );
});

map.fitBounds(routeLine.getBounds(), { padding: [30, 30] });
