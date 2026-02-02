let currentAutoScanTab = null;
let isInitialized = false;
let trackedTabs = new Map(); // Track tab URLs for SPA detection
let autoScanTimeout; // ADD THIS MISSING VARIABLE
let debugMode = true; // Enable extensive debugging

// Debug helper function with timestamp
function debugLog(emoji, message, ...args) {
  if (debugMode) {
    console.log(`[${new Date().toLocaleTimeString()}] ${emoji}`, message, ...args);
  }
}

// IMMEDIATE STARTUP LOGGING
debugLog("🚀", "=== BACKGROUND SCRIPT STARTING ===");
debugLog("🚀", "Script file loaded at:", new Date().toLocaleTimeString());

chrome.runtime.onInstalled.addListener(() => {
  debugLog("🟢", "=== CHROME.RUNTIME.ONINSTALLED TRIGGERED ===");
  debugLog("🟢", "SureShop Security Scanner installed");
  initializeExtension();
});

chrome.runtime.onStartup.addListener(() => {
  debugLog("🟢", "=== CHROME.RUNTIME.ONSTARTUP TRIGGERED ===");
  debugLog("🟢", "SureShop Security Scanner started");
  initializeExtension();
});

async function initializeExtension() {
  debugLog("🔧", "=== INITIALIZING EXTENSION ===");
  try {
    isInitialized = true;
    debugLog("✅", "Extension initialized successfully");
    updateAllTabs();
  } catch (error) {
    debugLog("❌", "Initialization failed:", error);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  debugLog("📨", "=== MESSAGE RECEIVED ===");
  debugLog("📨", "Message type:", message.type);
  debugLog("📨", "From tab ID:", sender.tab?.id);
  debugLog("📨", "Tab URL:", sender.tab?.url);
  debugLog("📨", "Full message:", message);
  debugLog("📊", "Current state: isInitialized =", isInitialized);
  
  // Handle GET_TAB_ID message for universal content script
  if (message.type === "GET_TAB_ID") {
    debugLog("🆔", "GET_TAB_ID request from tab:", sender.tab?.id);
    sendResponse({ tabId: sender.tab?.id });
    return true;
  }
  
  // Handle each message type separately (not else if chain)
  if (message.type === "SURESHOPPH_PRODUCT_PAGE") {
    debugLog("📱", "=== PRODUCT PAGE MESSAGE RECEIVED ===");
    debugLog("📱", "Processing product page for tab:", sender.tab?.id);
    handleProductPageMessage(sender.tab);
    sendResponse({ received: true, action: "product_page_handled" });
  }
  
  if (message.type === "SURESHOPPH_NOT_PRODUCT_PAGE") {
    debugLog("🌐", "=== NON-PRODUCT PAGE MESSAGE RECEIVED ===");
    debugLog("🌐", "Processing non-product page for tab:", sender.tab?.id);
    handleNonProductPageMessage(sender.tab);
    sendResponse({ received: true, action: "non_product_page_handled" });
  }
  
  // Handle universal URL scanning - REMOVE ELSE IF
  if (message.type === "URL_SCAN_PAGE") {
    debugLog("🌍", "=== UNIVERSAL URL SCAN PAGE MESSAGE RECEIVED ===");
    debugLog("🌍", "Processing URL scan for tab:", sender.tab?.id);
    handleUniversalUrlPageMessage(sender.tab);
    sendResponse({ received: true, action: "url_scan_triggered" });
  }
  
  if (message.type === "OPEN_POPUP") {
    debugLog("🔓", "Open popup message received");
    chrome.action.openPopup();
    sendResponse({ received: true, action: "popup_opened" });
  }
  
  // Log if unknown message type
  if (!["SURESHOPPH_PRODUCT_PAGE", "SURESHOPPH_NOT_PRODUCT_PAGE", "URL_SCAN_PAGE", "OPEN_POPUP", "GET_TAB_ID"].includes(message.type)) {
    debugLog("❓", "UNKNOWN MESSAGE TYPE:", message.type);
    sendResponse({ received: true, action: "unknown_message" });
  }
  
  // Always return true to indicate we will send a response
  return true;
});

