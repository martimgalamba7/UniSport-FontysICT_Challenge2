/**
 * =========================================================================
 * UniSport Survey — Google Apps Script Backend (Google Sheets as Database)
 * Academic Project: Fontys ICT Block 2 (Challenge 2)
 * =========================================================================
 * 
 * INSTRUÇÕES DE INSTALAÇÃO (1 MINUTO):
 * 1. Cria uma nova folha de cálculo no Google Sheets (ex: "UniSport_Survey_DB").
 * 2. Clica no menu superior em: Extensões > Apps Script.
 * 3. Apaga qualquer código existente no editor e cola TODO este ficheiro.
 * 4. Clica em "Implementar" (Deploy) > "Nova implementação" (New deployment).
 * 5. Clica no ícone de engrenagem ⚙️ ao lado de "Selecionar tipo" e escolhe: "Aplicação Web" (Web app).
 * 6. Configura:
 *    - Descrição: UniSport Survey Webhook
 *    - Executar como: Eu (o teu email Google)
 *    - Quem tem acesso: Qualquer pessoa (Anyone)  <--- IMPORTANTE!
 * 7. Clica em "Implementar" (Deploy), autoriza as permissões da tua conta Google.
 * 8. Copia o "URL da aplicação Web" (ex: https://script.google.com/macros/s/.../exec)
 * 9. Cola esse URL na constante GOOGLE_SHEET_WEBAPP_URL no ficheiro index.html ou no modal de configuração!
 * =========================================================================
 */

// Headers da base de dados no Google Sheets
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

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000); // Evita condições de corrida se vários utilizadores submeterem ao mesmo tempo

  try {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = doc.getSheetByName("Responses") || doc.getActiveSheet();
    
    // Se a folha estiver vazia, cria os cabeçalhos formatados
    if (sheet.getLastRow() === 0) {
      sheet.setName("Responses");
      sheet.appendRow(SHEET_HEADERS);
      
      // Estilização do cabeçalho com cores UniSport (Indigo & White)
      const headerRange = sheet.getRange(1, 1, 1, SHEET_HEADERS.length);
      headerRange.setBackground("#4F46E5"); // Indigo
      headerRange.setFontColor("#FFFFFF");
      headerRange.setFontWeight("bold");
      headerRange.setFontFamily("Inter");
      headerRange.setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }

    // Processa os dados recebidos (JSON ou Form Data)
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

    // Prepara a linha a inserir na BD Google Sheets
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

    // Ajusta a largura das colunas automaticamente para boa legibilidade
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

// Endpoint de teste GET para verificar se a API está online
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    service: "UniSport Google Sheets Database Webhook",
    project: "Fontys ICT Block 2 Challenge"
  })).setMimeType(ContentService.MimeType.JSON);
}
