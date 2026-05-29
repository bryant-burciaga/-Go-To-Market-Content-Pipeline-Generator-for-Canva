// ==========================================
// CONFIGURATION
// Gemini API key is loaded from Script Properties via config.gs
// ==========================================
const config = getConfig();
const GEMINI_API_KEY = config.geminiApiKeyHustles;

function generateSevenRandomHustles() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sourceSheet = ss.getSheetByName("SidehustleDBL List");
  var currentSheet = ss.getActiveSheet();

  if (!sourceSheet) {
    SpreadsheetApp.getUi().alert("Could not find the 'SidehustleDBL List' tab. Please double check the spelling!");
    return;
  }

  // 1. READ THE MASTER POOL FROM COLUMN B OF THE SOURCE LIST
  var range = sourceSheet.getRange("B2:B1417");
  var values = range.getValues().filter(String);

  var cleanValues = [];
  for (var i = 0; i < values.length; i++) {
    if (values[i][0] && values[i][0].toString().trim() !== "") {
      cleanValues.push(values[i][0].toString().trim());
    }
  }

  if (cleanValues.length < 14) {
    SpreadsheetApp.getUi().alert("Not enough side hustles in the list to generate 7 unique pairs!");
    return;
  }

  // Clear previous outputs in D, E, and F
  currentSheet.getRange("D2:F8").setValue("");

  // Set immediate loading states in Column F
  currentSheet.getRange("F2:F8").setValue("Generating all AI captions via single request...");
  SpreadsheetApp.flush();

  var pairsArray = [];
  var rowOutputs = [];

  // Loop 7 times to randomly select 7 distinct pairs from the master pool
  for (var j = 0; j < 7; j++) {
    var index1 = Math.floor(Math.random() * cleanValues.length);
    var choice1 = cleanValues[index1];
    cleanValues.splice(index1, 1);

    var index2 = Math.floor(Math.random() * cleanValues.length);
    var choice2 = cleanValues[index2];
    cleanValues.splice(index2, 1);

    var emojiChoice1 = getMatchingEmoji(choice1, 1) + " " + choice1;
    var emojiChoice2 = getMatchingEmoji(choice2, 2) + " " + choice2;

    pairsArray.push({ index: j + 1, hustleA: emojiChoice1, hustleB: emojiChoice2 });
    rowOutputs.push([emojiChoice1, emojiChoice2]);
  }

  // Write all generated pairs to D2:E8 instantly on the active sheet
  currentSheet.getRange("D2:E8").setValues(rowOutputs);
  SpreadsheetApp.flush();

  // Call the inner processor to send everything in 1 clean single request
  generateAllCaptionsBulk(pairsArray);
}

