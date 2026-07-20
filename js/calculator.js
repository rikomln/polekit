// ============================================================
// CALCULATOR
// ============================================================
function calculate() {
  if (!kmlData) return;

  const poleKw = getPoleKeywords().length > 0;
  const cableKw = document.getElementById("cableKeyword").value.trim();

  if (!poleKw) {
    alert("Isi dulu NAMA TIANG DI KML/KMZ sebelum menghitung.");
    document.getElementById("poleKeyword").focus();
    return;
  }
  if (!cableKw) {
    alert("Isi dulu NAMA KABEL DI KML/KMZ sebelum menghitung.");
    document.getElementById("cableKeyword").focus();
    return;
  }

  const threshold = parseInt(document.getElementById("thresholdSlider").value);
  const intervalInput = parseInt(
    document.getElementById("deadEndInterval").value,
  );
  const interval = intervalInput >= 2 ? intervalInput : 5;

  const joinToleranceInput = parseInt(
    document.getElementById("joinTolerance").value,
  );
  const joinTolerance = joinToleranceInput >= 0 ? joinToleranceInput : 15;

  const poles = extractPoles(kmlData);
  const cableSegments = extractCable(kmlData);

  if (poles.length === 0) {
    alert(
      "Tidak ada tiang ditemukan. Cek keyword nama tiang di Project Config.",
    );
    return;
  }
  if (countCablePoints(cableSegments) === 0) {
    alert(
      "Tidak ada jalur kabel ditemukan. Cek keyword nama kabel di Project Config.",
    );
    return;
  }

  // TAHAP 1: gabungkan semua LineString jadi rute logis (chain).
  // Kalau ada beberapa LineString terpisah tapi ujungnya deket
  // (< joinTolerance meter), otomatis disambung jadi satu rute.
  const chains = buildRouteChains(cableSegments, joinTolerance);

  // TAHAP 2: snap tiap tiang ke titik terdekat di ANTARA SEMUA chain
  const snapped = poles.map((pole) => {
    let minD = Infinity,
      nearestChain = -1,
      nearestIdx = -1;
    chains.forEach((chain, cIdx) => {
      chain.forEach((cp, j) => {
        const d = dist(pole, cp);
        if (d < minD) {
          minD = d;
          nearestChain = cIdx;
          nearestIdx = j;
        }
      });
    });

    const chain = chains[nearestChain];
    const isEnd = nearestIdx === 0 || nearestIdx === chain.length - 1;
    let angle = null;

    if (!isEnd) {
      const b1 = bearing(chain[nearestIdx - 1], chain[nearestIdx]);
      const b2 = bearing(chain[nearestIdx], chain[nearestIdx + 1]);
      angle = angleBetween(b1, b2);
    }

    return {
      pole,
      nearestChain,
      nearestIdx,
      isEnd,
      angle,
      snapDist: minD * 111000,
    };
  });

  // TAHAP 3: urutkan tiap tiang berdasarkan posisi fisiknya di chain-nya
  snapped.sort((a, b) => {
    if (a.nearestChain !== b.nearestChain) return a.nearestChain - b.nearestChain;
    return a.nearestIdx - b.nearestIdx;
  });

  // TAHAP 4: tentukan tipe tiang. Pola "1 Dead End tiap N tiang" di-RESET
  // per grup rute (chain) — karena tiap rute fisik yang terpisah biasanya
  // memang mulai dari anchor/dead end sendiri.
  const chainCounters = {};
  const results = snapped.map((s, idx) => {
    const chainNo = s.nearestChain + 1;
    chainCounters[s.nearestChain] = (chainCounters[s.nearestChain] || 0) + 1;
    const orderInChain = chainCounters[s.nearestChain];
    const isTensionPole = (orderInChain - 1) % interval === 0;

    let poleType, reason;
    if (s.isEnd) {
      poleType = "dead_end";
      reason = "Ujung jalur";
    } else if (s.angle !== null && s.angle > threshold) {
      poleType = "dead_end";
      reason = `Sudut ${s.angle.toFixed(1)}°`;
    } else if (isTensionPole) {
      poleType = "dead_end";
      reason = `Tiang tarik (pola 1:${interval})`;
    } else {
      poleType = "suspension";
      reason = s.angle !== null ? `Sudut ${s.angle.toFixed(1)}°` : "Tengah jalur";
    }

    const accDetail = calcAccDetail(poleType);

    return {
      no: idx + 1,
      chainNo,
      orderInChain,
      lon: s.pole.lon,
      lat: s.pole.lat,
      poleType,
      autoType: poleType,
      reason,
      angle: s.angle,
      snapDist: s.snapDist,
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
  renderMap(results, cableSegments, true);

  const deCount = results.filter((r) => r.poleType === "dead_end").length;
  const susCount = results.filter((r) => r.poleType === "suspension").length;
  lastRouteInfo = { chainCount: chains.length, segmentCount: cableSegments.length };
  document.getElementById("footerInfo").textContent =
    `${results.length} tiang total · ${deCount} Dead End · ${susCount} Suspension · threshold ${threshold}° · ${chains.length} grup rute (${cableSegments.length} segmen KML digabung)`;
  document.getElementById("exportBtn").disabled = false;
}