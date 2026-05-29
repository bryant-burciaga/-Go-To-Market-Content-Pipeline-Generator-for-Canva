// ==========================================
// CONFIGURATION
// Gemini API key is loaded from Script Properties via config.gs
// ==========================================
const config = getConfig();
const GEMINI_API_KEY = config.geminiApiKeyDailyIdea;

function SidehustleIdeaOftheDay() {
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
    SpreadsheetApp.getUi().alert("Not enough side hustles found in your database list to generate 7 days!");
    return;
  }

  // Clear contents of data rows (Columns D and E, rows 2-8). Leave headers in Row 1 untouched!
  currentSheet.getRange("D2:E8").clearContent();

  // Update temporary loading notification in the post description column slot
  currentSheet.getRange("E2").setValue("🔄 Generating 7 standalone featured posts...");
  SpreadsheetApp.flush();

  var daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  var selectionsArray = [];
  var localRowOutputs = [];

  // Loop 7 times to randomly select 7 distinct featured side hustles
  for (var j = 0; j < 7; j++) {
    var randomIndex = Math.floor(Math.random() * masterPool.length);
    var selectedItem = masterPool[randomIndex];

    masterPool.splice(randomIndex, 1);

    var withEmojiName = getMatchingEmoji(selectedItem.name, 1) + " " + selectedItem.name;
    var currentDay = daysOfWeek[j];

    selectionsArray.push({
      day: currentDay,
      index: j + 1,
      name: withEmojiName,
      originalDescription: selectedItem.description
    });

    // ADJUSTED VALUE ARRAY: Only place the Idea Name into Column D
    localRowOutputs.push([withEmojiName]);
  }

  // Write the Side Hustle Name strictly to data rows D2:D8 safely
  currentSheet.getRange("D2:D8").setValues(localRowOutputs);
  SpreadsheetApp.flush();

  generateAllFeaturedPostsBulk(selectionsArray);
}

function generateAllFeaturedPostsBulk(featuredItems) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();

  if (!GEMINI_API_KEY) {
    sheet.getRange("E2").setValue("⚠️ Missing GEMINI_API_KEY_DAILY_IDEA in Script Properties.");
    return;
  }

  var itemsContext = "";
  if (featuredItems && Array.isArray(featuredItems)) {
    for (var i = 0; i < featuredItems.length; i++) {
      itemsContext += "Post " + featuredItems[i].index + " (" + featuredItems[i].day + "):\\n" +
                     "- Side Hustle: '" + featuredItems[i].name + "'\\n" +
                     "- Base Context: '" + featuredItems[i].originalDescription + "'\\n\\n";
    }
  } else {
    sheet.getRange("E2").setValue("⚠️ Error: The data bundle passed to the AI generator was empty or invalid.");
    return;
  }

  var prompt = "You are an elite B2B social media strategist and copywriter. Write a highly engaging, sharp, standalone social media spotlight post for each of the 7 featured 'Side Hustle of the Day' items below. These target high-performing professionals on LinkedIn and Instagram.\\n\\n" +
               "Here are the 7 daily featured items:\\n\\n" + itemsContext + "\\n" +
               "Requirements for EVERY single standalone post:\\n" +
               "1. Start with an attention-grabbing hook line introducing this as the 'Side Hustle of the Day'.\\n" +
               "2. Write an intelligent, sophisticated 2-3 sentence overview explaining why this asset class/hustle is viable, leveraging the Base Context provided.\\n" +
               "3. Tailor the tone explicitly to appeal to our ideal premium ICP (MBB Consultants, Bulge Bracket/Elite Boutique Investment Bankers, and Big Tech Product Managers). Focus on ROI, operational efficiency, skill scalability, or cash flow arbitrage.\\n" +
               "4. Keep it punchy and clear, avoiding excessive generic marketing buzzwords or corporate jargon spam.\\n" +
               "5. Explicitly include this line to funnel traffic: 'Explore over 1,400+ curated ideas at sidehustledbl.com'\\n" +
               "6. Provide exactly 5 to 7 highly tailored, relevant hashtags at the very bottom that specifically match the niche industry of the hustle and attract high-earning corporate professionals looking for secondary income streams.\\n\\n" +
               "CRITICAL RESPONSE FORMAT:\\n" +
               "Return your response ONLY as a valid JSON array of objects matching the given schema. Do not wrap it in markdown code block fences or add extra prose. Output exactly 7 entries matching the day order given. Use this schema:\\n" +
               "[\\n" +
               "  { \\"index\\": 1, \\"caption\\": \\"...text of standalone post 1 here...\\" },\\n" +
               "  { \\"index\\": 2, \\"caption\\": \\"...text of standalone post 2 here...\\" }\\n" +
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

    // Clear out the temporary loading notice from row 2
    sheet.getRange("E2").setValue("");

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
        var rowCaption = "";

        if (captionsArray && captionsArray[k]) {
          rowCaption = captionsArray[k].caption || captionsArray[k].text || JSON.stringify(captionsArray[k]);
        } else {
          rowCaption = "Error: AI missed generating a response item for this specific index layout.";
        }

        // Output AI post cleanly to Column E
        sheet.getRange("E" + targetRow).setValue(rowCaption);

        var sideHustleName = sheet.getRange("D" + targetRow).getValue();
        finalSpreadsheetOutputs.push([timestamp, sideHustleName, rowCaption]);
      }

      // Record to background history archive log
      archiveDailyOutputsToLog(finalSpreadsheetOutputs);
    } else {
      var apiError = json.error ? json.error.message : "Unknown API configuration issue.";
      sheet.getRange("E2").setValue("Error: " + apiError);
    }
  } catch (e) {
    sheet.getRange("E2").setValue("Failed to parse structural response array. Error: " + e.toString());
  }
}

function archiveDailyOutputsToLog(newRowsData) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var logSheet = ss.getSheetByName("Daily_History_Log");

  if (!logSheet) {
    logSheet = ss.insertSheet("Daily_History_Log");
    logSheet.appendRow(["Timestamp Archive", "Side Hustle Name", "Generated Social Post Copy"]);
    logSheet.getRange("A1:C1").setFontWeight("bold").setBackground("#e6f2ff");
  }

  logSheet.insertRowsAfter(1, 7);
  logSheet.getRange(2, 1, 7, 3).setValues(newRowsData);

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