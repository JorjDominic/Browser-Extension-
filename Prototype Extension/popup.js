const output = document.getElementById("output");
const scanBtn = document.getElementById("scanBtn");
const activationSection = document.getElementById("activationSection");
const scanSection = document.getElementById("scanSection");
const activateBtn = document.getElementById("activateBtn");
const activationKeyInput = document.getElementById("activationKey");

// On popup open: decide which UI to show
chrome.storage.local.get(["accessToken"], ({ accessToken }) => {
  if (accessToken) {
    activationSection.style.display = "none";
    scanSection.style.display = "block";
    
    // Check for automatic scan results on popup open - ONLY PRODUCT SCANS
    checkForAutoScanResults();
  } else {
    activationSection.style.display = "block";
    scanSection.style.display = "none";
  }
});

function checkForAutoScanResults() {
  // Check if there are recent auto-scan results to display - ONLY PRODUCT SCANS
  chrome.storage.local.get("lastAutoScanResult", ({ lastAutoScanResult }) => {
    if (lastAutoScanResult && isRecentResult(lastAutoScanResult.timestamp)) {
      console.log("Found recent auto-scan result:", lastAutoScanResult);
      
      // ONLY show PRODUCT scan results in the extension popup
      if (lastAutoScanResult.type === "product") {
        console.log("Displaying product scan result");
        showRiskAssessment(
          lastAutoScanResult.risk_score, 
          lastAutoScanResult.risk_level
        );
      } else {
        console.log("Ignoring non-product scan result in extension popup:", lastAutoScanResult.type);
        // Don't show URL scan results in the extension popup
        // URL scan results are shown in the universal popup on the webpage
      }
    } else {
      console.log("No recent product scan results found");
    }
  });
}

function isRecentResult(timestamp) {
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  return (now - timestamp) < fiveMinutes;
}

// Handle activation (ONE TIME) - Updated with better error handling
activateBtn.addEventListener("click", async () => {
  console.log("Activate clicked");
  const key = activationKeyInput.value.trim();
  if (!key) {
    alert("Please enter an activation key");
    return;
  }

  activateBtn.textContent = "Activating...";
  activateBtn.disabled = true;

  try {
    console.log("Sending activation request...");
    
    const res = await fetch(
      "http://localhost/php/sureshopwebsite/app/controller/activate_extension.php",
      {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ activation_key: key })
      }
    );

    console.log("Response status:", res.status);
    console.log("Response headers:", [...res.headers.entries()]);

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const responseData = await res.json();
    console.log("Response data:", responseData);

    // Check for different possible field names
    let accessToken = null;
    
    if (responseData.access_token) {
      accessToken = responseData.access_token;
    } else if (responseData.accessToken) {
      accessToken = responseData.accessToken;
    } else if (responseData.token) {
      accessToken = responseData.token;
    }

    if (accessToken) {
      console.log("Access token found, storing...");
      await chrome.storage.local.set({ 
        accessToken: accessToken,
        activatedAt: Date.now()
      });
      
      activationSection.style.display = "none";
      scanSection.style.display = "block";
      
      alert("Extension activated successfully!");
    } else {
      console.error("No access token in response:", responseData);
      alert("Invalid activation key or server error");
    }

  } catch (error) {
    console.error("Activation error:", error);
    alert("Failed to activate extension. Please check your connection and try again.");
  } finally {
    activateBtn.textContent = "Activate";
    activateBtn.disabled = false;
  }
});

