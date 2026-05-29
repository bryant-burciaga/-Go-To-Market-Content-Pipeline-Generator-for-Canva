// ==========================================
// CONFIGURATION
// Gemini API key is loaded from Script Properties via config.gs
// ==========================================
const config = getConfig();
const GEMINI_API_KEY = config.geminiApiKeyCanvaPov;

function GenerateCanvaPOVVideoEngineBulk() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();

  if (!GEMINI_API_KEY) {
    sheet.getRange("F2").setValue("⚠️ Missing GEMINI_API_KEY_CANVA_POV in Script Properties.");
    return;
  }

  // Clear columns D, E, F (rows 2-8) for the 7 video rows
  sheet.getRange("D2:F8").clearContent();
  sheet.getRange("F2").setValue("🔄 Engineering 7 Canva-mapped POV video layouts...");
  SpreadsheetApp.flush();

  var prompt = "You are an elite short-form video copywriter specializing in B2B growth and elite corporate cultures. Generate exactly 7 highly relatable, data-backed POV video concepts optimized for high-earning professionals (Management Consultants, Investment Bankers, Tech PMs).\\n\\n" +
               "CRITICAL DESIGN & CANVA BULK-CREATE CONSTRAINTS:\\n" +
               "- Canva_Line_1 MUST strictly follow this exact structural phrasing template: \\"POV: You’re a [Position]\\" or \\"POV: You’re an [Position]\\". Do not deviate from this prefix phrasing.\\n" +
               "- Canva_Line_1 must be a short, hard-hitting emotional hook (max 8 words total).\\n" +
               "- Canva_Line_2 must be a supporting conversational punchline or data pivot (max 12 words).\\n" +
               "- Do NOT include any newlines or bullets in Line 1 or Line 2.\\n" +
               "- IMPORTANT: NEVER use a standard straight apostrophe ( ' ) in canva_line_1 or canva_line_2. You MUST use the curly/smart apostrophe ( ’ ) for words like \\"You’re\\", \\"don’t\\", or \\"it’s\\". Canva bulk-create deletes text around straight apostrophes.\\n\\n" +
               "Requirements for each entry:\\n" +
               "1. Canva_Line_1 (Column D): On-screen text box 1. Must use the rigid template (e.g., 'POV: You’re an MBB Engagement Manager' or 'POV: You’re a Tech Product Manager').\\n" +
               "2. Canva_Line_2 (Column E): On-screen text box 2. The realization or friction point (e.g., 'Realizing your billable hours scale linearly with burnout').\\n" +
               "3. Social_Caption (Column F): The value-add text block for the actual post description. It must immediately connect to the on-screen hook, provide 1-2 sentences explaining how an unbundled B2B asset scales past this limitation, cite a reputable enterprise source (e.g., McKinsey, Gartner, Harvard Business Review, Wall Street Journal), include your promotional line separated by a clean space, and finish with exactly 5-7 hashtags.\\n\\n" +
               "RESPONSE FORMAT:\\n" +
               "Return ONLY a valid JSON array of 7 objects. No markdown code blocks. Use this exact schema:\\n" +
               "[\\n" +
               "  {\\n" +
               "    \\"canva_line_1\\": \\"POV: You’re a Big Tech PM\\",\\n" +
               "    \\"canva_line_2\\": \\"Watching your entire net worth ride on a single corporate ticker.\\",\\n" +
               "    \\"social_caption\\": \\"Relying entirely on a single corporate employer and their stock vesting schedules exposes your net worth to extreme structural tail risk. Elite tech operators mitigate this by treating their personal skill sets like an unbundled venture fund, deploying specialized product-management playbooks into independent B2B consultancy frameworks that generate cash flow outside their corporate ecosystem.\\\\nSource: Gartner Technology Sector Structural Compensation Analysis\\\\n\\\\nDe-risk your corporate career timeline. Explore 1,400+ verified models at sidehustledbl.com\\\\n\\\\n#TechPM #ProductManagement #AssetBuilding #Diversification #CorporateStrategy #SideHustleDBL\\"\\n" +
               "  }\\n" +
               "]";

  var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + GEMINI_API_KEY.toString().trim();
  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    }),
    muteHttpExceptions: true
  };

  try {
    var response = UrlFetchApp.fetch(url, options);
    var responseText = response.getContentText();
    var json = JSON.parse(responseText);
    sheet.getRange("F2").setValue("");

    if (json.candidates && json.candidates[0].content && json.candidates[0].content.parts[0].text) {
      var rawJsonText = json.candidates[0].content.parts[0].text.trim();
      var data = JSON.parse(rawJsonText);

      var finalSpreadsheetOutputs = [];
      var timestamp = new Date().toLocaleString();

      for (var k = 0; k < 7; k++) {
        var row = 2 + k;

        if (data[k]) {
          var line1 = data[k].canva_line_1 || "";
          var line2 = data[k].canva_line_2 || "";
          var caption = data[k].social_caption || "";

          sheet.getRange("D" + row).setValue(line1);
          sheet.getRange("E" + row).setValue(line2);
          sheet.getRange("F" + row).setValue(caption);

          finalSpreadsheetOutputs.push([timestamp, line1, line2, caption]);
        } else {
          sheet.getRange("D" + row).setValue("");
          sheet.getRange("E" + row).setValue("");
          sheet.getRange("F" + row).setValue("Error: AI missed generating a response item for this specific row.");
          finalSpreadsheetOutputs.push([timestamp, "", "", "Error: AI missed generating a response item for this specific row."]);
        }
      }

      // Send data to the rolling 5-iteration background history log
      archivePOVOutputsToLog(finalSpreadsheetOutputs);
    } else {
      var apiError = json.error ? json.error.message : "Unknown API configuration issue.";
      sheet.getRange("F2").setValue("Error: " + apiError);
    }
  } catch (e) {
    sheet.getRange("F2").setValue("Execution Error: " + e.toString());
  }
}

function archivePOVOutputsToLog(newRowsData) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var logSheet = ss.getSheetByName("POV_History_Log");

  // Create history log sheet if it does not exist yet
  if (!logSheet) {
    logSheet = ss.insertSheet("POV_History_Log");
    logSheet.appendRow(["Timestamp Archive", "Canva Line 1 (Hook)", "Canva Line 2 (Punchline)", "Generated Social Caption & Tags"]);
    logSheet.getRange("A1:D1").setFontWeight("bold").setBackground("#d9e1f2");
  }

  // Insert exactly 7 new rows at the top position right under headers
  logSheet.insertRowsAfter(1, 7);
  logSheet.getRange(2, 1, 7, 4).setValues(newRowsData);

  // STRICT ROLLING HARD CAP: 1 Header row + (5 historical runs * 7 items per run) = 36 total rows max.
  var maxAllowedRows = 36;
  var totalRowsNow = logSheet.getLastRow();
  if (totalRowsNow > maxAllowedRows) {
    var rowsToDelete = totalRowsNow - maxAllowedRows;
    logSheet.deleteRows(maxAllowedRows + 1, rowsToDelete);
  }
}