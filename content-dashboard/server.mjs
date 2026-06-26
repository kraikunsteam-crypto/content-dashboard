import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildGoogleSheetsBackupPayload,
  loadBackupConfig,
  postBackupPayload,
} from "./googleSheetsBackup.mjs";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 5177);

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

async function readDashboardData() {
  const localSeed = join(root, "data", "sample-facebook-scan.json");
  const latestScan = join(root, "..", "outputs", "facebook-content-scan", "cleaned_posts.json");

  try {
    return await readFile(latestScan, "utf8");
  } catch {
    return await readFile(localSeed, "utf8");
  }
}

async function syncGoogleSheetsBackup() {
  const config = await loadBackupConfig();
  const data = JSON.parse(await readDashboardData());
  const payload = buildGoogleSheetsBackupPayload({
    config,
    data,
    sourcePath: config.localDataPath,
  });

  if (!process.env.GOOGLE_SHEETS_BACKUP_WEBHOOK_URL) {
    return {
      status: 503,
      body: {
        ok: false,
        message: "GOOGLE_SHEETS_BACKUP_WEBHOOK_URL is not set.",
        spreadsheetUrl: config.spreadsheetUrl,
        tabs: payload.tabs.map((tab) => ({ name: tab.name, rows: tab.rows.length })),
      },
    };
  }

  const result = await postBackupPayload({
    webhookUrl: process.env.GOOGLE_SHEETS_BACKUP_WEBHOOK_URL,
    payload,
  });

  return {
    status: 200,
    body: {
      ok: true,
      spreadsheetUrl: config.spreadsheetUrl,
      result,
    },
  };
}

async function serveStatic(pathname, res) {
  const requested = pathname === "/" ? "index.html" : pathname.slice(1);
  const safePath = normalize(join(root, requested));

  if (!safePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const body = await readFile(safePath);
    res.writeHead(200, {
      "content-type": mime[extname(safePath)] || "application/octet-stream",
      "cache-control": "no-store",
    });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (url.pathname === "/api/health") {
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: true, storage: "google-sheets-via-api-boundary" }));
    return;
  }

  if (url.pathname === "/api/dashboard") {
    const data = await readDashboardData();
    res.writeHead(200, {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    });
    res.end(data);
    return;
  }

  if (url.pathname === "/api/sync") {
    try {
      const syncResult = await syncGoogleSheetsBackup();
      res.writeHead(syncResult.status, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(syncResult.body));
    } catch (error) {
      res.writeHead(500, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ ok: false, message: error.message }));
    }
    return;
  }

  await serveStatic(url.pathname, res);
});

server.listen(port, () => {
  console.log(`Content dashboard running at http://localhost:${port}`);
});
