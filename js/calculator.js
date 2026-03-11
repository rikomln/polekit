// ============================================================
// CALCULATOR
// ============================================================
function calculate() {
  if (!kmlData) return;

  const threshold = parseInt(document.getElementById("thresholdSlider").value);
  const poles = extractPoles(kmlData);
  const cable = extractCable(kmlData);

  if (poles.length === 0) {
    alert("Tidak ada tiang TE ditemukan di KML.");
    return;
  }
  if (cable.length === 0) {
    alert("Tidak ada jalur kabel ADSS ditemukan di KML.");
    return;
  }

  const results = poles.map((pole, i) => {
    let minD = Infinity,
      nearestIdx = -1;
    cable.forEach((cp, j) => {
      const d = dist(pole, cp);
      if (d < minD) {
        minD = d;
        nearestIdx = j;
      }
    });

    const isEnd = nearestIdx === 0 || nearestIdx === cable.length - 1;
    let angle = null;

    if (!isEnd && nearestIdx > 0 && nearestIdx < cable.length - 1) {
      const b1 = bearing(cable[nearestIdx - 1], cable[nearestIdx]);
      const b2 = bearing(cable[nearestIdx], cable[nearestIdx + 1]);
      angle = angleBetween(b1, b2);
    }

    let poleType, reason;
    if (isEnd) {
      poleType = "dead_end";
      reason = "Ujung jalur";
    } else if (angle !== null && angle > threshold) {
      poleType = "dead_end";
      reason = `Sudut ${angle.toFixed(1)}°`;
    } else {
      poleType = "suspension";
      reason = angle !== null ? `Sudut ${angle.toFixed(1)}°` : "Tengah jalur";
    }

    const accDetail = {};
    accessories
      .filter((a) => a.enabled)
      .forEach((a) => {
        const applies =
          a.applyTo === "both" ||
          (a.applyTo === "dead_end" && poleType === "dead_end") ||
          (a.applyTo === "suspension" && poleType === "suspension");
        accDetail[a.name] = applies ? a.qty : 0;
      });

    return {
      no: i + 1,
      lon: pole.lon,
      lat: pole.lat,
      poleType,
      autoType: poleType,
      reason,
      angle,
      snapDist: minD * 111000,
      accDetail,
      isOverride: false,
    };
  });

  calcResults = results;

  const pname = document.getElementById("projectName").value;
  if (pname) {
    const badge = document.getElementById("projectBadge");
    badge.textContent = pname;
    badge.style.display = "block";
  }

  renderTable(results);
  renderSummary(results);
  renderMap(results, extractCable(kmlData), true);

  const deCount = results.filter((r) => r.poleType === "dead_end").length;
  const susCount = results.filter((r) => r.poleType === "suspension").length;
  document.getElementById("footerInfo").textContent =
    `${results.length} tiang total · ${deCount} Dead End · ${susCount} Suspension · threshold ${threshold}°`;
  document.getElementById("exportBtn").disabled = false;
}
