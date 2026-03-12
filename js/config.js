// ============================================================
// STATE
// ============================================================
let kmlData = null;
let calcResults = null;
let mapInstance = null;
let mapLayers = [];
let markerMap = {}; // poleNo → marker instance

// Fixed accessories — qty diambil langsung dari input HTML
function getSuspensionQty() {
  return parseInt(document.getElementById("qtySuspension").value) || 1;
}
function getDeadEndQty() {
  return parseInt(document.getElementById("qtyDeadEnd").value) || 2;
}

function calcAccDetail(poleType) {
  return {
    "Suspension Clamp": poleType === "suspension" ? getSuspensionQty() : 0,
    "Dead End Clamp": poleType === "dead_end" ? getDeadEndQty() : 0,
  };
}
