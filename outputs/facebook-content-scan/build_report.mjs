import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = path.resolve("outputs/facebook-content-scan");
const chunkFiles = [
  path.join(outputDir, "facebook_chunk_0_5.json"),
  path.join(outputDir, "facebook_chunk_5_5.json"),
];

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function inferMetrics(row) {
  const raw = row.raw_text || "";
  let reactions = toNumber(row.reactions);
  let comments = toNumber(row.comments);
  let shares = toNumber(row.shares);
  let confidence = "public_visible";
  let note = "";

  const unlabeled = raw.match(/ความรู้สึกทั้งหมด\s+([0-9,.]+)(?:\s+([0-9,.]+))?(?:\s+([0-9,.]+))?\s+ถูกใจ/);
  if (unlabeled) {
    reactions ??= toNumber(unlabeled[1]);
    if (comments === null && unlabeled[2]) comments = toNumber(unlabeled[2]);
    if (shares === null && unlabeled[3]) shares = toNumber(unlabeled[3]);
    if (unlabeled[2] || unlabeled[3]) {
      confidence = "partial_inferred";
      note = "Comments/shares inferred from unlabeled public Facebook text.";
    }
  }

  const likeOnly = raw.match(/\s([0-9,.]+)\s+ถูกใจ\s+แสดงความคิดเห็น/);
  if (reactions === null && likeOnly) {
    reactions = toNumber(likeOnly[1]);
  }

  if (comments === null || shares === null) {
    note = note || "Some engagement fields were not visible publicly.";
  }

  return { ...row, reactions, comments, shares, metric_confidence: confidence, metric_note: note };
}

function cleanRows(rows) {
  const byUrl = new Map();
  for (const sourceRow of rows) {
    const row = inferMetrics(sourceRow);
    if (!row.post_url) continue;
    const key = `${row.channel_id}|${row.post_url}`;
    const existing = byUrl.get(key);
    if (!existing) {
      byUrl.set(key, row);
      continue;
    }
    const existingScore = (existing.caption ? 1 : 0) + (existing.raw_text ? 1 : 0);
    const rowScore = (row.caption ? 1 : 0) + (row.raw_text ? 1 : 0);
    if (rowScore > existingScore) byUrl.set(key, row);
  }
  return [...byUrl.values()].sort((a, b) => {
    const date = String(b.post_date).localeCompare(String(a.post_date));
    if (date !== 0) return date;
    return String(a.brand).localeCompare(String(b.brand));
  });
}

function groupByBrand(rows, statuses) {
  const brands = new Map();
  for (const status of statuses) {
    const key = `${status.product}|${status.brand}`;
    brands.set(key, {
      product: status.product,
      brand: status.brand,
      channel_id: status.channel_id,
      page_url: status.url,
      scan_status: status.status,
      visible_articles: status.visible_articles ?? 0,
      recent_posts: 0,
      reactions: 0,
      comments: 0,
      shares: 0,
      missing_engagement_fields: 0,
      note: status.note || "",
    });
  }
  for (const row of rows) {
    const key = `${row.product}|${row.brand}`;
    if (!brands.has(key)) {
      brands.set(key, {
        product: row.product,
        brand: row.brand,
        channel_id: row.channel_id,
        page_url: row.source_page_url,
        scan_status: "ok",
        visible_articles: 0,
        recent_posts: 0,
        reactions: 0,
        comments: 0,
        shares: 0,
        missing_engagement_fields: 0,
        note: "",
      });
    }
    const summary = brands.get(key);
    summary.recent_posts += 1;
    summary.reactions += row.reactions ?? 0;
    summary.comments += row.comments ?? 0;
    summary.shares += row.shares ?? 0;
    if (row.comments === null || row.shares === null) summary.missing_engagement_fields += 1;
  }
  return [...brands.values()].sort((a, b) => b.recent_posts - a.recent_posts || b.reactions - a.reactions);
}

function deriveContentTheme(caption) {
  const text = caption || "";
  if (/โปร|ลด|ซื้อคู่|ราค|คุ้ม/.test(text)) return "Promotion";
  if (/กิจกรรม|รางวัล|แคปภาพ|เต้น|แจก/.test(text)) return "Campaign / UGC";
  if (/สูตร|เมนู|วิธี|เลือกซื้อ|เก็บรักษา/.test(text)) return "How-to / Recipe";
  if (/แสดงความยินดี|ผู้โชคดี|ประกาศ/.test(text)) return "Winner announcement";
  if (/ชาเขียว|วิปปิ้ง|กะทิ|สมุนไพร/.test(text)) return "Product education";
  return "Brand update";
}

