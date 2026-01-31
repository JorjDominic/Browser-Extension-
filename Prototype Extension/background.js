chrome.runtime.onInstalled.addListener(() => {
  console.log("SureShop Security Scanner installed");
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "SURESHOPPH_PRODUCT_PAGE") {
    chrome.action.setBadgeText({ 
      text: "SCAN",
      tabId: sender.tab.id 
    });
    chrome.action.setBadgeBackgroundColor({ 
      color: "#22c55e"
    });
    chrome.action.setTitle({
      title: "Click to scan this Shopee product for safety",
      tabId: sender.tab.id
    });
  }

  if (message.type === "SURESHOPPH_NOT_PRODUCT_PAGE") {
    chrome.action.setBadgeText({ 
      text: "",
      tabId: sender.tab.id 
    });
    chrome.action.setTitle({
      title: "SureShop - Navigate to a Shopee product to scan",
      tabId: sender.tab.id
    });
  }
});

// Handle popup opening
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "OPEN_POPUP") {
    chrome.action.openPopup();
  }
});

// Enhanced tab handling for better content script injection
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url &&
    tab.url.includes("shopee.ph")
  ) {
    // Inject content script if not already present
    chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"]
    }).catch(err => {
      // Content script might already be injected, ignore error
      console.log("Content script injection skipped:", err.message);
    });
  }
});

// Handle navigation within Shopee (SPA)
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  if (details.url.includes("shopee.ph")) {
    chrome.scripting.executeScript({
      target: { tabId: details.tabId },
      files: ["content.js"]
    }).catch(err => {
      console.log("SPA navigation script injection skipped:", err.message);
    });
  }
});

console.log("SureShop background service worker loaded");