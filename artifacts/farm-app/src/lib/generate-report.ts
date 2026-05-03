import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Batch = {
  id: string;
  name: string;
  activeBirds: number;
  breed: string;
  ageWeeks: number;
};

type EggRecord = {
  date: string;
  totalCollected: number;
  goodEggs: number;
  damagedEggs: number;
  traysPacked: number;
};

type Transaction = {
  type: "income" | "expense";
  category: string;
  amount: number;
  date: string;
  notes: string;
};

type MortalityEntry = {
  batchName: string;
  deadBirds: number;
};

type ReportData = {
  reportDate: string;
  batches: Batch[];
  todaysEggRecord: EggRecord | null;
  todayExpenses: Transaction[];
  todayIncome: Transaction[];
  mortalityEntries: MortalityEntry[];
  feedStock: number;
};

const FARM_NAME = "ABDULLAH PROTIEN FARM";
const DARK_GREEN = [26, 71, 49] as [number, number, number];
const AMBER = [214, 108, 14] as [number, number, number];
const LIGHT_GREEN = [236, 246, 241] as [number, number, number];

function formatPKR(amount: number) {
  return `PKR ${amount.toLocaleString()}`;
}

export function generateDailyReport(data: ReportData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  let y = 0;

  // Header band
  doc.setFillColor(...DARK_GREEN);
  doc.rect(0, 0, pageW, 38, "F");

  // Farm name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text(FARM_NAME, pageW / 2, 15, { align: "center" });

  // Subtitle
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 230, 215);
  doc.text("Daily Operations Report", pageW / 2, 22, { align: "center" });

  // Date
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`Report Date: ${data.reportDate}`, pageW / 2, 30, { align: "center" });

  y = 48;

  // ── Section helper ──
  function sectionTitle(title: string) {
    doc.setFillColor(...LIGHT_GREEN);
    doc.rect(14, y - 4, pageW - 28, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...DARK_GREEN);
    doc.text(title, 16, y + 1);
    y += 8;
  }

  // ── Summary chips ──
  const totalBirds = data.batches.reduce((s, b) => s + b.activeBirds, 0);
  const chips = [
    { label: "Active Birds", value: totalBirds.toLocaleString() },
    { label: "Eggs Collected", value: data.todaysEggRecord ? data.todaysEggRecord.totalCollected.toLocaleString() : "—" },
    { label: "Trays Packed", value: data.todaysEggRecord ? String(data.todaysEggRecord.traysPacked) : "—" },
    { label: "Feed Stock", value: `${data.feedStock} bags` },
  ];

  const chipW = (pageW - 28) / chips.length;
  chips.forEach((chip, i) => {
    const x = 14 + i * chipW;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...DARK_GREEN);
    doc.roundedRect(x + 1, y - 2, chipW - 2, 16, 2, 2, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 120, 110);
    doc.text(chip.label, x + chipW / 2, y + 4, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...DARK_GREEN);
    doc.text(chip.value, x + chipW / 2, y + 11, { align: "center" });
  });
  y += 24;

  // ── Egg Production ──
  sectionTitle("Egg Production");
  if (data.todaysEggRecord) {
    const rec = data.todaysEggRecord;
    autoTable(doc, {
      startY: y,
      head: [["Metric", "Value"]],
      body: [
        ["Total Eggs Collected", rec.totalCollected.toLocaleString()],
        ["Good Eggs", rec.goodEggs.toLocaleString()],
        ["Damaged / Broken Eggs", rec.damagedEggs.toLocaleString()],
        ["Egg Trays Packed (÷30)", String(rec.traysPacked)],
        ["Loose Eggs (remainder)", String(rec.goodEggs % 30)],
      ],
      theme: "plain",
      headStyles: { fillColor: DARK_GREEN, textColor: [255, 255, 255], fontSize: 9, fontStyle: "bold" },
      bodyStyles: { fontSize: 9, textColor: [40, 60, 50] },
      alternateRowStyles: { fillColor: LIGHT_GREEN },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 90 }, 1: { halign: "right" } },
      margin: { left: 14, right: 14 },
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(130, 150, 140);
    doc.text("No egg production record for today.", 16, y + 4);
    y += 12;
  }

  // ── Flock Summary ──
  sectionTitle("Flock Summary");
  autoTable(doc, {
    startY: y,
    head: [["Batch", "Breed", "Age (wks)", "Active Birds"]],
    body: data.batches.map((b) => [b.name, b.breed, String(b.ageWeeks), b.activeBirds.toLocaleString()]),
    theme: "plain",
    headStyles: { fillColor: DARK_GREEN, textColor: [255, 255, 255], fontSize: 9, fontStyle: "bold" },
    bodyStyles: { fontSize: 9, textColor: [40, 60, 50] },
    alternateRowStyles: { fillColor: LIGHT_GREEN },
    columnStyles: { 3: { halign: "right", fontStyle: "bold" } },
    margin: { left: 14, right: 14 },
  });
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // ── Today's Expenses ──
  sectionTitle("Today's Expenses");
  if (data.todayExpenses.length > 0) {
    const totalExp = data.todayExpenses.reduce((s, t) => s + t.amount, 0);
    autoTable(doc, {
      startY: y,
      head: [["Category", "Notes", "Amount"]],
      body: [
        ...data.todayExpenses.map((t) => [t.category, t.notes || "—", formatPKR(t.amount)]),
        ["", { content: "TOTAL", styles: { fontStyle: "bold", halign: "right" } }, { content: formatPKR(totalExp), styles: { fontStyle: "bold", textColor: DARK_GREEN } }],
      ],
      theme: "plain",
      headStyles: { fillColor: DARK_GREEN, textColor: [255, 255, 255], fontSize: 9, fontStyle: "bold" },
      bodyStyles: { fontSize: 9, textColor: [40, 60, 50] },
      alternateRowStyles: { fillColor: LIGHT_GREEN },
      columnStyles: { 2: { halign: "right" } },
      margin: { left: 14, right: 14 },
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(130, 150, 140);
    doc.text("No expenses recorded for today.", 16, y + 4);
    y += 12;
  }

  // ── Today's Income ──
  sectionTitle("Today's Income");
  if (data.todayIncome.length > 0) {
    const totalInc = data.todayIncome.reduce((s, t) => s + t.amount, 0);
    autoTable(doc, {
      startY: y,
      head: [["Source", "Notes", "Amount"]],
      body: [
        ...data.todayIncome.map((t) => [t.category, t.notes || "—", formatPKR(t.amount)]),
        ["", { content: "TOTAL", styles: { fontStyle: "bold", halign: "right" } }, { content: formatPKR(totalInc), styles: { fontStyle: "bold", textColor: AMBER } }],
      ],
      theme: "plain",
      headStyles: { fillColor: AMBER, textColor: [255, 255, 255], fontSize: 9, fontStyle: "bold" },
      bodyStyles: { fontSize: 9, textColor: [40, 60, 50] },
      alternateRowStyles: { fillColor: [255, 248, 235] as [number, number, number] },
      columnStyles: { 2: { halign: "right" } },
      margin: { left: 14, right: 14 },
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(130, 150, 140);
    doc.text("No income recorded for today.", 16, y + 4);
    y += 12;
  }

  // ── Footer ──
  const footerY = doc.internal.pageSize.getHeight() - 12;
  doc.setFillColor(...DARK_GREEN);
  doc.rect(0, footerY - 4, pageW, 20, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(200, 230, 215);
  doc.text(
    `Generated on ${new Date().toLocaleString()} — ${FARM_NAME}`,
    pageW / 2,
    footerY + 4,
    { align: "center" }
  );

  const fileName = `Daily_Report_${data.reportDate}.pdf`;
  doc.save(fileName);
}