function safe(value) {
  return value === null || value === undefined ? "" : value;
}

const chunks = await Promise.all(chunkFiles.map(async (file) => JSON.parse(await fs.readFile(file, "utf8"))));
const rows = cleanRows(chunks.flatMap((chunk) => chunk.rows || []));
const statuses = chunks.flatMap((chunk) => chunk.statuses || []);
const summaries = groupByBrand(rows, statuses);
const scannedAt = chunks.map((chunk) => chunk.scanned_at).filter(Boolean).sort().at(-1) || new Date().toISOString();
const sourceSheetUrl = "https://docs.google.com/spreadsheets/d/1OVD3rwNVyT02ZfaUiNxtPh8V3KA9mvXkAQ6dyAhb4Zo/edit?gid=1497181589#gid=1497181589";

const workbook = Workbook.create();
const dashboard = workbook.worksheets.add("Dashboard");
const summarySheet = workbook.worksheets.add("Channel Summary");
const postsSheet = workbook.worksheets.add("Posts");
const notesSheet = workbook.worksheets.add("Method Notes");

for (const sheet of [dashboard, summarySheet, postsSheet, notesSheet]) {
  sheet.showGridLines = false;
}

const totalPosts = rows.length;
const activeBrands = summaries.filter((s) => s.recent_posts > 0).length;
const totalReactions = rows.reduce((sum, row) => sum + (row.reactions ?? 0), 0);
const totalComments = rows.reduce((sum, row) => sum + (row.comments ?? 0), 0);
const totalShares = rows.reduce((sum, row) => sum + (row.shares ?? 0), 0);
const topPost = [...rows].sort((a, b) => (b.reactions ?? 0) - (a.reactions ?? 0))[0];
const topBrand = summaries[0];

dashboard.getRange("A1:H1").merge();
dashboard.getRange("A1").values = [["Facebook Competitor Content Scan"]];
dashboard.getRange("A2:H2").merge();
dashboard.getRange("A2").values = [[`Window: Facebook labels <= 3 days / exact Thai dates since 2026-06-22 (Asia/Bangkok). Scanned: ${scannedAt}`]];

dashboard.getRange("A4:B6").values = [
  ["Pages scanned", summaries.length],
  ["Recent posts found", totalPosts],
  ["Active brands", activeBrands],
];
dashboard.getRange("D4:E6").values = [
  ["Visible reactions", totalReactions],
  ["Comments captured/inferred", totalComments],
  ["Shares captured/inferred", totalShares],
];
dashboard.getRange("G4:H6").values = [
  ["Top active brand", topBrand ? `${topBrand.brand} (${topBrand.recent_posts})` : ""],
  ["Top reaction post", topPost ? `${topPost.brand}: ${topPost.reactions ?? 0}` : ""],
  ["Data quality", "Public-visible, partial"],
];

dashboard.getRange("A8:H8").values = [["What to notice", "Brand", "Why it matters", "Action idea", "", "", "", ""]];
const bestByTheme = rows.map((row) => ({ ...row, theme: deriveContentTheme(row.caption) }));
const observations = [
  [
    "Most frequent poster",
    topBrand?.brand || "",
    `${topBrand?.recent_posts ?? 0} posts in window.`,
    "Benchmark cadence and offer hooks.",
    "", "", "", "",
  ],
  [
    "Highest visible reaction post",
    topPost?.brand || "",
    topPost ? `${topPost.reactions ?? 0} reactions.` : "",
    "Rewrite caption into 3 hook variants.",
    "", "", "", "",
  ],
  [
    "Dominant content angle",
    "Cross-brand",
    bestByTheme.length ? `${deriveContentTheme(bestByTheme[0].caption)} appears often.` : "",
    "Tag each post by theme next run.",
    "", "", "", "",
  ],
  [
    "Measurement caveat",
    "Facebook public view",
    "Some fields not labeled publicly.",
    "Use Meta API/export for exact counts.",
    "", "", "", "",
  ],
];
dashboard.getRange("A9:H12").values = observations;

