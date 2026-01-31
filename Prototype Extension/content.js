(() => {
  // ===============================
  // Hard Guard: Shopee only
  // ===============================
  if (!location.hostname.includes("shopee.")) return;

  console.log("ScamGuard content.js loaded (Shopee)");

function showScanCard() {
  if (!/-i\.\d+\.\d+/.test(location.href)) return;
  if (document.getElementById("sureshopph-scan-card")) return;

  const card = document.createElement("div");
  card.id = "sureshopph-scan-card";

  card.innerHTML = `
    <div class="header">
      <div class="title-section">
        <i class="fas fa-shield-alt"></i>
        <strong>SureShop</strong>
      </div>
      <button class="close">×</button>
    </div>
    <div class="body">
      <p>Scan Is Ready</p>
    </div>
  `;

  const style = document.createElement("style");
  style.textContent = `
    /* CSS Variables matching dashboard */
    :root {
      --dash-primary: #22c55e;
      --dash-primary-dark: #15803d;
      --dash-primary-light: #dcfce7;
      --dash-dark: #1f2937;
      --dash-light: #f9fafb;
      --dash-gray: #6b7280;
      --dash-gray-light: #f3f4f6;
      --dash-border: #e5e7eb;
      --dash-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      --dash-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      --dash-radius: 12px;
    }

    #sureshopph-scan-card {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 240px;
      background: white;
      border: 2px solid transparent;
      border-radius: var(--dash-radius);
      padding: 0;
      font-family: 'Poppins', system-ui, sans-serif;
      box-shadow: var(--dash-shadow-lg);
      z-index: 999999;
      animation: slideInCard 0.3s ease;
      border-left: 4px solid var(--dash-primary);
      overflow: hidden;
    }

    @keyframes slideInCard {
      from { 
        opacity: 0; 
        transform: translateY(-12px) scale(0.95); 
      }
      to { 
        opacity: 1; 
        transform: translateY(0) scale(1); 
      }
    }

    #sureshopph-scan-card .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: linear-gradient(135deg, var(--dash-primary) 0%, var(--dash-primary-dark) 100%);
      color: white;
      border-radius: var(--dash-radius) var(--dash-radius) 0 0;
      margin: 0;
    }

    #sureshopph-scan-card .title-section {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 700;
      color: white;
    }

    #sureshopph-scan-card .title-section i {
      color: white;
      font-size: 16px;
      opacity: 0.9;
    }

    #sureshopph-scan-card .body {
      padding: 16px;
      background: white;
    }

    #sureshopph-scan-card .body p {
      font-size: 13px;
      color: var(--dash-gray);
      margin: 0;
      line-height: 1.4;
      font-weight: 500;
    }

    #sureshopph-scan-card .close {
      border: none;
      background: rgba(255, 255, 255, 0.2);
      font-size: 16px;
      cursor: pointer;
      line-height: 1;
      padding: 6px;
      color: white;
      border-radius: 6px;
      transition: all 0.2s ease;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }

    #sureshopph-scan-card .close:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.1);
    }

    /* Enhanced hover effect */
    #sureshopph-scan-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      border-color: var(--dash-primary-light);
    }

    /* Smooth dismiss animation */
    #sureshopph-scan-card.dismissing {
      opacity: 0;
      transform: translateY(-12px) scale(0.95);
      transition: all 0.25s ease;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(card);

  card.querySelector(".close").onclick = () => {
    card.classList.add('dismissing');
    setTimeout(() => card.remove(), 250);
  };

  // Auto-dismiss after 7 seconds with smooth animation
  setTimeout(() => {
    if (document.getElementById("sureshopph-scan-card")) {
      card.classList.add('dismissing');
      setTimeout(() => card.remove(), 250);
    }
  }, 7000);
}

  // Function to check and show card when needed
  function checkAndShowCard() {
    const isProductPage = /-i\.\d+\.\d+/.test(location.href);
    if (isProductPage) {
      setTimeout(() => {
        showScanCard();
      }, 1000); // Small delay to ensure page is loaded
    }
  }

  // Show card on initial page load
  checkAndShowCard();

  // Send initial message
  const isProductPage = /-i\.\d+\.\d+/.test(location.href);
  chrome.runtime.sendMessage({
    type: isProductPage ? "SURESHOPPH_PRODUCT_PAGE" : "SURESHOPPH_NOT_PRODUCT_PAGE"
  });

  // ===============================
  // SPA Navigation Detection
  // ===============================
  let lastUrl = location.href;
  let latestData = null;
  let dataStale = true;

  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      dataStale = true;
      console.log("ScamGuard: page changed");
      
      // Show card when navigating to a new page
      checkAndShowCard();
      
      const isProductPage = /-i\.\d+\.\d+/.test(location.href);
      chrome.runtime.sendMessage({
        type: isProductPage ? "SURESHOPPH_PRODUCT_PAGE" : "SURESHOPPH_NOT_PRODUCT_PAGE"
      });
    }
  }, 500);

  // ===============================
  // Helpers
  // ===============================
  function cleanText(text) {
    return text ? text.replace(/\s+/g, " ").trim() : null;
  }

  function normalizeNumber(text) {
    if (!text) return null;
    const match = text.replace(/,/g, "").match(/[\d.]+/);
    return match ? Number(match[0]) : null;
  }

  // ===============================
  // Extractors (Shopee-Correct)
  // ===============================

  function extractMainPrice() {
    const candidates = [...document.body.querySelectorAll("*")]
      .map(el => el.textContent)
      .filter(t => t && t.includes("₱"));

    for (const t of candidates) {
      if (
        /₱\s*\d+/.test(t) &&
        !/voucher|min|discount|off/i.test(t)
      ) {
        return {
          raw: cleanText(t),
          value: normalizeNumber(t),
          currency: "PHP",
          confidence: "high"
        };
      }
    }

    return { value: null, confidence: "low" };
  }

  function extractSoldCount() {
    const match = document.body.innerText.match(
      /(\d+(\.\d+)?K?\+?)\s+Sold/i
    );
    return match
      ? { value: match[1], confidence: "high" }
      : { value: null, confidence: "low" };
  }

  // ⭐ Rating + number of ratings
  function extractRatings() {
    const text = document.body.innerText;

    const ratingMatch = text.match(/\b([0-5]\.\d)\b/);
    const countMatch = text.match(/\b([\d,.]+K?)\s+Ratings?\b/i);

    return {
      rating: ratingMatch
        ? { value: Number(ratingMatch[1]), confidence: "high" }
        : { value: null, confidence: "low" },

      rating_count: countMatch
        ? { value: countMatch[1], confidence: "high" }
        : { value: null, confidence: "low" }
    };
  }

  // 🟠 Response rate (e.g. 78%)
  function extractResponseRate() {
    const text = document.body.innerText;

    // Look for "Response Rate" first
    const index = text.toLowerCase().indexOf("response rate");
    if (index === -1) {
      return { value: null, confidence: "low" };
    }

    // Look at nearby text (next 50 chars)
    const nearby = text.slice(index, index + 50);

    const match = nearby.match(/(\d{1,3})%/);
    return match
      ? {
          value: Number(match[1]),
          confidence: "high"
        }
      : {
          value: null,
          confidence: "low"
        };
  }

  // 🕒 Shop age (e.g. 9 years ago, 3 months ago)
  function extractShopAge() {
    const match = document.body.innerText.match(
      /\b(\d+)\s+(year|years|month|months|day|days)\s+ago\b/i
    );

    return match
      ? {
          value: `${match[1]} ${match[2]} ago`,
          confidence: "high"
        }
      : {
          value: null,
          confidence: "low"
        };
  }

  function extractSellerName() {
    // Strategy 1: Look for seller info in various common locations
    const sellerSelectors = [
      '.seller-info .seller-name',
      '.shop-info .shop-name', 
      '.seller-name',
      '.shop-name',
      '[data-testid*="seller"] span',
      '[data-testid*="shop"] span'
    ];

    // Try direct selectors first
    for (const selector of sellerSelectors) {
      try {
        const element = document.querySelector(selector);
        if (element) {
          const name = element.innerText?.trim();
          if (name && isValidShopName(name)) {
            return { value: name, confidence: "high" };
          }
        }
      } catch (e) {
        // Skip invalid selectors
        continue;
      }
    }

    // Strategy 2: Search for seller name in text patterns
    const bodyText = document.body.innerText;
    
    // Look for "Sold by [Name]" pattern
    const soldByMatch = bodyText.match(/Sold by\s+([^|\n\r]+)/i);
    if (soldByMatch) {
      const name = soldByMatch[1].trim();
      if (isValidShopName(name)) {
        return { value: name, confidence: "high" };
      }
    }

    // Look for "Shop: [Name]" pattern
    const shopMatch = bodyText.match(/Shop:\s*([^|\n\r]+)/i);
    if (shopMatch) {
      const name = shopMatch[1].trim();
      if (isValidShopName(name)) {
        return { value: name, confidence: "high" };
      }
    }

    // Strategy 3: Look near chat/contact buttons for seller info
    const contactElements = [...document.querySelectorAll('*')].filter(el => {
      const text = el.innerText?.toLowerCase() || '';
      return (text.includes('chat') || text.includes('message') || text.includes('contact')) && 
             el.innerText.length < 100; // Avoid large content blocks
    });

    for (const element of contactElements) {
      // Look for seller name in parent containers
      const container = element.closest('div, section, article');
      if (container) {
        const textContent = container.innerText;
        // Look for potential seller names (words that aren't common UI text)
        const words = textContent.split(/\s+/).filter(word => 
          word.length > 2 && 
          !/^(chat|message|contact|now|seller|shop|view|follow)$/i.test(word)
        );
        
        for (const word of words) {
          if (isValidShopName(word)) {
            return { value: word, confidence: "medium" };
          }
        }
      }
    }

    return { value: null, confidence: "low" };
  }

  function extractProfileUrl() {
    // Strategy 1: Look for actual shop/seller profile links
    const profileSelectors = [
      'a[href*="/seller/"]',
      'a[href*="/shop/"]', 
      'a[href*="/store/"]',
      'a[href*="seller_id="]',
      'a[href*="shop_id="]'
    ];

    for (const selector of profileSelectors) {
      const links = document.querySelectorAll(selector);
      for (const link of links) {
        const href = link.href;
        // Validate it's actually a profile/shop URL
        if (href && (href.includes('/shop/') || href.includes('/seller/') || href.includes('/store/'))) {
          // Make sure it's not just a product URL
          if (!href.includes('/product/') && !href.includes('/item/')) {
            return href;
          }
        }
      }
    }

    // Strategy 2: Look for profile links in seller info sections
    const sellerSections = [...document.querySelectorAll('div, section')].filter(el => {
      const text = el.innerText?.toLowerCase() || '';
      return text.includes('seller') || text.includes('shop') || text.includes('store');
    });

    for (const section of sellerSections) {
      const links = section.querySelectorAll('a[href]');
      for (const link of links) {
        const href = link.href;
        if (href && (href.includes('seller') || href.includes('shop') || href.includes('store'))) {
          return href;
        }
      }
    }

    // Strategy 3: Extract from page data or scripts
    try {
      // Look for seller/shop data in page scripts
      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        const content = script.textContent || '';
        const shopMatch = content.match(/"shop_id["\s]*:\s*["\s]*(\d+)/i);
        const sellerMatch = content.match(/"seller_id["\s]*:\s*["\s]*(\d+)/i);
        
        if (shopMatch) {
          return `https://shopee.ph/shop/${shopMatch[1]}`;
        }
        if (sellerMatch) {
          return `https://shopee.ph/seller/${sellerMatch[1]}`;
        }
      }
    } catch (e) {
      // Ignore script parsing errors
    }

    return null;
  }

  function isValidShopName(name) {
    if (!name || typeof name !== 'string') return false;
    
    name = name.trim();
    
    // Filter out common UI elements and invalid names
    const invalidPatterns = [
      /^(chat|view|shop|follow|share|skip to|main content|seller|store|contact|message|now|official|verified)$/i,
      /^\d+$/, // Just numbers
      /^[^\w\s]+$/, // Only special characters  
      /^.{0,2}$/, // Too short
      /^.{51,}$/, // Too long
      /^(www\.|http|\.com|\.ph)/i, // URLs
      /^[\d\s\-\(\)\+]+$/ // Phone numbers
    ];

    return !invalidPatterns.some(pattern => pattern.test(name));
  }

  function extractProductImageCount() {
    return document.querySelectorAll(
      "img[src*='shopee'], img[data-src*='shopee']"
    ).length;
  }

  // ===============================
  // Main Extraction (FIXED - No Comments)
  // ===============================
  function extractShopeeData() {
    const titleEl = document.querySelector("h1");
    if (!titleEl) return { error: "Not a Shopee product page" };

    const ratings = extractRatings();

    return {
      platform: "Shopee",
      url: location.href,

      product: {
        title: cleanText(titleEl.innerText),
        price: extractMainPrice(),
        sold_count: extractSoldCount(),
        image_count: extractProductImageCount(),
        availability: /sold out/i.test(document.body.innerText)
          ? "out_of_stock"
          : "unknown"
      },

      seller: {
        name: extractSellerName(),
        rating: ratings.rating,
        rating_count: ratings.rating_count,
        response_rate: extractResponseRate(),
        shop_age: extractShopAge(),
        profile_url: extractProfileUrl()
      },

      extracted_at: new Date().toISOString()
    };
  }

  // ===============================
  // Messaging
  // ===============================
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "COLLECT_PAGE_DATA") {
      latestData = extractShopeeData();
      dataStale = false;
      sendResponse(latestData);
      return true;
    }

    if (message.type === "GET_CURRENT_DATA") {
      sendResponse({ stale: dataStale, data: latestData });
      return true;
    }
  });
})();