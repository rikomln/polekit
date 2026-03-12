// ============================================================
// RENDER TABLE
// ============================================================
function renderTable(results) {
  const activeAcc = accessories.filter((a) => a.enabled);
  const container = document.getElementById("tableContent");
  const threshold = parseInt(document.getElementById("thresholdSlider").value);

  const statsHtml = buildStatsCards(results);
  const headerHtml = [
    "No",
    "Koordinat",
    "Tipe Tiang",
    "Keterangan",
    ...activeAcc.map((a) => a.name),
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

      const accCells = activeAcc
        .map((a) => {
          const qty = r.accDetail[a.name] || 0;
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

  // Recalculate accessories for this pole
  const accDetail = {};
  accessories
    .filter((a) => a.enabled)
    .forEach((a) => {
      const applies =
        a.applyTo === "both" ||
        (a.applyTo === "dead_end" && newType === "dead_end") ||
        (a.applyTo === "suspension" && newType === "suspension");
      accDetail[a.name] = applies ? a.qty : 0;
    });

  calcResults[idx] = { ...r, poleType: newType, accDetail, isOverride };

  // Re-render table & summary without full recalculation
  renderTable(calcResults);
  renderSummary(calcResults);
  updateFooter(calcResults);
}

function buildStatsCards(results) {
  const deCount = results.filter((r) => r.poleType === "dead_end").length;
  const susCount = results.filter((r) => r.poleType === "suspension").length;

  const accTotals = {};
  accessories
    .filter((a) => a.enabled)
    .forEach((a) => {
      accTotals[a.name] = results.reduce(
        (sum, r) => sum + (r.accDetail[a.name] || 0),
        0,
      );
    });

  const accCards = Object.entries(accTotals)
    .map(([name, qty]) => {
      const acc = accessories.find((a) => a.name === name);
      const cls =
        acc?.color === "de"
          ? "dead-end"
          : acc?.color === "hel"
            ? "helical"
            : "suspension";
      return `
      <div class="stat-card ${cls}">
        <div class="stat-value">${qty}</div>
        <div class="stat-label">${name.toUpperCase()}</div>
        <div style="font-size:10px;color:var(--text-dim);margin-top:2px;font-family:'JetBrains Mono',monospace">pcs total</div>
      </div>
    `;
    })
    .join("");

  return `
    <div class="stats-row">
      <div class="stat-card total">
        <div class="stat-value">${results.length}</div>
        <div class="stat-label">TOTAL TIANG TE</div>
        <div style="font-size:10px;color:var(--text-dim);margin-top:2px;font-family:'JetBrains Mono',monospace">${deCount} DE + ${susCount} Sus</div>
      </div>
      ${accCards}
    </div>
  `;
}

// ============================================================
// RENDER SUMMARY
// ============================================================
function renderSummary(results) {
  const activeAcc = accessories.filter((a) => a.enabled);
  const deCount = results.filter((r) => r.poleType === "dead_end").length;
  const susCount = results.filter((r) => r.poleType === "suspension").length;
  const threshold = document.getElementById("thresholdSlider").value;
  const project = document.getElementById("projectName").value || "—";
  const isp = document.getElementById("ispName").value || "—";

  const accRows = activeAcc
    .map((a) => {
      const total = results.reduce(
        (sum, r) => sum + (r.accDetail[a.name] || 0),
        0,
      );
      const tiangCount = results.filter(
        (r) => (r.accDetail[a.name] || 0) > 0,
      ).length;
      const applyLabel =
        a.applyTo === "suspension"
          ? "Suspension"
          : a.applyTo === "dead_end"
            ? "Dead End"
            : "Semua";
      return `
      <tr>
        <td style="padding:12px 14px;font-weight:600">${a.name}</td>
        <td style="padding:12px 14px;color:var(--text-dim);font-family:'JetBrains Mono',monospace">${applyLabel}</td>
        <td style="padding:12px 14px;font-family:'JetBrains Mono',monospace">${a.qty} pcs/tiang</td>
        <td style="padding:12px 14px;font-family:'JetBrains Mono',monospace;color:var(--text-dim)">${tiangCount} tiang</td>
        <td style="padding:12px 14px;font-family:'JetBrains Mono',monospace;font-weight:700;font-size:18px;color:var(--accent)">${total}</td>
      </tr>
    `;
    })
    .join("");

  const totalAll = activeAcc.reduce(
    (sum, a) =>
      sum + results.reduce((s, r) => s + (r.accDetail[a.name] || 0), 0),
    0,
  );

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
        <div class="stat-card dead-end"><div class="stat-value">${deCount}</div><div class="stat-label">TIANG DEAD END</div></div>
        <div class="stat-card suspension"><div class="stat-value">${susCount}</div><div class="stat-label">TIANG SUSPENSION</div></div>
      </div>
      <div class="section-label" style="margin-bottom:12px">Rekap Kebutuhan Aksesori</div>
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;overflow:hidden">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nama Aksesori</th><th>Berlaku Untuk</th>
              <th>Qty/Tiang</th><th>Jumlah Tiang</th><th>TOTAL QTY</th>
            </tr>
          </thead>
          <tbody>
            ${accRows}
            <tr style="background:rgba(0,212,255,0.06);border-top:2px solid var(--accent)">
              <td colspan="4" style="padding:12px 14px;font-weight:800;letter-spacing:0.5px">GRAND TOTAL AKSESORI</td>
              <td style="padding:12px 14px;font-family:'JetBrains Mono',monospace;font-weight:800;font-size:22px;color:var(--accent)">${totalAll}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
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
    const isDe = r.poleType === "dead_end";
    const color = isDe ? "#ff6b35" : "#00d4ff";

    const icon = L.divIcon({
      className: "",
      html: `<div style="
        width:${isDe ? 10 : 9}px;height:${isDe ? 10 : 9}px;
        background:${color};
        border-radius:${isDe ? "2px" : "50%"};
        border:2px solid rgba(255,255,255,0.8);
        box-shadow:0 0 6px ${color}88;
        ${r.isOverride ? "outline:2px solid #39ff14;outline-offset:2px;" : ""}
      "></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

    const accLines = accessories
      .filter((a) => a.enabled)
      .map((a) => {
        const qty = r.accDetail[a.name] || 0;
        return qty > 0 ? `<b>${a.name}</b>: ${qty} pcs` : null;
      })
      .filter(Boolean)
      .join("<br>");

    const overrideBadge = r.isOverride
      ? `<span style="font-size:10px;color:#39ff14;margin-left:6px">✎ manual</span>`
      : "";

    const popupContent = `
      <div style="font-family:'JetBrains Mono',sans-serif;min-width:200px;font-size:12px">
        <div style="font-weight:700;font-size:13px;margin-bottom:8px">
          Tiang TE-${String(r.no).padStart(3, "0")}${overrideBadge}
        </div>
        <div style="margin-bottom:6px;font-size:11px;color:#888">${r.reason}</div>

        <div style="margin-bottom:8px">
          <div style="font-size:10px;color:#888;margin-bottom:4px;letter-spacing:1px">TIPE TIANG</div>
          <select
            id="map-override-${r.no}"
            onchange="overridePoleTypeFromMap(${r.no}, this.value)"
            style="
              width:100%;padding:6px 10px;border-radius:8px;font-size:12px;
              font-family:'JetBrains Mono',monospace;font-weight:700;cursor:pointer;
              background:${isDe ? "rgba(255,107,53,0.15)" : "rgba(0,212,255,0.1)"};
              color:${isDe ? "#ff6b35" : "#00d4ff"};
              border:1px solid ${isDe ? "rgba(255,107,53,0.4)" : "rgba(0,212,255,0.3)"};
              outline:none;
            ">
            <option value="suspension" ${r.poleType === "suspension" ? "selected" : ""}>● Suspension</option>
            <option value="dead_end"   ${r.poleType === "dead_end" ? "selected" : ""}>■ Dead End</option>
          </select>
        </div>

        <hr style="border-color:#1e3a5f;margin:8px 0">
        <div style="color:#aaa">${accLines || "Tidak ada aksesori aktif"}</div>
      </div>
    `;

    const marker = L.marker([r.lat, r.lon], { icon })
      .bindPopup(popupContent, { maxWidth: 240 })
      .addTo(mapInstance);
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
    div.style.cssText = `
      background:rgba(17,24,39,0.92);border:1px solid #1e3a5f;
      border-radius:8px;padding:10px 14px;font-family:'JetBrains Mono',monospace;
      font-size:11px;color:#e2e8f0;backdrop-filter:blur(8px);
    `;
    div.innerHTML = `
      <div style="margin-bottom:6px;font-weight:700;color:#00d4ff">LEGEND</div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
        <div style="width:10px;height:10px;background:#ff6b35;border-radius:2px;flex-shrink:0"></div>Dead End
      </div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
        <div style="width:10px;height:10px;background:#00d4ff;border-radius:50%;flex-shrink:0"></div>Suspension
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <div style="width:16px;height:2px;background:#00d4ff;opacity:0.7;flex-shrink:0"></div>Jalur Kabel
      </div>
    `;
    return div;
  };
  legend.addTo(mapInstance);
  setTimeout(() => mapInstance.invalidateSize(), 100);
}

// ============================================================
// OVERRIDE FROM MAP POPUP
// ============================================================
function overridePoleTypeFromMap(poleNo, newType) {
  // Close popup first, then override & re-render map
  mapInstance.closePopup();
  overridePoleType(poleNo, newType);
  // Re-render map to update marker color & popup
  renderMap(calcResults, extractCable(kmlData));
}
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