function generateAllCaptionsBulk(pairs) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();

  if (!GEMINI_API_KEY) {
    sheet.getRange("F2:F8").setValue("⚠️ Missing GEMINI_API_KEY_HUSTLES in Script Properties.");
    return;
  }

  var pairsContext = "";
  if (pairs && Array.isArray(pairs)) {
    for (var i = 0; i < pairs.length; i++) {
      pairsContext += "Pair " + pairs[i].index + ": Option A = '" + pairs[i].hustleA + "', Option B = '" + pairs[i].hustleB + "'\n";
    }
  } else {
    sheet.getRange("F2:F8").setValue("⚠️ Error: The data pairs array passed to the AI generator was empty or invalid.");
    return;
  }

  var prompt = "You are a social media copywriter. Write a unique, very short, engaging, highly interactive social media caption for each of the 7 pairs of 'This or That' side hustle options below. These posts will target LinkedIn and Instagram.\n\n" +
               "Here are the 7 pairs:\n" + pairsContext + "\n" +
               "Requirements for EVERY single caption:\n" +
               "1. Start with a catchy hook line asking which one they would choose.\n" +
               "2. Explicitly tell users to vote using the interactive poll tool, or comment their choice down below.\n" +
               "3. Include a very brief, intelligent, 1-sentence comparison or thought on why this choice is tough.\n" +
               "4. Explicitly state: 'Check out sidehustledbl.com for more than 1400+ side hustle ideas'\n" +
               "5. Provide exactly 5 to 7 highly tailored hashtags at the very bottom that specifically fit sidehustledbl.com, our ideal ICP (MBB Consultants, EB/BB IB Analyst/Associates/VPs, and Big Tech PMs) and these specific two industries/hustles.\n" +
               "6. Keep the tone professional (something MBB Consultants, IB Analyst, and Big Tech PMs would find insightful) yet fun, energetic, and clean (no excessive emoji spam).\n\n" +
               "CRITICAL RESPONSE FORMAT:\n" +
               "Return your response ONLY as a valid JSON array of objects matching the given schema. Do not wrap it in markdown code block fences. Output exactly 7 entries matching the order given. Use this schema:\n" +
               "[\n" +
               "  { \"index\": 1, \"caption\": \"...text of caption 1 here...\" },\n" +
               "  { \"index\": 2, \"caption\": \"...text of caption 2 here...\" }\n" +
               "]";

  var baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
  var finalUrl = baseUrl + "?key=" + GEMINI_API_KEY.toString().trim();

  var payload = {
    "contents": [{ "parts": [{ "text": prompt }] }],
    "generationConfig": {
      "responseMimeType": "application/json"
    }
  };

  var options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };

  try {
    var response = UrlFetchApp.fetch(finalUrl, options);
    var responseText = response.getContentText();
    var json = JSON.parse(responseText);

    if (json.candidates && json.candidates[0].content && json.candidates[0].content.parts[0].text) {
      var rawJsonText = json.candidates[0].content.parts[0].text.trim();
      var parsedData = JSON.parse(rawJsonText);
      var captionsArray = null;

      if (Array.isArray(parsedData)) {
        captionsArray = parsedData;
      } else if (typeof parsedData === 'object' && parsedData !== null) {
        var keys = Object.keys(parsedData);
        for (var idx = 0; idx < keys.length; idx++) {
          if (Array.isArray(parsedData[keys[idx]])) {
            captionsArray = parsedData[keys[idx]];
            break;
          }
        }
      }

      var finalSpreadsheetOutputs = [];
      var timestamp = new Date().toLocaleString();

      for (var k = 0; k < 7; k++) {
        var targetRow = 2 + k;
        var rowCaption = "";

        if (captionsArray && captionsArray[k]) {
          rowCaption = captionsArray[k].caption || captionsArray[k].text || JSON.stringify(captionsArray[k]);
        } else {
          rowCaption = "Error: AI missed generating a response item for this specific index layout.";
        }

        // Save to active workspace UI
        sheet.getRange("F" + targetRow).setValue(rowCaption);

        // Collect data elements package for the History Archive system
        var optionA = sheet.getRange("D" + targetRow).getValue();
        var optionB = sheet.getRange("E" + targetRow).getValue();
        finalSpreadsheetOutputs.push([timestamp, optionA, optionB, rowCaption]);
      }

      // TRIGGER THE ROLLING 5-RUN ARCHIVE SYSTEM
      archiveOutputsToLog(finalSpreadsheetOutputs);

    } else {
      var apiError = json.error ? json.error.message : "Unknown API configuration issue.";
      sheet.getRange("F2:F8").setValue("Error: " + apiError);
    }
  } catch (e) {
    sheet.getRange("F2:F8").setValue("Failed to parse structural response array. Error: " + e.toString());
  }
}

// NEW FUNCTION: Manages the rolling 5-run structural log
function archiveOutputsToLog(newRowsData) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var logSheet = ss.getSheetByName("History_Log");

  // If the History tab doesn't exist yet, create it instantly
  if (!logSheet) {
    logSheet = ss.insertSheet("History_Log");
    logSheet.appendRow(["Timestamp Archive", "Option A", "Option B", "Generated Social Caption"]);
    logSheet.getRange("A1:D1").setFontWeight("bold").setBackground("#f3f3f3");
  }

  // Insert 7 clean empty rows right underneath the header row (Row 2)
  logSheet.insertRowsAfter(1, 7);

  // Write the 7 fresh captions into that newly cleared top slot
  logSheet.getRange(2, 1, 7, 4).setValues(newRowsData);

  // ROLLING OVERWRITE CHECK: If sheet exceeds 36 rows (1 header + 35 content rows max), chop off the bottom
  var maxAllowedRows = 36;
  var totalRowsNow = logSheet.getLastRow();
  if (totalRowsNow > maxAllowedRows) {
    var rowsToDelete = totalRowsNow - maxAllowedRows;
    logSheet.deleteRows(maxAllowedRows + 1, rowsToDelete);
  }
}

