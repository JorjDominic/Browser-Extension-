const output = document.getElementById("output");
const scanBtn = document.getElementById("scanBtn");
const activationSection = document.getElementById("activationSection");
const scanSection = document.getElementById("scanSection");
const activateBtn = document.getElementById("activateBtn");
const activationKeyInput = document.getElementById("activationKey");

// On popup open: decide which UI to show
chrome.storage.local.get("accessToken", ({ accessToken }) => {
  if (accessToken) {
    activationSection.style.display = "none";
    scanSection.style.display = "block";
  } else {
    activationSection.style.display = "block";
    scanSection.style.display = "none";
  }
});

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
      const errorText = await res.text();
      console.error("Server error:", errorText);
      throw new Error(`Server responded with ${res.status}: ${errorText}`);
    }

    const responseData = await res.json();
    console.log("Response data:", responseData);

    // Check for different possible field names
    const accessToken = responseData.access_token || 
                       responseData.accessToken || 
                       responseData.token ||
                       responseData.access_key;

    if (!accessToken) {
      console.error("No access token in response:", responseData);
      throw new Error("No access token received from server");
    }

    await chrome.storage.local.set({ accessToken: accessToken });
    console.log("Token saved successfully");

    activationSection.style.display = "none";
    scanSection.style.display = "block";
    
    alert("Extension activated successfully!");

  } catch (error) {
    console.error("Activation error:", error);
    alert(`Activation failed: ${error.message}`);
  } finally {
    activateBtn.textContent = "Activate";
    activateBtn.disabled = false;
  }
});

// Clean function to show only risk assessment - COMPLETELY FIXED
function showRiskAssessment(riskScore, riskLevel) {
  const timestamp = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Determine risk color and icon
  let riskColor, riskIcon, riskMessage;
  
  if (riskLevel === 'High') {
    riskColor = '#dc2626';
    riskIcon = '';
    riskMessage = 'High risk detected! Exercise extreme caution.';
  } else if (riskLevel === 'Medium') {
    riskColor = '#f59e0b';
    riskIcon = '';
    riskMessage = 'Moderate risk detected. Proceed with caution.';
  } else {
    riskColor = '#16a34a';
    riskIcon = '';
    riskMessage = 'Low risk detected. Appears safe to proceed.';
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

    <div class="risk-badge risk-${riskLevel.toLowerCase()}"></div>

    <div class="risk-level-text risk-${riskLevel.toLowerCase()}">
      RISK LEVEL: ${riskLevel}
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

// Manual scan
scanBtn.addEventListener("click", () => {
  chrome.storage.local.get("accessToken", ({ accessToken }) => {
    if (!accessToken) {
      output.textContent = "❌ Extension not activated.";
      return;
    }

    output.textContent = "🔍 Scanning Shopee page...\nAnalyzing seller data...";
    scanBtn.textContent = "Scanning...";
    scanBtn.disabled = true;

    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      console.log("Current tab:", tab);
      
      if (!tab || !tab.url.includes("shopee.")) {
        output.textContent = "❌ Not a Shopee page.\nPlease navigate to a product page.";
        resetButton();
        return;
      }

      console.log("Sending message to content script...");
      
      // First, try to inject the content script
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"]
      }).then(() => {
        console.log("Content script injected successfully");
        
        // Small delay to ensure content script is ready
        setTimeout(() => {
          chrome.tabs.sendMessage(
            tab.id,
            { type: "COLLECT_PAGE_DATA" },
            response => {
              console.log("Response from content script:", response);
              resetButton();

              if (chrome.runtime.lastError) {
                console.error("Runtime error:", chrome.runtime.lastError);
                output.textContent = "❌ Content script error:\n" + chrome.runtime.lastError.message;
                return;
              }

              if (!response) {
                output.textContent = "❌ No response from content script.\nTry reloading the page.";
                return;
              }

              if (response.error) {
                output.textContent = "❌ Content script error:\n" + response.error;
                return;
              }

              // Show scanning status
              output.textContent = "📊 Data collected. Analyzing risk...";

              // Enhanced server communication with detailed debugging
              fetch("http://localhost/php/sureshopwebsite/app/controller/scan.php", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${accessToken}`
                },
                body: JSON.stringify(response)
              })
              .then(async res => {
                const text = await res.text();
                console.log("RAW SERVER RESPONSE:", text);
                console.log("Response status:", res.status);
                console.log("Response headers:", [...res.headers.entries()]);
                
                if (!res.ok) {
                  throw new Error(`Server responded with ${res.status}: ${text}`);
                }
                
                try {
                  return JSON.parse(text);
                } catch (parseError) {
                  console.error("JSON parse error:", parseError);
                  console.error("Raw response that failed to parse:", text);
                  throw new Error(`Invalid JSON response: ${text}`);
                }
              })
              .then(result => {
                console.log("PARSED SERVER RESULT:", result);
                console.log("Risk score type:", typeof result.risk_score, "Value:", result.risk_score);
                console.log("Risk level type:", typeof result.risk_level, "Value:", result.risk_level);
                
                // Check if the values are actually defined
                if (result.risk_score === undefined || result.risk_level === undefined) {
                  console.error("UNDEFINED VALUES DETECTED!");
                  console.error("Full result object:", JSON.stringify(result, null, 2));
                  
                  output.textContent = `❌ ERROR: Server returned incomplete risk assessment\nFull response: ${JSON.stringify(result)}`;
                } else {
                  // Show only risk assessment results
                  showRiskAssessment(result.risk_score, result.risk_level);
                }
              })
              .catch((error) => {
                console.error("Server error:", error);
                output.textContent = `❌ Failed to analyze data: ${error.message}`;
              });
              
            }
          );
        }, 1000);
      }).catch(err => {
        console.error("Script injection failed:", err);
        output.textContent = "❌ Failed to inject content script:\n" + err.message;
        resetButton();
      });
    });
  });
});

function resetButton() {
  scanBtn.textContent = "🛡️ Scan Product";
  scanBtn.disabled = false;
}