// ==========================================
// CONFIGURATION
// Gemini API key is loaded from Script Properties via config.gs
// ==========================================
const config = getConfig();
const GEMINI_API_KEY = config.geminiApiKeyFactoidSeries;

function GenerateDidYouKnowFactoidsBulk() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sourceSheet = ss.getSheetByName("SidehustleDBL List");
  var currentSheet = ss.getActiveSheet();

  if (!sourceSheet) {
    SpreadsheetApp.getUi().alert("Could not find the 'SidehustleDBL List' tab. Please double check the spelling!");
    return;
  }

  // 1. READ THE MASTER POOL (NAMES FROM COL B, DESCRIPTIONS FROM COL C)
  var rangeName = sourceSheet.getRange("B2:B1417").getValues();
  var rangeDesc = sourceSheet.getRange("C2:C1417").getValues();

  var masterPool = [];
  for (var i = 0; i < rangeName.length; i++) {
    var nameVal = rangeName[i][0] ? rangeName[i][0].toString().trim() : "";
    var descVal = rangeDesc[i][0] ? rangeDesc[i][0].toString().trim() : "";

    if (nameVal !== "") {
      masterPool.push({ name: nameVal, description: descVal });
    }
  }

  if (masterPool.length < 7) {
    SpreadsheetApp.getUi().alert("Not enough side hustles found in your database list to generate 7 items!");
    return;
  }

  // Clear data rows (Columns D, E, and F, rows 2-8). Leave headers in Row 1 untouched!
  currentSheet.getRange("D2:F8").clearContent();

  // Update localized status message in the description slot
  currentSheet.getRange("F2").setValue("🔄 Compiling 7 fact-backed social items...");
  SpreadsheetApp.flush();

  var selectionsArray = [];
  var localRowOutputs = [];

  // Loop 7 times to randomly select 7 distinct side hustles from the pool
  for (var j = 0; j < 7; j++) {
    var randomIndex = Math.floor(Math.random() * masterPool.length);
    var selectedItem = masterPool[randomIndex];

    masterPool.splice(randomIndex, 1);

    var withEmojiName = getMatchingEmoji(selectedItem.name, 1) + " " + selectedItem.name;

    selectionsArray.push({
      index: j + 1,
      name: withEmojiName,
      originalDescription: selectedItem.description
    });

    // Output structure: Side Hustle Name goes cleanly into Column D
    localRowOutputs.push([withEmojiName]);
  }

  // Write the Side Hustle Names safely to rows D2:D8
  currentSheet.getRange("D2:D8").setValues(localRowOutputs);
  SpreadsheetApp.flush();

  executeFactoidGenerationEngine(selectionsArray);
}