// Handle universal URL pages (any website) - ALWAYS SCAN
async function handleUniversalUrlPageMessage(tab) {
  debugLog("🌍", "=== HANDLING UNIVERSAL URL PAGE ===");
  debugLog("🌍", "Tab ID:", tab.id, "URL:", tab.url);
  
  // Skip internal Chrome/extension pages
  if (tab.url && (tab.url.startsWith('chrome://') || 
                  tab.url.startsWith('chrome-extension://') || 
                  tab.url.startsWith('moz-extension://') ||
                  tab.url.startsWith('about:') ||
                  tab.url.startsWith('file:'))) {
    debugLog("🌍", "Skipping internal page:", tab.url);
    return;
  }

  // Wait for initialization if not ready
  if (!isInitialized) {
    debugLog("⏳", "Not initialized, calling initializeExtension...");
    await initializeExtension();
  }
  
  debugLog("🔧", "URL scanning ALWAYS ON - processing URL");
  debugLog("🔧", "Is initialized:", isInitialized);
  
  // Update badge to show URL scanning is active
  chrome.action.setBadgeText({ 
    text: "URL",
    tabId: tab.id 
  });
  chrome.action.setBadgeBackgroundColor({ 
    color: "#3b82f6"
  });
  chrome.action.setTitle({
    title: "URL scanning active - URLs are scanned automatically",
    tabId: tab.id
  });
  debugLog("🎨", "Universal URL badge updated for tab:", tab.id);

  // ALWAYS trigger URL auto-scan (no toggle check needed)
  debugLog("✅", "URL scanning ALWAYS ENABLED, checking URL change...");
  
  // Check if this is a new URL
  const lastUrl = trackedTabs.get(tab.id);
  const hasUrlChanged = lastUrl !== tab.url;
  
  debugLog("🔄", "Last URL for tab", tab.id + ":", lastUrl);
  debugLog("🔄", "Current URL:", tab.url);
  debugLog("🔄", "Has URL changed?", hasUrlChanged);
  
  // Update tracked URL
  trackedTabs.set(tab.id, tab.url);
  debugLog("💾", "Updated tracked URL for universal tab:", tab.id);

  // Trigger auto-scan only if URL has changed
  if (hasUrlChanged) {
    debugLog("🚀", "=== TRIGGERING UNIVERSAL URL AUTO-SCAN ===");
    debugLog("🚀", "URL has changed, calling handleUrlAutoScan");
    debugLog("🚀", "Parameters: tabId =", tab.id, "url =", tab.url);
    handleUrlAutoScan(tab.id, tab.url);
  } else {
    debugLog("⏭️", "Same URL, skipping universal auto-scan");
  }
  
  debugLog("🏁", "=== UNIVERSAL URL PAGE HANDLING COMPLETE ===");
}

async function handleProductPageMessage(tab) {
  debugLog("🔍", "=== HANDLING PRODUCT PAGE ===");
  debugLog("🔍", "Tab ID:", tab.id, "URL:", tab.url);
  
  const isProductPage = /-i\.\d+\.\d+/.test(tab.url);
  debugLog("🔍", "Is product page regex test:", isProductPage);
  debugLog("🔍", "URL pattern test result for", tab.url, ":", /-i\.\d+\.\d+/.test(tab.url));
  
  if (!isProductPage) {
    debugLog("❌", "Not a product page, skipping handling");
    return;
  }
  
  // Wait for initialization if not ready
  if (!isInitialized) {
    debugLog("⏳", "Not initialized, calling initializeExtension...");
    await initializeExtension();
  }
  
  debugLog("🔧", "Product page detected - MANUAL SCAN ONLY");
  
  // Update badge - ALWAYS show manual scan only (no auto-scan)
  debugLog("🎨", "Updating badge for manual scan only:", tab.id);
  chrome.action.setBadgeText({ 
    text: "SCAN",
    tabId: tab.id 
  });
  chrome.action.setBadgeBackgroundColor({ 
    color: "#22c55e"
  });
  chrome.action.setTitle({
    title: "Click to manually scan this Shopee product for safety",
    tabId: tab.id
  });
  debugLog("🎨", "Badge updated for manual scan only:", tab.id);

  // NO AUTO-SCAN FOR PRODUCTS - Only manual scanning available
  debugLog("🔴", "Product auto-scan REMOVED: Only manual scanning available");
  
  debugLog("🏁", "=== PRODUCT PAGE HANDLING COMPLETE ===");
}

