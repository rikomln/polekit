// ============================================================
// RENDER TABLE
// ============================================================
function renderTable(results) {
  const accNames = ["Suspension Clamp", "Dead End Clamp"];
  const container = document.getElementById("tableContent");
  const threshold = parseInt(document.getElementById("thresholdSlider").value);

  const statsHtml = buildStatsCards(results);
  const headerHtml = [
    "No",
    "Koordinat",
    "Tipe Tiang",
    "Keterangan",
    ...accNames,
  ]
    .map((h) => `<th>${h}</th>`)
    .join("");

  const rowsHtml = results
    .map((r) => {
      const isOverride = r.isOverride || false;
      const angleClass =
        r.angle !== null && r.angle > threshold ? "angle-high" : "angle-cell";

      const typeDropdown = `
      <div style="display:flex;align-items:center;gap:6px">
        <select class="pole-type-select" data-id="${r.no}"
          onchange="overridePoleType(${r.no}, this.value)"
          style="
            background:${r.poleType === "dead_end" ? "rgba(255,107,53,0.12)" : "rgba(0,212,255,0.1)"};
            color:${r.poleType === "dead_end" ? "var(--dead-end)" : "var(--suspension)"};
            border:1px solid ${r.poleType === "dead_end" ? "rgba(255,107,53,0.3)" : "rgba(0,212,255,0.25)"};
            border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700;
            font-family:'JetBrains Mono',monospace;cursor:pointer;outline:none;
            appearance:none;-webkit-appearance:none;
          ">
          <option value="suspension" ${r.poleType === "suspension" ? "selected" : ""}>● Suspension</option>
          <option value="dead_end"   ${r.poleType === "dead_end" ? "selected" : ""}>● Dead End</option>
        </select>
        ${isOverride ? `<span title="Diubah manual" style="font-size:10px;color:var(--accent3);font-family:'JetBrains Mono',monospace;cursor:default">✎</span>` : ""}
      </div>
    `;

      const accCells = accNames
        .map((name) => {
          const qty = r.accDetail[name] || 0;
          return `<td class="qty-cell ${qty === 0 ? "qty-zero" : ""}">${qty > 0 ? qty : "—"}</td>`;
        })
        .join("");

      return `<tr id="row-${r.no}">
      <td class="no-cell">${String(r.no).padStart(3, "0")}</td>
      <td class="angle-cell">${r.lon.toFixed(6)}, ${r.lat.toFixed(6)}</td>
      <td>${typeDropdown}</td>
      <td class="${angleClass}">${r.reason}${isOverride ? ' <span style="color:var(--accent3);font-size:10px">[manual]</span>' : ""}</td>
      ${accCells}
    </tr>`;
    })
    .join("");

  container.innerHTML = `
    <div class="table-pane fade-in">
      ${statsHtml}
      <table class="data-table">
        <thead><tr>${headerHtml}</tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
  `;
}

// ============================================================
// OVERRIDE POLE TYPE
// ============================================================
function overridePoleType(poleNo, newType) {
  const idx = calcResults.findIndex((r) => r.no === poleNo);
  if (idx === -1) return;

  const r = calcResults[idx];
  const isOverride = newType !== r.autoType;

  const accDetail = calcAccDetail(newType);

  calcResults[idx] = { ...r, poleType: newType, accDetail, isOverride };

  // Re-render table & summary without full recalculation
  renderTable(calcResults);
  renderSummary(calcResults);
  updateFooter(calcResults);
}

function buildStatsCards(results) {
  const deCount = results.filter((r) => r.poleType === "dead_end").length;
  const susCount = results.filter((r) => r.poleType === "suspension").length;
  const susTotal = results.reduce(
    (sum, r) => sum + (r.accDetail["Suspension Clamp"] || 0),
    0,
  );
  const deTotal = results.reduce(
    (sum, r) => sum + (r.accDetail["Dead End Clamp"] || 0),
    0,
  );

  return `
    <div class="stats-row">
      <div class="stat-card total">
        <div class="stat-value">${results.length}</div>
        <div class="stat-label">TOTAL TIANG</div>
        <div style="font-size:10px;color:var(--text-dim);margin-top:2px;font-family:'JetBrains Mono',monospace">${deCount} DE + ${susCount} Sus</div>
      </div>
      <div class="stat-card suspension">
        <div class="stat-value">${susTotal}</div>
        <div class="stat-label">SUSPENSION CLAMP</div>
        <div style="font-size:10px;color:var(--text-dim);margin-top:2px;font-family:'JetBrains Mono',monospace">pcs total</div>
      </div>
      <div class="stat-card dead-end">
        <div class="stat-value">${deTotal}</div>
        <div class="stat-label">DEAD END CLAMP</div>
        <div style="font-size:10px;color:var(--text-dim);margin-top:2px;font-family:'JetBrains Mono',monospace">pcs total</div>
      </div>
    </div>
  `;
}

