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
    { keywords: ["meal kit", "food kit", "box deslivery", "meal prep delivery"], emoji: "📦🍳" },
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