/**
 * Bound or standalone Apps Script endpoint for the existing backup spreadsheet:
 * Facebook Competitor Content Scan - 2026-06-25
 *
 * Deploy as a Web App, then set the deployment URL in:
 * GOOGLE_SHEETS_BACKUP_WEBHOOK_URL
 *
 * The endpoint accepts the payload produced by:
 * scripts/sync-google-sheets-backup.mjs
 */
function doPost(e) {
  var payload = JSON.parse(e.postData.contents);
  var spreadsheet = SpreadsheetApp.openById(payload.spreadsheetId);

  payload.tabs.forEach(function(tab) {
    writeTab_(spreadsheet, tab.name, tab.rows);
  });

  rebuildDashboardCharts_(spreadsheet, payload);

  return ContentService
    .createTextOutput(JSON.stringify({
      ok: true,
      spreadsheetId: payload.spreadsheetId,
      syncedAt: payload.syncedAt,
      tabs: payload.tabs.map(function(tab) {
        return { name: tab.name, rows: tab.rows.length };
      })
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function writeTab_(spreadsheet, name, rows) {
  var sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
  sheet.clear({ contentsOnly: false });

  if (!rows || !rows.length) {
    return;
  }

  var width = rows.reduce(function(max, row) {
    return Math.max(max, row.length);
  }, 1);

  var normalized = rows.map(function(row) {
    var copy = row.slice();
    while (copy.length < width) copy.push("");
    return copy;
  });

  sheet.getRange(1, 1, normalized.length, width).setValues(normalized);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, width).setFontWeight("bold").setBackground("#f1f3f4");
  sheet.autoResizeColumns(1, width);

  if (normalized.length > 1) {
    var filter = sheet.getFilter();
    if (filter) filter.remove();
    sheet.getRange(1, 1, normalized.length, width).createFilter();
  }
}

function rebuildDashboardCharts_(spreadsheet, payload) {
  var dashboard = spreadsheet.getSheetByName("Dashboard") || spreadsheet.insertSheet("Dashboard");
  var chartData = spreadsheet.getSheetByName("Chart Data");
  if (!chartData) return;

  dashboard.getCharts().forEach(function(chart) {
    dashboard.removeChart(chart);
  });
  dashboard.clear({ contentsOnly: false });

  dashboard.getRange("A1:B8").setValues([
    ["Content Dashboard Backup", ""],
    ["Backup sheet", payload.spreadsheetUrl || ""],
    ["Last synced", payload.syncedAt || ""],
    ["Mode", payload.mode || ""],
    ["Data source", payload.sourcePath || ""],
    ["Posts tab", "Posts"],
    ["Summary tab", "Channel Summary"],
    ["Chart data tab", "Chart Data"]
  ]);
  dashboard.getRange("A1:B1").setFontWeight("bold").setBackground("#f1f3f4");
  dashboard.autoResizeColumns(1, 8);

  var lastRow = chartData.getLastRow();
  if (lastRow < 2) return;

  var engagementChart = dashboard.newChart()
    .setChartType(Charts.ChartType.COLUMN)
    .addRange(chartData.getRange(1, 1, lastRow, 5))
    .setOption("title", "Engagement by Brand")
    .setOption("legend", { position: "bottom" })
    .setPosition(2, 5, 0, 0)
    .build();
  dashboard.insertChart(engagementChart);

  var postsChart = dashboard.newChart()
    .setChartType(Charts.ChartType.BAR)
    .addRange(chartData.getRange(1, 1, lastRow, 6))
    .setOption("title", "Recent Posts by Brand")
    .setOption("legend", { position: "none" })
    .setPosition(20, 5, 0, 0)
    .build();
  dashboard.insertChart(postsChart);
}
