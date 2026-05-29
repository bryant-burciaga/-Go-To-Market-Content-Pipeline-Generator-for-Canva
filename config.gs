function getConfig() {
  var props = PropertiesService.getScriptProperties();

  return {
    geminiApiKeyCanvaPov: props.getProperty("GEMINI_API_KEY_CANVA_POV"),
    geminiApiKeyDailyIdea: props.getProperty("GEMINI_API_KEY_DAILY_IDEA"),
    geminiApiKeyFactoidSeries: props.getProperty("GEMINI_API_KEY_FACTOID_SERIES"),
    geminiApiKeyHustles: props.getProperty("GEMINI_API_KEY_HUSTLES"),
    sourceSheetId: props.getProperty("SOURCE_SHEET_ID"),
    inputSheetName: props.getProperty("INPUT_SHEET_NAME") || "Ideas",
    outputSheetName: props.getProperty("OUTPUT_SHEET_NAME") || "Generated Content"
  };
}

function validateConfig() {
  var config = getConfig();
  var missing = [];

  if (!config.geminiApiKeyCanvaPov) missing.push("GEMINI_API_KEY_CANVA_POV");
  if (!config.geminiApiKeyDailyIdea) missing.push("GEMINI_API_KEY_DAILY_IDEA");
  if (!config.geminiApiKeyFactoidSeries) missing.push("GEMINI_API_KEY_FACTOID_SERIES");
  if (!config.geminiApiKeyHustles) missing.push("GEMINI_API_KEY_HUSTLES");
  if (!config.sourceSheetId) missing.push("SOURCE_SHEET_ID");

  if (missing.length) {
    throw new Error("Missing script properties: " + missing.join(", "));
  }

  return config;
}