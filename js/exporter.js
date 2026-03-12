// ============================================================
// EXPORT EXCEL
// ============================================================
function exportExcel() {
  if (!calcResults) return;

  const wb = XLSX.utils.book_new();
  const threshold = document.getElementById("thresholdSlider").value;
  const project = document.getElementById("projectName").value || "Project";
  const isp = document.getElementById("ispName").value || "";
  const susQty = getSuspensionQty();
  const deQty = getDeadEndQty();

  // Sheet 1: Per Tiang
  const headers = [
    "No",
    "Longitude",
    "Latitude",
    "Tipe Tiang",
    "Keterangan",
    "Override",
    "Suspension Clamp (pcs)",
    "Dead End Clamp (pcs)",
  ];

  const rows = calcResults.map((r) => [
    r.no,
    r.lon.toFixed(6),
    r.lat.toFixed(6),
    r.poleType === "dead_end" ? "Dead End" : "Suspension",
    r.reason,
    r.isOverride ? "Manual" : "Auto",
    r.accDetail["Suspension Clamp"] || 0,
    r.accDetail["Dead End Clamp"] || 0,
  ]);

  const ws1 = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws1["!cols"] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 10 },
    { wch: 22 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, "Per Tiang");

  // Sheet 2: Rekap
  const deCount = calcResults.filter((r) => r.poleType === "dead_end").length;
  const susCount = calcResults.filter(
    (r) => r.poleType === "suspension",
  ).length;
  const susTotal = calcResults.reduce(
    (sum, r) => sum + (r.accDetail["Suspension Clamp"] || 0),
    0,
  );
  const deTotal = calcResults.reduce(
    (sum, r) => sum + (r.accDetail["Dead End Clamp"] || 0),
    0,
  );
  const grandTotal = susTotal + deTotal;

  const rekapData = [
    ["REKAP KEBUTUHAN AKSESORI"],
    [],
    ["Project", project],
    ["ISP / Client", isp],
    ["Threshold Sudut", `> ${threshold}°`],
    ["Total Tiang", calcResults.length],
    ["Tiang Dead End", deCount],
    ["Tiang Suspension", susCount],
    [],
    [
      "Aksesori",
      "Berlaku Untuk",
      "Qty/Tiang",
      "Jumlah Tiang",
      "Total Qty (pcs)",
    ],
    ["Suspension Clamp", "Suspension", susQty, susCount, susTotal],
    ["Dead End Clamp", "Dead End", deQty, deCount, deTotal],
    [],
    ["GRAND TOTAL", "", "", "", grandTotal],
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(rekapData);
  ws2["!cols"] = [
    { wch: 24 },
    { wch: 16 },
    { wch: 12 },
    { wch: 16 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, "Rekap");

  const filename = `${project.replace(/[^a-zA-Z0-9]/g, "-")}_aksesori_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}
