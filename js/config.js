// ============================================================
// STATE
// ============================================================
let kmlData = null;
let calcResults = null;
let mapInstance = null;
let mapLayers = [];
let accIdCounter = 4;

let accessories = [
  { id: 1, name: "Suspension Clamp", enabled: true,  qty: 1, applyTo: "suspension", color: "sus" },
  { id: 2, name: "Dead End Clamp",   enabled: true,  qty: 2, applyTo: "dead_end",   color: "de"  },
  { id: 3, name: "Helical PLP",      enabled: false, qty: 2, applyTo: "dead_end",   color: "hel" },
];

// ============================================================
// ACCESSORIES MANAGEMENT
// ============================================================
function renderAccList() {
  const list = document.getElementById("accList");
  list.innerHTML = "";
  accessories.forEach((acc) => {
    const item = document.createElement("div");
    item.className = "acc-item";
    item.innerHTML = `
      <input type="checkbox" class="acc-toggle" ${acc.enabled ? "checked" : ""}
        onchange="toggleAcc(${acc.id}, this.checked)">
      <div>
        <div class="acc-name" style="opacity:${acc.enabled ? 1 : 0.4}">
          ${acc.name}
          <span class="acc-type-badge badge-${acc.color}">${acc.applyTo === "suspension" ? "SUS" : "DE"}</span>
        </div>
        <select class="field-input" style="margin-top:4px;padding:4px 8px;font-size:11px;${acc.enabled ? "" : "opacity:0.4"}"
          onchange="changeAccApply(${acc.id}, this.value)">
          <option value="suspension" ${acc.applyTo === "suspension" ? "selected" : ""}>Tiang Suspension</option>
          <option value="dead_end"   ${acc.applyTo === "dead_end"   ? "selected" : ""}>Tiang Dead End</option>
          <option value="both">Semua Tiang</option>
        </select>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
        <div style="font-size:10px;color:var(--text-dim)">QTY</div>
        <input type="number" class="acc-qty-input" value="${acc.qty}" min="1" max="99"
          onchange="changeAccQty(${acc.id}, this.value)" ${acc.enabled ? "" : "disabled"}>
        <button class="remove-acc-btn" onclick="removeAcc(${acc.id})" title="Hapus">✕</button>
      </div>
    `;
    list.appendChild(item);
  });
}

function toggleAcc(id, val) {
  accessories = accessories.map((a) => a.id === id ? { ...a, enabled: val } : a);
  renderAccList();
}

function changeAccQty(id, val) {
  accessories = accessories.map((a) => a.id === id ? { ...a, qty: parseInt(val) || 1 } : a);
}

function changeAccApply(id, val) {
  const colorMap = { suspension: "sus", dead_end: "de", both: "hel" };
  accessories = accessories.map((a) => a.id === id ? { ...a, applyTo: val, color: colorMap[val] } : a);
  renderAccList();
}

function removeAcc(id) {
  accessories = accessories.filter((a) => a.id !== id);
  renderAccList();
}

function addAccessory() {
  accessories.push({
    id: accIdCounter++,
    name: "Aksesori Baru",
    enabled: true,
    qty: 1,
    applyTo: "suspension",
    color: "sus",
  });
  renderAccList();
}