dashboard.getRange("A15:H15").values = [["Top Recent Posts", "Date", "Brand", "Theme", "Reactions", "Comments", "Shares", "Caption"]];
const topRows = [...rows].sort((a, b) => (b.reactions ?? 0) - (a.reactions ?? 0)).slice(0, 8);
dashboard.getRangeByIndexes(15, 0, Math.max(topRows.length, 1), 8).values =
  topRows.length
    ? topRows.map((row, index) => [
        index + 1,
        row.post_date,
        row.brand,
        deriveContentTheme(row.caption),
        safe(row.reactions),
        safe(row.comments),
        safe(row.shares),
        row.caption,
      ])
    : [["", "", "", "", "", "", "", ""]];

const summaryHeaders = [
  "Product",
  "Brand",
  "Channel ID",
  "Recent Posts",
  "Visible Reactions",
  "Comments Captured/Inferred",
  "Shares Captured/Inferred",
  "Visible Articles Checked",
  "Missing Engagement Fields",
  "Scan Status",
  "Note",
  "Page URL",
];
summarySheet.getRangeByIndexes(0, 0, 1, summaryHeaders.length).values = [summaryHeaders];
summarySheet.getRangeByIndexes(1, 0, summaries.length, summaryHeaders.length).values = summaries.map((s) => [
  s.product,
  s.brand,
  s.channel_id,
  s.recent_posts,
  s.reactions,
  s.comments,
  s.shares,
  s.visible_articles,
  s.missing_engagement_fields,
  s.scan_status,
  s.note,
  s.page_url,
]);

const postHeaders = [
  "Post Date",
  "Time Label",
  "Product",
  "Brand",
  "Channel ID",
  "Post Type",
  "Content Theme",
  "Caption / Post Summary",
  "Reactions",
  "Comments",
  "Shares",
  "Metric Confidence",
  "Metric Note",
  "Post URL",
  "Page URL",
  "Raw Public Text",
];
postsSheet.getRangeByIndexes(0, 0, 1, postHeaders.length).values = [postHeaders];
postsSheet.getRangeByIndexes(1, 0, rows.length, postHeaders.length).values = rows.map((row) => [
  row.post_date,
  row.time_label,
  row.product,
  row.brand,
  row.channel_id,
  row.post_type,
  deriveContentTheme(row.caption),
  row.caption,
  safe(row.reactions),
  safe(row.comments),
  safe(row.shares),
  row.metric_confidence,
  row.metric_note,
  row.post_url,
  row.source_page_url,
  row.raw_text,
]);

notesSheet.getRange("A1:D1").values = [["Item", "Detail", "Why it matters", "Source"]];
notesSheet.getRange("A2:D9").values = [
  ["Source channel list", "Read tab 11A_Channel_Link_Library from Analyst Com.", "Grounds the scan in the user's channel library.", sourceSheetUrl],
  ["Platforms included", "Facebook rows only: CH-001 to CH-010.", "Matches the user's requested Facebook filter.", sourceSheetUrl],
  ["Data window", "Facebook relative labels <= 3 days plus exact Thai dates since 2026-06-22.", "Covers current/recent posts where Facebook switches label style.", ""],
  ["Chrome check", "Chrome profile was tested. Facebook desktop exposed profile state, but post metadata was obfuscated/skeletonized in accessibility/DOM.", "Prevents false confidence from Chrome-only extraction.", ""],
  ["Extraction source", "Public-visible Facebook page DOM from browser extraction.", "No private credentials, passwords, cookies, or storage were inspected.", ""],
  ["Engagement fields", "Reactions are captured when visible. Comments/shares are captured only when visible or inferred from unlabeled public text.", "Exact counts require Meta Graph/API or authenticated export.", ""],
  ["UI reference", "Dashboard uses the Content OS demo idea: KPI cards, competitor summary, top hooks/actions.", "Makes analysis readable without overloading raw data.", "https://tinataylor-stack.github.io/products/content_dashboard_demo.html"],
  ["Next automation step", "Build a backend/API worker that reads channel URLs from Sheets, fetches approved data source, and writes rows to an output sheet.", "Keeps frontend away from Sheets and credentials.", ""],
];

