// ============================================================
// KML PARSING
// ============================================================
const KML_NS = "http://www.opengis.net/kml/2.2";

function getKMLName(el) {
  const n = el.getElementsByTagNameNS(KML_NS, "name")[0];
  return n ? n.textContent.trim() : "";
}

function parseCoords(text) {
  return text
    .trim()
    .split(/\s+/)
    .map((c) => {
      const p = c.split(",");
      return { lon: parseFloat(p[0]), lat: parseFloat(p[1]) };
    })
    .filter((p) => !isNaN(p.lon) && !isNaN(p.lat));
}

function getPoleKeyword() {
  return document.getElementById("poleKeyword").value.trim();
}

// Bisa isi banyak keyword sekaligus, dipisah koma. Contoh: "TB, TE, Pole"
function getPoleKeywords() {
  return getPoleKeyword()
    .split(",")
    .map((k) => k.trim().toLowerCase())
    .filter((k) => k.length > 0);
}

function getCableKeyword() {
  return document.getElementById("cableKeyword").value.trim();
}

function extractPoles(xml) {
  const keywords = getPoleKeywords();
  const poles = [];
  const placemarks = xml.getElementsByTagNameNS(KML_NS, "Placemark");
  for (let pm of placemarks) {
    const name = getKMLName(pm).toLowerCase();
    if (keywords.some((kw) => name.includes(kw))) {
      const coordEl = pm.getElementsByTagNameNS(KML_NS, "coordinates")[0];
      if (coordEl) {
        const pts = parseCoords(coordEl.textContent);
        if (pts.length > 0) poles.push(pts[0]);
      }
    }
  }
  return poles;
}

function extractCable(xml) {
  const kw = getCableKeyword().toLowerCase();
  const segments = [];
  const placemarks = xml.getElementsByTagNameNS(KML_NS, "Placemark");
  for (let pm of placemarks) {
    const name = getKMLName(pm).toLowerCase();
    if (name.includes(kw)) {
      const lineEls = pm.getElementsByTagNameNS(KML_NS, "LineString");
      for (let line of lineEls) {
        const coordEl = line.getElementsByTagNameNS(KML_NS, "coordinates")[0];
        if (coordEl) {
          const pts = parseCoords(coordEl.textContent);
          if (pts.length > 0) segments.push(pts);
        }
      }
    }
  }
  return segments;
}

function countCablePoints(segments) {
  return segments.reduce((sum, s) => sum + s.length, 0);
}

function parseKMLText(text) {
  const parser = new DOMParser();
  return parser.parseFromString(text, "text/xml");
}

// ============================================================
// GEOMETRY
// ============================================================
function dist(p1, p2) {
  const dx = p1.lon - p2.lon,
    dy = p1.lat - p2.lat;
  return Math.sqrt(dx * dx + dy * dy);
}

function bearing(p1, p2) {
  return (Math.atan2(p2.lon - p1.lon, p2.lat - p1.lat) * 180) / Math.PI;
}

function angleBetween(b1, b2) {
  let diff = Math.abs(b1 - b2) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function distMeters(p1, p2) {
  return dist(p1, p2) * 111000;
}

// ============================================================
// GABUNGKAN BANYAK LINESTRING JADI RUTE LOGIS (ROUTE CHAIN)
// ============================================================
// Banyak project punya kabel yang dipecah jadi beberapa Placemark
// LineString terpisah, padahal fisiknya satu jalur menyambung.
// Fungsi ini nyambungin segmen-segmen yang ujungnya berdekatan
// (di bawah toleranceMeters) jadi satu "chain" berurutan, tanpa
// bergantung urutan penulisan di KML. Segmen yang ujungnya jauh
// dari semua segmen lain akan jadi chain/rute terpisah sendiri.
function buildRouteChains(segments, toleranceMeters) {
  const pool = segments
    .filter((s) => s.length > 0)
    .map((s) => ({ points: s, used: false }));

  const chains = [];

  for (let i = 0; i < pool.length; i++) {
    if (pool[i].used) continue;
    pool[i].used = true;
    let chain = [...pool[i].points];

    let extended = true;
    while (extended) {
      extended = false;
      let best = null;

      for (let j = 0; j < pool.length; j++) {
        if (pool[j].used) continue;
        const seg = pool[j].points;
        const segStart = seg[0];
        const segEnd = seg[seg.length - 1];
        const chainHead = chain[0];
        const chainTail = chain[chain.length - 1];

        const candidates = [
          { d: distMeters(chainTail, segStart), atHead: false, reversed: false },
          { d: distMeters(chainTail, segEnd), atHead: false, reversed: true },
          { d: distMeters(chainHead, segEnd), atHead: true, reversed: false },
          { d: distMeters(chainHead, segStart), atHead: true, reversed: true },
        ];

        for (const c of candidates) {
          if (c.d <= toleranceMeters && (!best || c.d < best.d)) {
            best = { ...c, idx: j };
          }
        }
      }

      if (best) {
        const seg = pool[best.idx].points;
        const toAdd = best.reversed ? [...seg].reverse() : seg;
        chain = best.atHead ? [...toAdd, ...chain] : [...chain, ...toAdd];
        pool[best.idx].used = true;
        extended = true;
      }
    }

    chains.push(chain);
  }

  return chains;
}