async function handleNonProductPageMessage(tab) {
  debugLog("🌐", "=== HANDLING NON-PRODUCT PAGE ===");
  debugLog("🌐", "Tab ID:", tab.id, "URL:", tab.url);
  
  // Handle non-product Shopee pages or other websites
  chrome.action.setBadgeText({ 
    text: "",
    tabId: tab.id 
  });
  debugLog("🎨", "Badge cleared for non-product page");
  
  chrome.action.setTitle({
    title: "SureShop Scanner - URL scanning active",
    tabId: tab.id
  });
  
  debugLog("🏁", "=== NON-PRODUCT PAGE HANDLING COMPLETE ===");
}

// URL auto-scanning function - ALWAYS ACTIVE
function handleUrlAutoScan(tabId, url) {
  debugLog("🌐", "=== STARTING URL AUTO-SCAN ===");
  debugLog("🌐", "Function called with tabId:", tabId, "url:", url);
  
  const tabUrlKey = `url:${tabId}:${url}`;
  debugLog("🔑", "Generated URL key:", tabUrlKey);
  debugLog("🔑", "Current auto-scan tab:", currentAutoScanTab);
  
  if (currentAutoScanTab === tabUrlKey) {
    debugLog("⏭️", "URL auto-scan skipped: same URL already scanned");
    return;
  }
  
  debugLog("📝", "Setting current auto-scan tab to:", tabUrlKey);
  currentAutoScanTab = tabUrlKey;
  
  debugLog("⏰", "Setting 1-second timeout for URL auto-scan");
  setTimeout(async () => {
    debugLog("🚀", "=== URL AUTO-SCAN TIMEOUT TRIGGERED ===");
    debugLog("🚀", "1 second has passed, executing URL scan");
    
    try {
      debugLog("🚀", "Actually starting URL scan for:", url);
      
      // Check if extension is activated
      debugLog("🔐", "Checking for access token...");
      const { accessToken } = await chrome.storage.local.get("accessToken");
      if (!accessToken) {
        debugLog("❌", "URL auto-scan ABORTED: no access token");
        return;
      }
      debugLog("✅", "Access token found for URL scan, length:", accessToken.length);
      
      // Verify tab still exists
      debugLog("🔍", "Verifying tab", tabId, "still exists for URL scan...");
      let tab;
      try {
        tab = await chrome.tabs.get(tabId);
        debugLog("✅", "Tab still exists for URL scan:", tab.url);
      } catch (error) {
        debugLog("❌", "URL auto-scan ABORTED: tab no longer exists");
        return;
      }
      
      if (!tab || tab.url !== url) {
        debugLog("❌", "URL auto-scan ABORTED: tab URL changed");
        debugLog("❌", "Expected URL:", url);
        debugLog("❌", "Actual URL:", tab?.url);
        return;
      }
      
      // Send URL to server for analysis
      const urlData = {
        url: url,
        domain: new URL(url).hostname,
        timestamp: Date.now()
      };
      
      debugLog("🌐", "URL data prepared for server:", urlData);
      debugLog("🌐", "Sending to: http://localhost/php/sureshopwebsite/app/controller/url_scan.php");
      
      // Send to server
      const res = await fetch("http://localhost/php/sureshopwebsite/app/controller/url_scan.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify(urlData)
      });
      
      debugLog("📡", "URL scan server request sent, status:", res.status);
      debugLog("📡", "URL scan response ok:", res.ok);
      
      if (!res.ok) {
        const errorText = await res.text();
        debugLog("❌", "URL scan server error:", res.status, errorText);
        throw new Error(`URL scan server error: ${res.status} ${res.statusText} - ${errorText}`);
      }
      
      const result = await res.json();
      debugLog("✅", "=== URL SCAN SERVER RESPONSE ===");
      debugLog("✅", "URL scan result:", result);
      
      if (result.risk_score !== undefined && result.risk_level !== undefined) {
        debugLog("💾", "Valid URL scan result, storing...");
        
        const storageData = {
          lastAutoScanResult: {
            type: "url",
            risk_score: result.risk_score,
            risk_level: result.risk_level,
            timestamp: Date.now(),
            url: url,
            tabId: tabId,
            domain: urlData.domain
          }
        };
        
        debugLog("💾", "URL storage data:", storageData);
        
        // Store result for popup to display
        await chrome.storage.local.set(storageData);
        debugLog("💾", "URL scan result stored successfully");
        
        // Update badge for URL scan
        debugLog("🎨", "Updating badge for URL risk level:", result.risk_level);
        updateBadgeForUrlRisk(tabId, result.risk_level);
        
        debugLog("🎉", "=== URL AUTO-SCAN COMPLETED SUCCESSFULLY ===");
        debugLog("🎉", "URL risk level:", result.risk_level, "for domain:", urlData.domain);
      } else {
        debugLog("❌", "Invalid URL scan result - missing risk data");
      }
      
    } catch (error) {
      debugLog("❌", "URL auto-scan failed:", error);
    }
  }, 1000); // Faster for URL scans
  
  debugLog("⏰", "URL auto-scan timeout set - will execute in 1 second");
}

