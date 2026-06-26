import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_CONFIG_PATH = "../config/google-sheets-backup.json";
const moduleRoot = fileURLToPath(new URL(".", import.meta.url));

const summaryHeaders = [
  "product",
  "brand",
  "channel_id",
  "page_url",
  "scan_status",
  "visible_articles",
  "recent_posts",
  "reactions",
  "comments",
  "shares",
  "missing_engagement_fields",
  "note",
];

const postHeaders = [
  "channel_id",
  "product",
  "brand",
  "post_date",
  "time_label",
  "post_type",
  "caption",
  "reactions",
  "comments",
  "shares",
  "post_url",
  "source_page_url",
  "scrape_status",
  "metric_confidence",
  "metric_note",
  "raw_text",
];

const chartHeaders = [
  "brand",
  "product",
  "reactions",
  "comments",
  "shares",
  "recent_posts",
  "visible_articles",
];

function asCell(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  return value;
}

function rowsFromObjects(headers, rows = []) {
  return [
    headers,
    ...rows.map((row) => headers.map((header) => asCell(row[header]))),
  ];
}

function buildMetaRows({ config, data, sourcePath, syncedAt }) {
  const totals = (data.summaries || []).reduce(
    (acc, row) => {
      acc.reactions += Number(row.reactions || 0);
      acc.comments += Number(row.comments || 0);
      acc.shares += Number(row.shares || 0);
      return acc;
    },
    { reactions: 0, comments: 0, shares: 0 },
  );

  return [
    ["field", "value"],
    ["role", config.role],
    ["backup_spreadsheet_title", config.title],
    ["backup_spreadsheet_id", config.spreadsheetId],
    ["backup_spreadsheet_url", config.spreadsheetUrl],
    ["source_spreadsheet_id", config.sourceSpreadsheetId],
    ["source_tab", config.sourceTab],
    ["local_source_path", sourcePath],
    ["data_scanned_at", data.scannedAt || ""],
    ["last_payload_built_at", syncedAt],
    ["total_posts", data.totalPosts || (data.rows || []).length],
    ["total_channels", (data.summaries || []).length],
    ["total_reactions", totals.reactions],
    ["total_comments", totals.comments],
    ["total_shares", totals.shares],
    ["github_pages_url", config.dashboard?.githubPagesUrl || ""],
    ["repository_url", config.dashboard?.repositoryUrl || ""],
  ];
}

function buildChartRows(summaries = []) {
  return [
    chartHeaders,
    ...summaries.map((row) => [
      asCell(row.brand),
      asCell(row.product),
      Number(row.reactions || 0),
      Number(row.comments || 0),
      Number(row.shares || 0),
      Number(row.recent_posts || 0),
      Number(row.visible_articles || 0),
    ]),
  ];
}

function buildMethodRows() {
  return [
    ["section", "note"],
    ["database_role", "This existing Google Sheet is the backup database for competitor page scan outputs."],
    ["write_rule", "Update existing rows by stable keys when a full Sheets worker is available; do not delete history unless explicitly requested."],
    ["frontend_rule", "The dashboard frontend must call the local API or static JSON fallback, never Google Sheets directly."],
    ["metric_rule", "Use public_visible, partial_inferred, or blank metric confidence. Do not fabricate hidden Facebook metrics."],
    ["production_source", "For official metrics, use Meta Graph API, Meta Business Suite export, or another approved authenticated export."],
  ];
}

export async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

export async function loadBackupConfig(configPath = DEFAULT_CONFIG_PATH) {
  return readJson(resolve(moduleRoot, configPath));
}

export function buildGoogleSheetsBackupPayload({
  config,
  data,
  sourcePath,
  syncedAt = new Date().toISOString(),
}) {
  const summaries = data.summaries || [];
  const posts = data.rows || data.posts || [];
  const tabs = config.tabs || {};

  return {
    spreadsheetId: config.spreadsheetId,
    spreadsheetUrl: config.spreadsheetUrl,
    title: config.title,
    mode: "replace_database_tabs",
    syncedAt,
    sourcePath,
    tabs: [
      {
        name: tabs.meta || "Backup Meta",
        rows: buildMetaRows({ config, data, sourcePath, syncedAt }),
      },
      {
        name: tabs.summary || "Channel Summary",
        rows: rowsFromObjects(summaryHeaders, summaries),
      },
      {
        name: tabs.posts || "Posts",
        rows: rowsFromObjects(postHeaders, posts),
      },
      {
        name: tabs.chartData || "Chart Data",
        rows: buildChartRows(summaries),
      },
      {
        name: tabs.methodNotes || "Method Notes",
        rows: buildMethodRows(),
      },
    ],
    charts: [
      {
        sheetName: tabs.chartData || "Chart Data",
        dashboardSheetName: "Dashboard",
        type: "column",
        title: "Engagement by Brand",
        sourceRange: "A1:E",
      },
      {
        sheetName: tabs.chartData || "Chart Data",
        dashboardSheetName: "Dashboard",
        type: "bar",
        title: "Recent Posts by Brand",
        sourceRange: "A1:F",
      },
    ],
  };
}

export async function postBackupPayload({ webhookUrl, payload }) {
  if (!webhookUrl) {
    throw new Error("GOOGLE_SHEETS_BACKUP_WEBHOOK_URL is not set.");
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Google Sheets backup webhook failed: ${response.status} ${text}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    return { ok: true, text };
  }
}

export async function writePayloadFile(path, payload) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}
