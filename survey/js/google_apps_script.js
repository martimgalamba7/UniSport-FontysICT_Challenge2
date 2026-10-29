/* ==========================================================================
   UniSport Survey — Google Apps Script Webhook Backend
   ========================================================================== */

const SHEET_HEADERS = [
  "Response ID",
  "Timestamp",
  "Student Status",
  "Sports Frequency",
  "Favorite Sports",
  "Skipped Due To Company",
  "Obstacles",
  "Rating Quick Creation (1-5)",
  "Rating Geo Feed (1-5)",
  "Extra Features Feedback"
];

/* --- POST Webhook Handler --- */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = doc.getSheetByName("Responses") || doc.getActiveSheet();

    if (sheet.getLastRow() === 0) {
      sheet.setName("Responses");
      sheet.appendRow(SHEET_HEADERS);

      const headerRange = sheet.getRange(1, 1, 1, SHEET_HEADERS.length);
      headerRange.setBackground("#4F46E5");
      headerRange.setFontColor("#FFFFFF");
      headerRange.setFontWeight("bold");
      headerRange.setFontFamily("Inter");
      headerRange.setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }

    let data;
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter;
      }
    } else {
      data = e.parameter;
    }

    const favoriteSportsFormatted = Array.isArray(data.favorite_sports)
      ? data.favorite_sports.join(", ")
      : (data.favorite_sports || "");

    const obstaclesFormatted = Array.isArray(data.obstacles)
      ? data.obstacles.join(", ")
      : (data.obstacles || "");

    const row = [
      data.response_id || ("UNISPORT-" + new Date().getTime()),
      data.timestamp || new Date().toISOString(),
      data.student_status || "",
      data.sports_frequency || "",
      favoriteSportsFormatted,
      data.skipped_lack_of_company || data.skipped_due_to_company || "",
      obstaclesFormatted,
      data.feature_quick_creation_rating || data.rating_quick_creation || "",
      data.feature_geo_feed_rating || data.rating_geo_feed || "",
      data.extra_features_feedback || ""
    ];

    sheet.appendRow(row);

    for (let i = 1; i <= SHEET_HEADERS.length; i++) {
      sheet.autoResizeColumn(i);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Survey response recorded in Google Sheets database successfully!",
      row: sheet.getLastRow(),
      response_id: data.response_id
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

/* --- GET Health Check Endpoint --- */
function doGet() {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    service: "UniSport Google Sheets Database Webhook",
    project: "Fontys ICT Block 2 Challenge"
  })).setMimeType(ContentService.MimeType.JSON);
}