function renderSummary(results) {
  const deCount = results.filter((r) => r.poleType === "dead_end").length;
  const susCount = results.filter((r) => r.poleType === "suspension").length;
  const threshold = document.getElementById("thresholdSlider").value;
  const project = document.getElementById("projectName").value || "—";
  const isp = document.getElementById("ispName").value || "—";

  const susQty = getSuspensionQty();
  const deQty = getDeadEndQty();
  const susTotal = results.reduce(
    (sum, r) => sum + (r.accDetail["Suspension Clamp"] || 0),
    0,
  );
  const deTotal = results.reduce(
    (sum, r) => sum + (r.accDetail["Dead End Clamp"] || 0),
    0,
  );
  const grandTotal = susTotal + deTotal;

  document.getElementById("summaryContent").innerHTML = `
    <div class="table-pane fade-in">
      <div class="config-card" style="margin-bottom:20px">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px">
          <div><div class="field-label">PROJECT</div><div style="font-weight:700;margin-top:4px">${project}</div></div>
          <div><div class="field-label">ISP / CLIENT</div><div style="font-weight:700;margin-top:4px">${isp}</div></div>
          <div><div class="field-label">THRESHOLD</div><div style="font-weight:700;margin-top:4px;color:var(--accent);font-family:'JetBrains Mono',monospace">${threshold}°</div></div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
        <div class="stat-card suspension"><div class="stat-value">${susCount}</div><div class="stat-label">TIANG SUSPENSION</div></div>
        <div class="stat-card dead-end"><div class="stat-value">${deCount}</div><div class="stat-label">TIANG DEAD END</div></div>
      </div>
      <div class="section-label" style="margin-bottom:12px">Rekap Kebutuhan Aksesori</div>
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;overflow:hidden">
        <table class="data-table">
          <thead>
            <tr><th>Nama Aksesori</th><th>Berlaku Untuk</th><th>Qty/Tiang</th><th>Jumlah Tiang</th><th>TOTAL QTY</th></tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding:12px 14px;font-weight:600">Suspension Clamp</td>
              <td style="padding:12px 14px;color:var(--suspension);font-family:'JetBrains Mono',monospace">Suspension</td>
              <td style="padding:12px 14px;font-family:'JetBrains Mono',monospace">${susQty} pcs/tiang</td>
              <td style="padding:12px 14px;font-family:'JetBrains Mono',monospace;color:var(--text-dim)">${susCount} tiang</td>
              <td style="padding:12px 14px;font-family:'JetBrains Mono',monospace;font-weight:700;font-size:18px;color:var(--suspension)">${susTotal}</td>
            </tr>
            <tr>
              <td style="padding:12px 14px;font-weight:600">Dead End Clamp</td>
              <td style="padding:12px 14px;color:var(--dead-end);font-family:'JetBrains Mono',monospace">Dead End</td>
              <td style="padding:12px 14px;font-family:'JetBrains Mono',monospace">${deQty} pcs/tiang</td>
              <td style="padding:12px 14px;font-family:'JetBrains Mono',monospace;color:var(--text-dim)">${deCount} tiang</td>
              <td style="padding:12px 14px;font-family:'JetBrains Mono',monospace;font-weight:700;font-size:18px;color:var(--dead-end)">${deTotal}</td>
            </tr>
            <tr style="background:rgba(0,212,255,0.06);border-top:2px solid var(--accent)">
              <td colspan="4" style="padding:12px 14px;font-weight:800;letter-spacing:0.5px">GRAND TOTAL AKSESORI</td>
              <td style="padding:12px 14px;font-family:'JetBrains Mono',monospace;font-weight:800;font-size:22px;color:var(--accent)">${grandTotal}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ============================================================
// BUILD POPUP CONTENT
// ============================================================
function buildPopupContent(r) {
  const isDe = r.poleType === "dead_end";
  const susQty = r.accDetail["Suspension Clamp"] || 0;
  const deQty = r.accDetail["Dead End Clamp"] || 0;
  const overrideBadge = r.isOverride
    ? `<span style="font-size:10px;color:#39ff14;margin-left:6px">✎ manual</span>`
    : "";
  const btnStyle =
    "width:26px;height:26px;border-radius:6px;border:1px solid #1e3a5f;background:#0a0e17;color:#e2e8f0;font-size:16px;font-weight:700;cursor:pointer;text-align:center;font-family:'JetBrains Mono',monospace;";
  const stepperStyle =
    "display:flex;align-items:center;gap:8px;margin-top:6px;";

  const susSection =
    susQty > 0
      ? `
    <div style="margin-top:8px">
      <div style="font-size:10px;color:#888;letter-spacing:1px;margin-bottom:2px">SUSPENSION CLAMP</div>
      <div style="${stepperStyle}">
        <button style="${btnStyle}" onclick="adjustAccQty(${r.no},'Suspension Clamp',-1)">−</button>
        <span id="sus-qty-${r.no}" style="font-family:'JetBrains Mono',monospace;font-weight:700;font-size:16px;color:#00d4ff;min-width:24px;text-align:center">${susQty}</span>
        <button style="${btnStyle}" onclick="adjustAccQty(${r.no},'Suspension Clamp',1)">+</button>
        <span style="font-size:11px;color:#888">pcs</span>
      </div>
    </div>`
      : "";

  const deSection =
    deQty > 0
      ? `
    <div style="margin-top:8px">
      <div style="font-size:10px;color:#888;letter-spacing:1px;margin-bottom:2px">DEAD END CLAMP</div>
      <div style="${stepperStyle}">
        <button style="${btnStyle}" onclick="adjustAccQty(${r.no},'Dead End Clamp',-1)">−</button>
        <span id="de-qty-${r.no}" style="font-family:'JetBrains Mono',monospace;font-weight:700;font-size:16px;color:#ff6b35;min-width:24px;text-align:center">${deQty}</span>
        <button style="${btnStyle}" onclick="adjustAccQty(${r.no},'Dead End Clamp',1)">+</button>
        <span style="font-size:11px;color:#888">pcs</span>
      </div>
    </div>`
      : "";

  return `
    <div style="font-family:'JetBrains Mono',sans-serif;min-width:200px;font-size:12px">
      <div style="font-weight:700;font-size:13px;margin-bottom:8px">
        Tiang TE-${String(r.no).padStart(3, "0")}${overrideBadge}
      </div>
      <div style="margin-bottom:6px;font-size:11px;color:#888">${r.reason}</div>
      <div style="margin-bottom:8px">
        <div style="font-size:10px;color:#888;margin-bottom:4px;letter-spacing:1px">TIPE TIANG</div>
        <select onchange="overridePoleTypeFromMap(${r.no},this.value)"
          style="width:100%;padding:6px 10px;border-radius:8px;font-size:12px;font-family:'JetBrains Mono',monospace;font-weight:700;cursor:pointer;background:${isDe ? "rgba(255,107,53,0.15)" : "rgba(0,212,255,0.1)"};color:${isDe ? "#ff6b35" : "#00d4ff"};border:1px solid ${isDe ? "rgba(255,107,53,0.4)" : "rgba(0,212,255,0.3)"};outline:none;">
          <option value="suspension" ${r.poleType === "suspension" ? "selected" : ""}>● Suspension</option>
          <option value="dead_end"   ${r.poleType === "dead_end" ? "selected" : ""}>■ Dead End</option>
        </select>
      </div>
      <hr style="border-color:#1e3a5f;margin:8px 0">
      ${susSection}${deSection}
    </div>
  `;
}

function makeMarkerIcon(r) {
  const isDe = r.poleType === "dead_end";
  const color = isDe ? "#ff6b35" : "#00d4ff";
  return L.divIcon({
    className: "",
    html: `<div style="width:${isDe ? 10 : 9}px;height:${isDe ? 10 : 9}px;background:${color};border-radius:${isDe ? "2px" : "50%"};border:2px solid rgba(255,255,255,0.8);box-shadow:0 0 6px ${color}88;${r.isOverride ? "outline:2px solid #39ff14;outline-offset:2px;" : ""}"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

// ============================================================
// RENDER MAP
// ============================================================
function renderMap(results, cable, fitView = false) {
  if (!mapInstance) {
    mapInstance = L.map("map", { zoomControl: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
    }).addTo(mapInstance);
  }

  mapLayers.forEach((l) => mapInstance.removeLayer(l));
  mapLayers = [];
  markerMap = {};

  if (cable.length > 1) {
    const line = L.polyline(
      cable.map((c) => [c.lat, c.lon]),
      {
        color: "#00d4ff",
        weight: 2.5,
        opacity: 0.7,
        dashArray: "6,3",
      },
    ).addTo(mapInstance);
    mapLayers.push(line);
  }

  results.forEach((r) => {
    const marker = L.marker([r.lat, r.lon], { icon: makeMarkerIcon(r) })
      .bindPopup(buildPopupContent(r), { maxWidth: 260 })
      .addTo(mapInstance);
    markerMap[r.no] = marker;
    mapLayers.push(marker);
  });

  if (fitView && results.length > 0) {
    mapInstance.fitBounds(L.latLngBounds(results.map((r) => [r.lat, r.lon])), {
      padding: [40, 40],
    });
  }

  const existingLegend = document.querySelector(".map-legend");
  if (existingLegend) existingLegend.remove();
  const legend = L.control({ position: "bottomright" });
  legend.onAdd = function () {
    const div = L.DomUtil.create("div", "map-legend");
    div.style.cssText =
      "background:rgba(17,24,39,0.92);border:1px solid #1e3a5f;border-radius:8px;padding:10px 14px;font-family:'JetBrains Mono',monospace;font-size:11px;color:#e2e8f0;backdrop-filter:blur(8px);";
    div.innerHTML = `
      <div style="margin-bottom:6px;font-weight:700;color:#00d4ff">LEGEND</div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><div style="width:10px;height:10px;background:#ff6b35;border-radius:2px;flex-shrink:0"></div>Dead End</div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><div style="width:10px;height:10px;background:#00d4ff;border-radius:50%;flex-shrink:0"></div>Suspension</div>
      <div style="display:flex;align-items:center;gap:8px"><div style="width:16px;height:2px;background:#00d4ff;opacity:0.7;flex-shrink:0"></div>Jalur Kabel</div>
    `;
    return div;
  };
  legend.addTo(mapInstance);
  setTimeout(() => mapInstance.invalidateSize(), 100);
}

// ============================================================
// ADJUST ACC QTY FROM MAP POPUP
// ============================================================
function adjustAccQty(poleNo, accName, delta) {
  const idx = calcResults.findIndex((r) => r.no === poleNo);
  if (idx === -1) return;

  const r = calcResults[idx];
  const newQty = Math.max(0, (r.accDetail[accName] || 0) + delta);

  calcResults[idx] = {
    ...r,
    accDetail: { ...r.accDetail, [accName]: newQty },
    isOverride: true,
  };

  // Update angka di DOM yang sedang tampil
  const elId =
    accName === "Suspension Clamp" ? `sus-qty-${poleNo}` : `de-qty-${poleNo}`;
  const el = document.getElementById(elId);
  if (el) el.textContent = newQty;

  // Persist popup content di marker
  const marker = markerMap[poleNo];
  if (marker) marker.setPopupContent(buildPopupContent(calcResults[idx]));

  renderTable(calcResults);
  renderSummary(calcResults);
  updateFooter(calcResults);
}

// ============================================================
// OVERRIDE FROM MAP POPUP
// ============================================================
function overridePoleTypeFromMap(poleNo, newType) {
  const idx = calcResults.findIndex((r) => r.no === poleNo);
  if (idx === -1) return;

  const r = calcResults[idx];
  const isOverride = newType !== r.autoType;
  const freshDetail = calcAccDetail(newType);

  // Preserve qty yg sudah di-adjust, kalau ganti tipe pakai default
  const accDetail = {
    "Suspension Clamp":
      newType === "suspension"
        ? r.poleType === "suspension"
          ? r.accDetail["Suspension Clamp"]
          : freshDetail["Suspension Clamp"]
        : 0,
    "Dead End Clamp":
      newType === "dead_end"
        ? r.poleType === "dead_end"
          ? r.accDetail["Dead End Clamp"]
          : freshDetail["Dead End Clamp"]
        : 0,
  };

  calcResults[idx] = { ...r, poleType: newType, accDetail, isOverride };

  const marker = markerMap[poleNo];
  if (marker) {
    marker.setIcon(makeMarkerIcon(calcResults[idx]));
    marker.setPopupContent(buildPopupContent(calcResults[idx]));
    marker.openPopup();
  }

  renderTable(calcResults);
  renderSummary(calcResults);
  updateFooter(calcResults);
}

// ============================================================
// FOOTER & TAB
// ============================================================
function updateFooter(results) {
  const deCount = results.filter((r) => r.poleType === "dead_end").length;
  const susCount = results.filter((r) => r.poleType === "suspension").length;
  const overrideCount = results.filter((r) => r.isOverride).length;
  const threshold = document.getElementById("thresholdSlider").value;
  const overrideNote =
    overrideCount > 0 ? ` · ✎ ${overrideCount} manual override` : "";
  document.getElementById("footerInfo").textContent =
    `${results.length} tiang total · ${deCount} Dead End · ${susCount} Suspension · threshold ${threshold}°${overrideNote}`;
}

function switchTab(name, el) {
  document
    .querySelectorAll(".tab")
    .forEach((t) => t.classList.remove("active"));
  document
    .querySelectorAll(".tab-pane")
    .forEach((p) => p.classList.remove("active"));
  el.classList.add("active");
  document.getElementById("pane-" + name).classList.add("active");
  if (name === "map" && mapInstance)
    setTimeout(() => mapInstance.invalidateSize(), 50);
}