function getMatchingEmoji(text, itemNumber) {
  if (!text) return "💡";
  var lowerText = text.toLowerCase();
  var rules = [
    { keywords: ["fountain pen", "pen repair", "calligraphy pen", "stationery restoration"], emoji: "✒️" },
    { keywords: ["ebay", "ebay reseller", "online reseller", "amazon fba"], emoji: "🛒" },
    { keywords: ["baseball", "baseball bat", "softball"], emoji: "⚾" },
    { keywords: ["play mobile games", "mobile games", "video game", "game streaming", "twitch", "gaming", "gamer", "esports", "modder"], emoji: "🎮" },
    { keywords: ["mobile mechanic", "mechanic ", "auto repair", "car repair"], emoji: "🔧" },
    { keywords: ["spatial computing", "vr designer", "ar experience", "metaverse"], emoji: "🥽" },
    { keywords: ["accelerator program", "incubator", "venture studio"], emoji: "🚀" },
    { keywords: ["resume designer", "resume writing", "cv writing", "cover letter"], emoji: "📄" },
    { keywords: ["meal kit", "food kit", "box delivery", "meal prep delivery"], emoji: "📦🍳" },
    { keywords: ["candy bar", "candy", "sweets", "confectionery"], emoji: "🍬" },
    { keywords: ["plant propagation", "rare plant", "botanical", "houseplant", "succulent"], emoji: "🌿" },
    { keywords: ["stock trading", "day trading", "day trader", "forex", "options trading"], emoji: "📈" },
    { keywords: ["carpentry", "woodworking", "woodcarving", "lumber"], emoji: "🪚" },
    { keywords: ["construction", "estimating specialist", "building estimator", "contracting"], emoji: "👷" },
    { keywords: ["property monitoring", "smart home", "home integration", "house tracking"], emoji: "🏠" },
    { keywords: ["wine", "vineyard", "sommelier"], emoji: "🍷" },
    { keywords: ["tea ", "matcha", "herbal infusion"], emoji: "🍵" },
    { keywords: ["coffee", "roasting", "barista", "espresso", "cafe "], emoji: "☕" },
    { keywords: ["juice", "smoothie", "boba", "bubble tea"], emoji: "🧋" },
    { keywords: ["cocktail", "mixology", "bartender", "bar operation"], emoji: "🍹" },
    { keywords: ["water filter", "alkaline water", "hydration"], emoji: "💧" },
    { keywords: ["beverage", "drink"], emoji: "🥤" },
    { keywords: ["pet sitting", "dog walking", "pet ", "dog ", "cat ", "animal"], emoji: "🐶" },
    { keywords: ["corporate gift", "gift service", "gift basket", "gift box", "gifting"], emoji: "🎁" },
    { keywords: ["laundromat", "laundry", "washing", "dry clean"], emoji: "🧺" },
    { keywords: ["instacart", "grocery shopper", "grocery delivery", "grocery list"], emoji: "🛒" },
    { keywords: ["soap", "candle", "body product", "crafter", "artisan soap"], emoji: "🧼" },
    { keywords: ["decluttering", "downsizing", "closet organization"], emoji: "📦" },
    { keywords: ["mediator", "dispute", "legal", "law ", "lawyer", "attorney", "gavel", "compliance", "notary"], emoji: "⚖️" },
    { keywords: ["digital product", "ui/ux", "app design", "web design", "software", "website", "app ", "code", "wordpress", "developer", "smart-contract"], emoji: "💻" },
    { keywords: ["itinerary", "travel", "tourism", "tour ", "destination", "vacation"], emoji: "✈️" },
    { keywords: ["upholstery", "furniture", "couch", "sofa", "chair tuning", "upholster"], emoji: "🛋️" },
    { keywords: ["food truck", "truck operation", "cookie delivery", "delivery service"], emoji: "🚚" },
    { keywords: ["beauty", "cosmetics", "skincare", "makeup", "lipstick", "salon", "hairdresser"], emoji: "💄" },
    { keywords: ["party styling", "party box", "party entertainment", "wedding", "ceremony", "party ", "festival", "host", "mc"], emoji: "🎉" },
    { keywords: ["ghost kitchen", "kitchen", "meal plan", "culinary", "dining", "chef", "catering", "cooking", "meal prep"], emoji: "🍳" },
    { keywords: ["crafts on etsy", "etsy", "crafts", "handmade", "handicraft", "pottery", "clay", "textile art"], emoji: "🧶" },
    { keywords: ["apparel", "clothing", "smart textile", "quilt", "sew", "embroidery", "fabric", "tailor"], emoji: "👕" },
    { keywords: ["children", "kids", "activity box", "babysitting", "nanny", "childcare", "toddler"], emoji: "🎈" },
    { keywords: ["process optimization", "optimization specialist", "data analyst", "analytics", "database"], emoji: "📊" },
    { keywords: ["cold email", "email outreach", "newsletter", "copywriting email", "email marketing"], emoji: "📧" },
    { keywords: ["garden design", "garden ", "gardening", "landscape design", "lawn", "grass", "turf", "native", "landscape", "mushroom"], emoji: "🌱" },
    { keywords: ["personal fitness", "fitness training", "gym", "workout", "sport", "player", "fitness", "personal trainer"], emoji: "🏃" },
    { keywords: ["e-book", "e-books", "bookstore", "book ", "books ", "literary", "author"], emoji: "📚" },
    { keywords: ["handyman", "preparedness", "kit assembly", "emergency prep", "hardware", "engraver", "titanium", "laser", "cnc", "repair"], emoji: "🛠️" },
    { keywords: ["cookie", "bakery", "baking", "dessert"], emoji: "🍪" },
    { keywords: ["sleep", "lucid dream", "dreaming", "nighttime", "bedtime"], emoji: "🌙" },
    { keywords: ["eco-conscious", "eco-tourism", "eco-warrior", "sustainable", "disposal", "carbon footprint", "recycling", "upcycled"], emoji: "♻️" },
    { keywords: ["pool ", "swimming", "aquatic", "water tank"], emoji: "🏊" },
    { keywords: ["mini golf", "golf "], emoji: "⛳" },
    { keywords: ["systems integrator", "infrastructure", "mainframe", "server", "network architecture"], emoji: "🎛️" },
    { keywords: ["project management", "project manager", "freelance project", "scrum", "agile", "talent development", "career coach", "mentorship", "mentor"], emoji: "📋" },
    { keywords: ["crypto", "blockchain", "web3", "bitcoin"], emoji: "🪙" },
    { keywords: ["shield", "privacy", "security", "cyber", "hack", "encryption"], emoji: "🛡️" },
    { keywords: ["real estate", "property", "housing", "landlord", "airbnb", "rental", "house"], emoji: "🏠" },
    { keywords: ["paint", "canvas", "illustration", "whiteboard", "drawing", "fine art", "painter"], emoji: "🎨" },
    { keywords: ["graphic designer", "logo design", "art designer", "design room", "design studio"], emoji: "🎨" },
    { keywords: ["vintage", "thrift", "antique", "resell", "second-hand", "vinyl"], emoji: "🎞️" },
    { keywords: ["venture", "pitch", "fundraising", "startup", "vc", "strategy", "consultant", "advisor", "b2b", "marketing"], emoji: "📈" },
    { keywords: ["finance", "accounting", "bookkeeping", "payout", "tax", "pricing"], emoji: "💰" },
    { keywords: ["clerical", "assistant", "receptionist", "virtual assistant", "va", "administrative"], emoji: "📞" },
    { keywords: ["tutor", "teach", "workshop", "webinar", "education", "coaching", "coach"], emoji: "🧠" },
    { keywords: ["clean", "window", "housekeeping", "maid"], emoji: "🧹" },
    { keywords: ["vending", "retail", "shop", "store", "e-commerce"], emoji: "🛒" },
    { keywords: ["car ", "auto ", "vehicle", "classic car", "truck"], emoji: "🚗" },
    { keywords: ["nutrition", "wellness", "health", "therapy", "yoga", "meditation", "spa", "senior", "elder", "retiree", "companion"], emoji: "🧘" }
  ];

  for (var i = 0; i < rules.length; i++) {
    for (var j = 0; j < rules[i].keywords.length; j++) {
      if (lowerText.indexOf(rules[i].keywords[j]) !== -1) {
        return rules[i].emoji;
      }
    }
  }

  return itemNumber === 1 ? "💡" : "🎯";
}