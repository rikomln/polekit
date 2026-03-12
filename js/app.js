// ============================================================
// FILE UPLOAD
// ============================================================
const uploadZone = document.getElementById("uploadZone");
const fileInput = document.getElementById("fileInput");

uploadZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadZone.classList.add("dragover");
});
uploadZone.addEventListener("dragleave", () =>
  uploadZone.classList.remove("dragover"),
);
uploadZone.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadZone.classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  if (file) loadFile(file);
});

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) loadFile(file);
});

function loadFile(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  if (ext === "kml") {
    const reader = new FileReader();
    reader.onload = (e) => processKML(e.target.result, file.name);
    reader.readAsText(file);
  } else if (ext === "kmz") {
    const reader = new FileReader();
    reader.onload = (e) => processKMZ(e.target.result, file.name);
    reader.readAsArrayBuffer(file);
  } else {
    alert("Format tidak didukung. Gunakan file .kml atau .kmz");
  }
}

function processKML(text, filename) {
  kmlData = parseKMLText(text);
  showFileInfo(filename);
}

async function processKMZ(buffer, filename) {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const kmlFile =
      zip.file("doc.kml") ||
      Object.values(zip.files).find((f) => f.name.endsWith(".kml"));
    if (!kmlFile) {
      alert("Tidak ditemukan file KML di dalam KMZ.");
      return;
    }
    const text = await kmlFile.async("string");
    kmlData = parseKMLText(text);
    showFileInfo(filename);
  } catch (err) {
    alert("Gagal membaca file KMZ: " + err.message);
  }
}

function showFileInfo(filename) {
  const poles = extractPoles(kmlData);
  const cable = extractCable(kmlData);

  const info = document.getElementById("fileInfo");
  info.style.display = "block";
  info.innerHTML = `
    <div class="file-loaded">
      <span class="dot">●</span>
      <div>
        <div style="font-weight:700;font-size:13px">${filename}</div>
        <div style="font-size:11px;color:var(--text-dim);font-family:'JetBrains Mono',monospace;margin-top:2px">
          ${poles.length} tiang · ${cable.length} titik kabel
        </div>
      </div>
    </div>
  `;

  document.getElementById("calcBtn").disabled = false;

  const uploadTitle = uploadZone.querySelector(".upload-title");
  const uploadSub = uploadZone.querySelector(".upload-sub");
  if (uploadTitle) uploadTitle.textContent = filename;
  if (uploadSub)
    uploadSub.textContent = `${poles.length} tiang · ${cable.length} titik kabel`;
}

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  renderAccList();

  // Update file input to accept both kml and kmz
  fileInput.setAttribute("accept", ".kml,.kmz");
  const uploadSub = uploadZone.querySelector(".upload-sub");
  if (uploadSub) uploadSub.textContent = ".kml · .kmz · Google Earth / Maps";
});