function styleHeader(range, fill = "#E5E7EB", color = "#111827") {
  range.format = {
    fill,
    font: { bold: true, color },
    wrapText: true,
    borders: { preset: "bottom", style: "thin", color: "#CBD5E1" },
  };
}

dashboard.getRange("A1:H1").format = { fill: "#111827", font: { bold: true, color: "#FFFFFF", size: 16 } };
dashboard.getRange("A2:H2").format = { fill: "#F8FAFC", font: { color: "#475569" }, wrapText: true };
dashboard.getRange("A4:B6").format = { fill: "#ECFEFF", borders: { preset: "outside", style: "thin", color: "#67E8F9" } };
dashboard.getRange("D4:E6").format = { fill: "#F0FDF4", borders: { preset: "outside", style: "thin", color: "#86EFAC" } };
dashboard.getRange("G4:H6").format = { fill: "#FFFBEB", borders: { preset: "outside", style: "thin", color: "#FCD34D" } };
dashboard.getRange("B4:B6").format.font = { bold: true };
dashboard.getRange("E4:E6").format.font = { bold: true };
dashboard.getRange("H4:H6").format.font = { bold: true };
styleHeader(dashboard.getRange("A8:H8"), "#DBEAFE");
styleHeader(dashboard.getRange("A15:H15"), "#DBEAFE");
dashboard.getRange("A9:H12").format = { wrapText: true, borders: { preset: "insideHorizontal", style: "thin", color: "#E2E8F0" } };
dashboard.getRange("A16:H23").format = { wrapText: true, borders: { preset: "insideHorizontal", style: "thin", color: "#E2E8F0" } };

styleHeader(summarySheet.getRangeByIndexes(0, 0, 1, summaryHeaders.length), "#E5E7EB");
styleHeader(postsSheet.getRangeByIndexes(0, 0, 1, postHeaders.length), "#E5E7EB");
styleHeader(notesSheet.getRange("A1:D1"), "#E5E7EB");

summarySheet.freezePanes.freezeRows(1);
postsSheet.freezePanes.freezeRows(1);
notesSheet.freezePanes.freezeRows(1);

summarySheet.getRange("D:G").format.numberFormat = "#,##0";
postsSheet.getRange("I:K").format.numberFormat = "#,##0";
postsSheet.getRange("A:A").format.numberFormat = "yyyy-mm-dd";

for (const sheet of [dashboard, summarySheet, postsSheet, notesSheet]) {
  sheet.getUsedRange().format.autofitColumns();
  sheet.getUsedRange().format.autofitRows();
}

dashboard.getRange("A:H").format.columnWidth = 18;
dashboard.getRange("C:C").format.columnWidth = 28;
dashboard.getRange("D:D").format.columnWidth = 34;
dashboard.getRange("H:H").format.columnWidth = 45;
dashboard.getRange("A9:H12").format.rowHeight = 42;
dashboard.getRange("A16:H23").format.rowHeight = 46;
postsSheet.getRange("H:H").format.columnWidth = 55;
postsSheet.getRange("N:P").format.columnWidth = 42;
summarySheet.getRange("L:L").format.columnWidth = 44;
notesSheet.getRange("B:D").format.columnWidth = 45;

const inspect = await workbook.inspect({
  kind: "sheet,table",
  maxChars: 4000,
  tableMaxRows: 5,
  tableMaxCols: 8,
});
await fs.writeFile(path.join(outputDir, "workbook_inspect.ndjson"), inspect.ndjson, "utf8");

const preview = await workbook.render({ sheetName: "Dashboard", autoCrop: "all", scale: 1, format: "png" });
await fs.writeFile(path.join(outputDir, "dashboard_preview.png"), new Uint8Array(await preview.arrayBuffer()));

const xlsx = await SpreadsheetFile.exportXlsx(workbook);
const xlsxPath = path.join(outputDir, "facebook_competitor_content_scan.xlsx");
await xlsx.save(xlsxPath);

await fs.writeFile(
  path.join(outputDir, "cleaned_posts.json"),
  JSON.stringify({ scannedAt, totalPosts, summaries, rows }, null, 2),
  "utf8",
);

console.log(JSON.stringify({ xlsxPath, totalPosts, activeBrands, totalReactions, totalComments, totalShares }, null, 2));