// Clean function to show only PRODUCT risk assessment
function showRiskAssessment(riskScore, riskLevel) {
  const timestamp = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Determine risk message for PRODUCTS
  let riskMessage;
  
  if (riskLevel === 'High') {
    riskMessage = 'This product appears risky. Exercise extreme caution and consider avoiding this purchase.';
  } else if (riskLevel === 'Medium') {
    riskMessage = 'This product has some risk factors. Please review carefully before purchasing.';
  } else {
    riskMessage = 'This product appears to be relatively safe based on current analysis.';
  }

  // Clear the output completely and create clean HTML
  output.innerHTML = '';
  output.style.padding = '20px';
  output.style.textAlign = 'center';
  output.style.fontFamily = 'Poppins, sans-serif';
  
  const container = document.createElement('div');
  container.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 0;
    margin: 0;
    box-shadow: none;
    border: none;
  `;
  
  container.innerHTML = `
    <div class="result-card">
      <div style="background: linear-gradient(135deg, var(--dash-success) 0%, rgba(34, 197, 94, 0.05) 100%); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 6px; padding: 6px 10px; margin-bottom: 12px; font-size: 10px; color: var(--dash-success); text-align: center; display: flex; align-items: center; justify-content: center; gap: 6px;">
        <i class="fas fa-shield-alt"></i> PRODUCT SCANNED
      </div>

      <div class="risk-badge risk-${riskLevel.toLowerCase()}"></div>

      <div class="risk-level-text risk-${riskLevel.toLowerCase()}">
        PRODUCT RISK: ${riskLevel.toUpperCase()}
      </div>

      <div class="risk-score-text">
        Risk Score: ${riskScore} / 100
      </div>

      <div class="risk-message">
        ${riskMessage}
      </div>

      <div class="scan-time">
        Scanned: ${timestamp}
      </div>
    </div>
  `;
  
  output.appendChild(container);
}

// Enhanced manual scan function - PRODUCTS ONLY
function performScan(isAutomatic = false) {
  chrome.storage.local.get("accessToken", ({ accessToken }) => {
    if (!accessToken) {
      output.textContent = "❌ Extension not activated. Please enter your activation key.";
      return;
    }

    scanBtn.textContent = isAutomatic ? "🔄 Auto-scanning..." : "🔄 Scanning...";
    scanBtn.disabled = true;
    output.textContent = "🔍 Collecting product information...";

    // Get current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) {
        output.textContent = "❌ Unable to access current tab.";
        resetButton();
        return;
      }

      const currentTab = tabs[0];
      console.log("Current tab URL:", currentTab.url);

      // Check if it's a Shopee product page
      if (!currentTab.url.includes("shopee.ph")) {
        output.textContent = "❌ This extension only works on Shopee product pages.";
        resetButton();
        return;
      }

      if (!/-i\.\d+\.\d+/.test(currentTab.url)) {
        output.textContent = "❌ Please navigate to a specific Shopee product page to scan.";
        resetButton();
        return;
      }

      // Send message to content script to extract data
      chrome.tabs.sendMessage(
        currentTab.id,
        { type: "EXTRACT_DATA" },
        async (response) => {
          if (chrome.runtime.lastError) {
            console.error("Message error:", chrome.runtime.lastError.message);
            output.textContent = "❌ Unable to scan this page. Please refresh and try again.";
            resetButton();
            return;
          }

          if (!response || !response.success) {
            output.textContent = "❌ Failed to extract product data. Please try again.";
            resetButton();
            return;
          }

          console.log("Extracted data:", response);
          console.log("Product name from extraction:", response.product_name);
          output.textContent = "📡 Analyzing product data...";

          try {
            // Format data for scan.php (PRODUCT ENDPOINT)
            const productData = {
              url: currentTab.url,
              product_name: response.product_name,
              price: response.price,
              sold_count: response.sold_count,
              rating: response.rating,
              rating_count: response.rating_count,
              response_rate: response.response_rate,
              shop_age: response.shop_age,
              seller_name: response.seller_name,
              profile_url: response.profile_url,
              image_count: response.image_count
            };

            console.log("Product data to send to scan.php:", productData);

            const scanResponse = await fetch(
              "http://localhost/php/sureshopwebsite/app/controller/scan.php",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${accessToken}`
                },
                body: JSON.stringify(productData)
              }
            );

            if (!scanResponse.ok) {
              const errorText = await scanResponse.text();
              console.error("Server error:", scanResponse.status, errorText);
              throw new Error(`Server error: ${scanResponse.status}`);
            }

            const result = await scanResponse.json();
            console.log("Scan result:", result);

            if (result.risk_score !== undefined && result.risk_level !== undefined) {
              // Store result for later retrieval
              const storageData = {
                lastAutoScanResult: {
                  type: "product",
                  risk_score: result.risk_score,
                  risk_level: result.risk_level,
                  timestamp: Date.now(),
                  url: currentTab.url,
                  tabId: currentTab.id
                }
              };
              
              await chrome.storage.local.set(storageData);
              
              // Show results
              showRiskAssessment(result.risk_score, result.risk_level);
            } else {
              output.textContent = "❌ Invalid response from server. Please try again.";
            }
          } catch (error) {
            console.error("Scan failed:", error);
            output.textContent = `❌ Scan failed: ${error.message}`;
          } finally {
            resetButton();
          }
        }
      );
    });
  });
}

// Manual scan
scanBtn.addEventListener("click", () => {
  performScan(false);
});

function resetButton() {
  scanBtn.textContent = "🛡️ Manual Scan";
  scanBtn.disabled = false;
}