function executeFactoidGenerationEngine(factoidItems) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();

  if (!GEMINI_API_KEY) {
    sheet.getRange("F2").setValue("⚠️ Missing GEMINI_API_KEY_FACTOID_SERIES in Script Properties.");
    return;
  }

  var itemsContext = "";
  if (factoidItems && Array.isArray(factoidItems)) {
    for (var i = 0; i < factoidItems.length; i++) {
      itemsContext += "Item " + factoidItems[i].index + " (Asset: '" + factoidItems[i].name + "'):\\n" +
                     "- Base Context: '" + factoidItems[i].originalDescription + "'\\n\\n";
    }
  } else {
    sheet.getRange("F2").setValue("⚠️ Error: The data bundle passed to the AI generator was empty or invalid.");
    return;
  }

  var prompt = "You are an elite business research analyst and content strategist. For each of the 7 side hustles listed below, generate an insightful, data-linked social media post optimized for high-earning corporate professionals (Management Consultants, Investment Bankers, Tech PMs).\\n\\n" +
               "Here are the 7 items:\\n\\n" + itemsContext + "\\n" +
               "Requirements for EVERY single entry:\\n" +
               "1. Graphic Title (Hook): A highly scannable, sharp 'Did you know?' question or conversational statement (max 15 words) meant to be placed directly on the image/video graphic. It MUST contain a real, definitive macro-economic statistic, market sizing data, or specific industry financial metric relevant to that business model sector.\\n\\n" +
               "2. Description Body Formatting: You must assemble this column strictly as a single text block using standard newline characters (\\\\n) to create clean line-break spaces between paragraphs. It must match this exact narrative progression:\\n" +
               "   - [Bridge & Deep Insight]: The very first sentence must immediately address, build upon, and explain the exact data point or statistic cited in the Graphic Title. Follow with 1-2 sentences explaining the unglamorous micro-economics, operational inefficiencies, or underlying market arbitrage that drives this asset's profitability.\\n" +
               "   - [Source Citation]: Include a formal source line citing a highly reputable, non-blog enterprise source (e.g., Gartner, IBISWorld, McKinsey, SEC filings, Statista, Harvard Business Review, Bloomberg, or U.S. Bureau of Labor Statistics) verifying the data model.\\n" +
               "   - [Line Break]\\n" +
               "   - [Promotion Line]: 'Explore over 1,400+ curated models at sidehustledbl.com'\\n" +
               "   - [Line Break]\\n" +
               "   - [Hashtags]: Provide exactly 5 to 7 highly targeted professional hashtags.\\n\\n" +
               "CRITICAL CONSTRAINTS:\\n" +
               "- No generic marketing jargon, lifestyle fluff, or hand-waving phrases like 'passive income' or 'financial freedom'. Stay clinical, logical, and focused on operational mechanics.\\n" +
               "- Do not drop the stat from the hook. The text body must read like a continuous, data-backed insight that logically concludes by directing them to your database to find similar structural models.\\n\\n" +
               "CRITICAL RESPONSE FORMAT:\\n" +
               "Return your response ONLY as a valid JSON array of objects matching the given schema. Do not wrap it in markdown code block fences or add extra prose. Output exactly 7 entries. Use this schema:\\n" +
               "[\\n" +
               "  {\\n" +
               "    \\"index\\": 1,\\n" +
               "    \\"graphic_title\\": \\"Did you know the U.S. independent financial advisory sector reached a record $52.8B market size?\\",\\n" +
               "    \\"description_body\\": \\"This $52.8B evaluation reflects a massive structural migration of high-net-worth capital away from legacy institutional banks toward specialized, fee-only boutique models. Independent operators optimize for this shift by isolating high-leverage skill verticals like equity compensation modeling or cross-border tax restructuring into lean advisory frameworks that can be run on custom timelines.\\\\nSource: IBISWorld Sector Analytics Reports\\\\n\\\\nExplore over 1,400+ curated models at sidehustledbl.com\\\\n\\\\n#WealthManagement #CorporateStrategy #SideHustleDBL #B2BAdvice #ConsultingAlumni #Fintech\\"\\n" +
               "  }\\n" +
               "]";

  var baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
  var finalUrl = baseUrl + "?key=" + GEMINI_API_KEY.toString().trim();

  var payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json"
    }
  };

  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    var response = UrlFetchApp.fetch(finalUrl, options);
    var responseText = response.getContentText();
    var json = JSON.parse(responseText);

    // Clear out localized loading text from row 2
    sheet.getRange("F2").setValue("");

    if (json.candidates && json.candidates[0].content && json.candidates[0].content.parts[0].text) {
      var rawJsonText = json.candidates[0].content.parts[0].text.trim();
      var parsedData = JSON.parse(rawJsonText);
      var captionsArray = null;

      if (Array.isArray(parsedData)) {
        captionsArray = parsedData;
      } else if (typeof parsedData === "object" && parsedData !== null) {
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
        var rowHook = "";
        var rowDesc = "";

        if (captionsArray && captionsArray[k]) {
          rowHook = captionsArray[k].graphic_title || captionsArray[k].hook || "";
          rowDesc = captionsArray[k].description_body || captionsArray[k].caption || "";
        } else {
          rowHook = "Error parsing item.";
          rowDesc = "Error: AI missed generating a response item for this specific layout index.";
        }

        // Output Graphic Title cleanly to Column E and Full Description/Hashtags to Column F
        sheet.getRange("E" + targetRow).setValue(rowHook);
        sheet.getRange("F" + targetRow).setValue(rowDesc);

        var sideHustleName = sheet.getRange("D" + targetRow).getValue();
        finalSpreadsheetOutputs.push([timestamp, sideHustleName, rowHook, rowDesc]);
      }

      // Record to background history archive log dedicated to factoids
      archiveFactoidOutputsToLog(finalSpreadsheetOutputs);
    } else {
      var apiError = json.error ? json.error.message : "Unknown API configuration issue.";
      sheet.getRange("F2").setValue("Error: " + apiError);
    }
  } catch (e) {
    sheet.getRange("F2").setValue("Failed to parse structural response array. Error: " + e.toString());
  }
}

function archiveFactoidOutputsToLog(newRowsData) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var logSheet = ss.getSheetByName("Factoid_History_Log");

  if (!logSheet) {
    logSheet = ss.insertSheet("Factoid_History_Log");
    logSheet.appendRow(["Timestamp Archive", "Side Hustle Name", "Graphic Hook Text", "Generated Description & Tags"]);
    logSheet.getRange("A1:D1").setFontWeight("bold").setBackground("#e2f0d9");
  }

  // Insert exactly 7 new rows at the top position right under headers
  logSheet.insertRowsAfter(1, 7);
  logSheet.getRange(2, 1, 7, 4).setValues(newRowsData);

  // STRIKT HARD CAP: 1 Header row + (5 historical runs * 7 items per run) = 36 total rows max.
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