// Updated function to handle all tabs
async function updateAllTabs() {
  debugLog("🔄", "=== UPDATING ALL TABS ===");
  try {
    const tabs = await chrome.tabs.query({});
    debugLog("📊", "Found", tabs.length, "open tabs");
    
    for (const tab of tabs) {
      debugLog("📋", "Processing tab:", tab.id, tab.url);
      
      if (tab.url?.includes("shopee.ph")) {
        const isProductPage = /-i\.\d+\.\d+/.test(tab.url);
        if (isProductPage) {
          debugLog("🛍️", "Product page found, updating badge");
          handleProductPageMessage(tab);
        } else {
          debugLog("🌐", "Non-product Shopee page");
          handleNonProductPageMessage(tab);
        }
      } else {
        debugLog("🌍", "Universal URL page, setting up URL scanning");
        handleUniversalUrlPageMessage(tab);
      }
    }
  } catch (error) {
    debugLog("❌", "Error updating tabs:", error);
  }
}

function updateBadgeForUrlRisk(tabId, riskLevel) {
  debugLog("🎨", "=== UPDATING BADGE FOR URL RISK ===");
  debugLog("🎨", "Tab ID:", tabId, "Risk Level:", riskLevel);
  
  let badgeColor;
  let badgeText = "URL";
  
  switch(riskLevel) {
    case "High":
      badgeColor = "#dc2626"; // Red
      break;
    case "Medium":
      badgeColor = "#f59e0b"; // Orange
      break;
    case "Low":
      badgeColor = "#16a34a"; // Green
      break;
    default:
      badgeColor = "#3b82f6"; // Blue
  }
  
  chrome.action.setBadgeText({ text: badgeText, tabId });
  chrome.action.setBadgeBackgroundColor({ color: badgeColor });
  chrome.action.setTitle({
    title: `URL auto-scan complete: ${riskLevel} risk detected. Click to view details.`,
    tabId
  });
  
  debugLog("🎨", "URL badge updated - Text:", badgeText, "Color:", badgeColor);
}

