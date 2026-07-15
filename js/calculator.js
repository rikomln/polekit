// ============================================================
// CALCULATOR
// ============================================================
function calculate() {
  if (!kmlData) return;

  const poleKw = document.getElementById("poleKeyword").value.trim();
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

  const results = poles.map((pole, i) => {
    let minD = Infinity,
      nearestSeg = -1,
      nearestIdx = -1;
    cableSegments.forEach((seg, sIdx) => {
      seg.forEach((cp, j) => {
        const d = dist(pole, cp);
        if (d < minD) {
          minD = d;
          nearestSeg = sIdx;
          nearestIdx = j;
        }
      });
    });

    const seg = cableSegments[nearestSeg];
    const isEnd = nearestIdx === 0 || nearestIdx === seg.length - 1;
    let angle = null;

    if (!isEnd) {
      const b1 = bearing(seg[nearestIdx - 1], seg[nearestIdx]);
      const b2 = bearing(seg[nearestIdx], seg[nearestIdx + 1]);
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

    const accDetail = calcAccDetail(poleType);

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
  renderMap(results, cableSegments, true);

  const deCount = results.filter((r) => r.poleType === "dead_end").length;
  const susCount = results.filter((r) => r.poleType === "suspension").length;
  document.getElementById("footerInfo").textContent =
    `${results.length} tiang total · ${deCount} Dead End · ${susCount} Suspension · threshold ${threshold}°`;
  document.getElementById("exportBtn").disabled = false;
}
