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
  return (document.getElementById("poleKeyword")?.value || "TE").trim();
}

function getCableKeyword() {
  return (document.getElementById("cableKeyword")?.value || "ADSS").trim();
}

function extractPoles(xml, keyword) {
  const kw = (keyword || getPoleKeyword()).toLowerCase();
  const poles = [];
  const placemarks = xml.getElementsByTagNameNS(KML_NS, "Placemark");
  for (let pm of placemarks) {
    const name = getKMLName(pm).toLowerCase();
    if (name.includes(kw)) {
      const coordEl = pm.getElementsByTagNameNS(KML_NS, "coordinates")[0];
      if (coordEl) {
        const pts = parseCoords(coordEl.textContent);
        if (pts.length > 0) poles.push(pts[0]);
      }
    }
  }
  return poles;
}

function extractCable(xml, keyword) {
  const kw = (keyword || getCableKeyword()).toLowerCase();
  const coords = [];
  const placemarks = xml.getElementsByTagNameNS(KML_NS, "Placemark");
  for (let pm of placemarks) {
    const name = getKMLName(pm).toLowerCase();
    if (name.includes(kw)) {
      const lineEls = pm.getElementsByTagNameNS(KML_NS, "LineString");
      for (let line of lineEls) {
        const coordEl = line.getElementsByTagNameNS(KML_NS, "coordinates")[0];
        if (coordEl) coords.push(...parseCoords(coordEl.textContent));
      }
    }
  }
  return coords;
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
