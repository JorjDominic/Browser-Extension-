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
    card.classList.add("dismissing");
    setTimeout(() => card.remove(), 250);
  };

  // Auto-dismiss after 7 seconds with smooth animation
  setTimeout(() => {
    if (document.getElementById("sureshopph-scan-card")) {
      card.classList.add("dismissing");
      setTimeout(() => card.remove(), 250);
    }
  }, 7000);
}

  // Function to check and show card when needed
  function checkAndShowCard() {
    const isProductPage = /-i\.\d+\.\d+/.test(location.href);
    if (isProductPage) {
      console.log("Product page detected, showing scan card");
      showScanCard();
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
      console.log("URL changed (SPA):", lastUrl, "→", location.href);
      lastUrl = location.href;
      dataStale = true;
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
      const match = t.match(/₱([\d,.]+)/);
      if (match) {
        const price = parseFloat(match[1].replace(/,/g, ""));
        if (price > 10 && price < 1000000) {
          return { value: price, confidence: "high" };
        }
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
    
    for (const selector of sellerSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const text = cleanText(element.textContent);
        if (text && isValidShopName(text)) {
          return { value: text, confidence: "high" };
        }
      }
    }

    // Strategy 2: Search for "Visit Shop" or similar links
    const shopLinks = [...document.querySelectorAll('a')]
      .filter(a => /visit.shop|go.to.shop|seller.profile/i.test(a.textContent) || 
                   /shop|seller/i.test(a.getAttribute('title') || ''));
    
    for (const link of shopLinks) {
      const parentText = cleanText(link.parentElement?.textContent || '');
      const words = parentText.split(/\s+/).filter(w => 
        w.length > 2 && 
        !/visit|shop|profile|go|to|the/i.test(w)
      );
      
      if (words.length > 0) {
        const candidate = words[0];
        if (isValidShopName(candidate)) {
          return { value: candidate, confidence: "medium" };
        }
      }
    }

    // Strategy 3: Look near common text patterns
    const text = document.body.innerText;
    const patterns = [
      /Shop:\s*([^\n]+)/i,
      /Seller:\s*([^\n]+)/i,
      /Store:\s*([^\n]+)/i,
      /by\s+([A-Za-z0-9_\-\.]{3,})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const candidate = cleanText(match[1]);
        if (candidate && isValidShopName(candidate)) {
          return { value: candidate, confidence: "medium" };
        }
      }
    }

    return { value: null, confidence: "low" };
  }

  function extractProfileUrl() {
    // Look for shop/seller profile URLs
    const profileSelectors = [
      'a[href*="/shop/"]',
      'a[href*="/seller/"]', 
      'a[href*="shopee.ph/shop"]',
      'a[title*="shop" i]',
      'a[title*="seller" i]'
    ];

    for (const selector of profileSelectors) {
      const links = document.querySelectorAll(selector);
      for (const link of links) {
        const href = link.getAttribute('href');
        if (href && (href.includes('/shop/') || href.includes('/seller/'))) {
          let fullUrl = href;
          if (href.startsWith('/')) {
            fullUrl = `https://shopee.ph${href}`;
          }
          return { value: fullUrl, confidence: "high" };
        }
      }
    }

    // Look for links with shop-related text
    const shopLinks = [...document.querySelectorAll('a')]
      .filter(link => {
        const text = link.textContent.toLowerCase();
        const title = (link.getAttribute('title') || '').toLowerCase();
        return text.includes('shop') || text.includes('seller') || 
               title.includes('shop') || title.includes('seller');
      });

    for (const link of shopLinks) {
      const href = link.getAttribute('href');
      if (href && href.includes('shopee.ph')) {
        return { value: href, confidence: "medium" };
      }
    }

    return { value: null, confidence: "low" };
  }

  function isValidShopName(name) {
    if (!name || name.length < 2) return false;
    
    // Filter out common UI text
    const invalidNames = [
      'shop', 'seller', 'visit', 'profile', 'page', 'store',
      'home', 'back', 'next', 'prev', 'more', 'less', 'view',
      'click', 'here', 'link', 'button', 'menu', 'nav', 'footer'
    ];
    
    return !invalidNames.includes(name.toLowerCase()) && 
           !/^\d+$/.test(name) && // Not just numbers
           name.length <= 50; // Reasonable length
  }

  function extractProductImageCount() {
    const images = document.querySelectorAll('img[src*="shopee"], img[data-src*="shopee"]');
    return { value: images.length, confidence: "medium" };
  }

  // ===============================
  // Main Extraction (FIXED - No Comments)
  // ===============================
  function extractShopeeData() {
    console.log("Extracting Shopee data...");
    
    const price = extractMainPrice();
    const sold = extractSoldCount();
    const ratings = extractRatings();
    const responseRate = extractResponseRate();
    const shopAge = extractShopAge();
    const sellerName = extractSellerName();
    const profileUrl = extractProfileUrl();
    const imageCount = extractProductImageCount();

    return {
      success: true,
      product_name: cleanText(document.title) || "Unknown Product",
      price: price.value,
      sold_count: sold.value,
      rating: ratings.rating.value,
      rating_count: ratings.rating_count.value,
      response_rate: responseRate.value,
      shop_age: shopAge.value,
      seller_name: sellerName.value,
      profile_url: profileUrl.value,
      image_count: imageCount.value,
      extracted_at: new Date().toISOString()
    };
  }

  // ===============================
  // Messaging - FIXED TO HANDLE EXTRACT_DATA
  // ===============================
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Content script received message:", message.type);
    
    if (message.type === "EXTRACT_DATA") {
      console.log("Handling EXTRACT_DATA message");
      const data = extractShopeeData();
      console.log("Extracted data:", data);
      sendResponse(data);
      return true;
    }

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

    console.log("Unknown message type:", message.type);
    return false;
  });
})();