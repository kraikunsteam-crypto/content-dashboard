import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildGoogleSheetsBackupPayload,
  loadBackupConfig,
  postBackupPayload,
  readJson,
  writePayloadFile,
} from "../content-dashboard/googleSheetsBackup.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const config = await loadBackupConfig();
const sourcePath = resolve(root, config.localDataPath);
const data = await readJson(sourcePath);
const payload = buildGoogleSheetsBackupPayload({
  config,
  data,
  sourcePath: config.localDataPath,
});

const payloadPath = resolve(root, "outputs/google-sheets-backup/backup-payload.json");
await writePayloadFile(payloadPath, payload);

if (dryRun || !process.env.GOOGLE_SHEETS_BACKUP_WEBHOOK_URL) {
  console.log(JSON.stringify({
    ok: true,
    mode: dryRun ? "dry_run" : "payload_only",
    message: "Backup payload built. Set GOOGLE_SHEETS_BACKUP_WEBHOOK_URL to write to the existing Google Sheet.",
    spreadsheetUrl: config.spreadsheetUrl,
    payloadPath,
    tabs: payload.tabs.map((tab) => ({ name: tab.name, rows: tab.rows.length })),
  }, null, 2));
  process.exit(0);
}

const result = await postBackupPayload({
  webhookUrl: process.env.GOOGLE_SHEETS_BACKUP_WEBHOOK_URL,
  payload,
});

console.log(JSON.stringify({
  ok: true,
  spreadsheetUrl: config.spreadsheetUrl,
  result,
}, null, 2));