// Enhanced tab handling - detects both new pages AND SPA navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  debugLog("📋", "=== TAB UPDATED EVENT ===");
  debugLog("📋", "Tab ID:", tabId);
  debugLog("📋", "Change info:", changeInfo);
  debugLog("📋", "Tab URL:", tab?.url);
  
  // Only process complete page loads and URL changes
  if (changeInfo.status === "complete" && tab?.url) {
    debugLog("✅", "Page load complete, processing tab:", tabId);
    
    // Determine page type and handle accordingly
    if (tab.url.includes("shopee.ph")) {
      const isProductPage = /-i\.\d+\.\d+/.test(tab.url);
      debugLog("🛍️", "Shopee page detected. Is product page:", isProductPage);
      
      if (isProductPage) {
        handleProductPageMessage(tab);
      } else {
        handleNonProductPageMessage(tab);
      }
    } else {
      debugLog("🌍", "Non-Shopee page, setting up URL scanning");
      handleUniversalUrlPageMessage(tab);
    }
  }
  
  // Handle URL changes (SPA navigation)
  if (changeInfo.url) {
    debugLog("🔄", "URL changed detected:");
    debugLog("🔄", "Tab ID:", tabId);
    debugLog("🔄", "New URL:", changeInfo.url);
    
    // Clear current auto-scan state for URL changes
    const oldTabUrlKey = `url:${tabId}:`;
    if (currentAutoScanTab?.startsWith(oldTabUrlKey)) {
      debugLog("🧹", "Clearing old auto-scan state for URL change");
      currentAutoScanTab = null;
    }
    
    // Process the new URL
    if (changeInfo.url.includes("shopee.ph")) {
      const isProductPage = /-i\.\d+\.\d+/.test(changeInfo.url);
      debugLog("🛍️", "Shopee URL change. Is product page:", isProductPage);
      
      if (isProductPage) {
        const fakeTab = { id: tabId, url: changeInfo.url };
        handleProductPageMessage(fakeTab);
      } else {
        const fakeTab = { id: tabId, url: changeInfo.url };
        handleNonProductPageMessage(fakeTab);
      }
    } else {
      debugLog("🌍", "Non-Shopee URL change, triggering URL scan");
      const fakeTab = { id: tabId, url: changeInfo.url };
      handleUniversalUrlPageMessage(fakeTab);
    }
  }
});

// Handle SPA navigation (as backup)
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  debugLog("🧭", "=== HISTORY STATE UPDATED ===");
  debugLog("🧭", "Tab ID:", details.tabId);
  debugLog("🧭", "URL:", details.url);
  debugLog("🧭", "Frame ID:", details.frameId);
  
  // Only handle main frame navigation
  if (details.frameId !== 0) {
    debugLog("⏭️", "Ignoring sub-frame navigation");
    return;
  }
  
  // Clear any existing auto-scan for this tab
  const tabUrlKey = `url:${details.tabId}:`;
  if (currentAutoScanTab?.startsWith(tabUrlKey)) {
    debugLog("🧹", "Clearing auto-scan state for SPA navigation");
    currentAutoScanTab = null;
  }
  
  // Handle the navigation
  if (details.url.includes("shopee.ph")) {
    const isProductPage = /-i\.\d+\.\d+/.test(details.url);
    debugLog("🛍️", "Shopee SPA navigation. Is product page:", isProductPage);
    
    const fakeTab = { id: details.tabId, url: details.url };
    if (isProductPage) {
      handleProductPageMessage(fakeTab);
    } else {
      handleNonProductPageMessage(fakeTab);
    }
  } else {
    debugLog("🌍", "Non-Shopee SPA navigation, triggering URL scan");
    const fakeTab = { id: details.tabId, url: details.url };
    handleUniversalUrlPageMessage(fakeTab);
  }
});

// Clean up tracked tabs when they're closed
chrome.tabs.onRemoved.addListener((tabId) => {
  debugLog("🗑️", "=== TAB CLOSED ===");
  debugLog("🗑️", "Cleaning up tab:", tabId);
  
  trackedTabs.delete(tabId);
  debugLog("💾", "Removed tracked URL for tab:", tabId);
});

// Log when script finishes loading
debugLog("🚀", "=== BACKGROUND SCRIPT FULLY LOADED ===");
debugLog("🚀", "All event listeners registered");
debugLog("🚀", "URL scanning ALWAYS ON");

// Force initial setup after a short delay
setTimeout(async () => {
  debugLog("🔄", "=== INITIAL SETUP TIMEOUT TRIGGERED ===");
  debugLog("🔄", "Calling initializeExtension and updateAllTabs");
  await initializeExtension();
  updateAllTabs();
}, 1000);